# QaLite Service

Serviço HTTP em Node.js e TypeScript que recebe uma mensagem de resumo de execução de QA e a encaminha para um Incoming Webhook do Slack. O mesmo handler atende ao servidor HTTP local e à função serverless publicada na Vercel.

## Sumário

- [Requisitos](#requisitos)
- [Primeiros passos](#primeiros-passos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [API](#api)
- [Arquitetura](#arquitetura)
- [Testes e qualidade](#testes-e-qualidade)
- [Como contribuir](#como-contribuir)
- [Deploy](#deploy)
- [Solução de problemas](#solução-de-problemas)

## Requisitos

- Node.js 20 ou superior;
- npm, incluído na instalação do Node.js;
- Git, necessário para os hooks locais;
- uma URL de Incoming Webhook do Slack somente quando for testar uma integração real.

O serviço não possui dependências npm de produção: usa as APIs nativas de HTTP, `fetch`, testes e leitura de arquivos do Node.js. As ferramentas de desenvolvimento estão fixadas por `package-lock.json`; prefira `npm ci` para obter uma instalação reproduzível.

## Primeiros passos

1. Clone o repositório e acesse sua pasta.
2. Instale as dependências:

   ```bash
   npm ci
   ```

3. Crie o arquivo de ambiente local:

   ```bash
   cp .env.example .env
   ```

4. Gere o build e inicie o servidor:

   ```bash
   npm run build
   npm start
   ```

5. Envie uma requisição de teste substituindo a URL do webhook:

   ```bash
   curl --request POST http://localhost:3000/slack/task-summary \
     --header 'Content-Type: application/json' \
     --data '{
       "webhookUrl": "https://hooks.slack.com/services/...",
       "message": "Execução finalizada com sucesso."
     }'
   ```

> Nunca adicione URLs privadas de webhook, tokens ou outros segredos ao repositório. Arquivos `.env` locais são ignorados pelo Git.

## Variáveis de ambiente

| Variável                   | Obrigatória | Padrão                                           | Descrição                                                                                              |
| -------------------------- | ----------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `PORT`                     | Não         | `3000`                                           | Porta do servidor HTTP local.                                                                          |
| `ALLOWED_ORIGINS`          | Não         | Aplicação local em `5173` e frontend de produção | Lista de origens CORS exatas, separadas por vírgula e sem barra final.                                 |
| `SLACK_REQUEST_TIMEOUT_MS` | Não         | `5000`                                           | Tempo máximo, em milissegundos, para a chamada ao webhook do Slack.                                    |
| `NODE_ENV`                 | Não         | Ambiente local                                   | Quando vale `production`, não abre uma porta local e mantém apenas a exportação do handler serverless. |

A aplicação carrega `.env` da raiz quando o arquivo existe. Variáveis já definidas no processo têm precedência sobre o arquivo.

## Comandos

| Comando             | Finalidade                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run clean`     | Remove `dist/` para evitar artefatos obsoletos.                            |
| `npm run build`     | Executa a limpeza e compila `src/` para `dist/`.                           |
| `npm start`         | Inicia o JavaScript compilado em `dist/index.js`.                          |
| `npm run dev`       | Recompila TypeScript continuamente; não reinicia o processo HTTP.          |
| `npm run lint`      | Verifica a formatação dos arquivos com Prettier.                           |
| `npm run typecheck` | Valida os tipos em modo estrito sem emitir arquivos.                       |
| `npm test`          | Gera um build limpo e executa os testes nativos do Node.js.                |
| `npm run format`    | Aplica a formatação do Prettier.                                           |
| `npm run check`     | Executa lint, typecheck, build e testes, na mesma sequência usada pela CI. |

Para trabalhar em modo de observação, execute `npm run dev` em um terminal. Em outro terminal, execute `npm start` e reinicie esse processo quando quiser carregar a compilação mais recente.

## API

### `POST /slack/task-summary`

Recebe uma mensagem pronta e a envia ao webhook informado na própria requisição.

```json
{
  "webhookUrl": "https://hooks.slack.com/services/...",
  "message": "Execução finalizada com sucesso."
}
```

A mensagem e a URL são normalizadas com `trim()` antes do envio. Campos vazios são rejeitados.

#### Respostas

| Status | Situação                                                                |
| ------ | ----------------------------------------------------------------------- |
| `200`  | Resumo enviado ao Slack.                                                |
| `204`  | Preflight CORS `OPTIONS` aceito.                                        |
| `400`  | JSON inválido, campos ausentes ou URL fora dos hosts oficiais do Slack. |
| `403`  | Origem bloqueada pela configuração CORS.                                |
| `404`  | Rota inexistente.                                                       |
| `405`  | Método HTTP não permitido para uma rota existente.                      |
| `413`  | Corpo da requisição maior que 1 MiB.                                    |
| `502`  | Timeout, indisponibilidade ou rejeição do webhook remoto do Slack.      |
| `500`  | Falha interna inesperada.                                               |

O serviço não persiste o conteúdo recebido e não registra a URL do webhook. Ainda assim, trate o payload como informação sensível durante depuração e observabilidade.

## Arquitetura

```text
src/
├── controllers/                    # Entrada e saída das requisições
├── services/                       # Orquestração do fluxo de comunicação
├── clients/                        # Comunicação com APIs e sistemas externos
├── routes/                         # Rotas expostas e roteador HTTP
├── middlewares/                    # CORS, request ID, erros e composição
├── mappers/                        # Transformação de payloads externos
├── validators/                     # Validações e normalização reutilizáveis
├── utils/                          # HTTP, erros, tipos e logging compartilhados
├── config/                         # Ambiente, defaults e configuração tipada
└── app/                            # Composição, handler e inicialização da aplicação

test/
└── server.test.mjs                 # Testes HTTP com o runner nativo do Node.js
```

Fluxo principal:

1. `app/index.ts` exporta o handler e, fora de produção, cria o servidor local;
2. `app/create-app.ts` monta dependências, serviços, rotas e middlewares sem executar I/O;
3. os middlewares tratam erro, request ID e CORS antes do roteador;
4. o controller lê e valida o JSON e delega a operação ao serviço;
5. o serviço orquestra o cliente Slack, que mapeia o payload, executa a chamada externa com timeout e converte falhas em `502`;
6. o middleware de erro mantém respostas públicas estáveis e registra falhas inesperadas sem payloads ou segredos.

### Onde colocar mudanças

- middlewares leves e transversais: `src/middlewares/`;
- entrada, validação e resposta da operação: `src/controllers/`;
- validação e normalização de contratos: `src/validators/`;
- orquestração de casos de uso: `src/services/`;
- integrações e chamadas externas: `src/clients/`;
- definição e resolução de rotas: `src/routes/`;
- transformação de payloads externos: `src/mappers/`;
- parsing, respostas, erros e tipos compartilhados: `src/utils/`;
- configuração tipada: `src/config/` e `.env.example`;
- montagem de dependências e inicialização: `src/app/`.

Evite criar uma nova camada ou abstração para um único uso sem uma necessidade concreta. Prefira funções pequenas, tipos próximos do código que os consome e APIs nativas do Node.js quando elas atendem ao requisito sem comprometer legibilidade.

## Testes e qualidade

Os testes usam `node:test`, iniciam o handler em uma porta efêmera e substituem apenas a chamada externa ao Slack. A suíte cobre:

- envio bem-sucedido e normalização dos campos;
- JSON malformado;
- mensagem e webhook ausentes ou inválidos;
- timeout/sinal e falhas da integração Slack;
- request ID, bloqueio e preflight CORS;
- rota inexistente e método não permitido.

Execute toda a validação antes de abrir um pull request:

```bash
npm run check
```

O TypeScript opera em modo estrito, rejeita símbolos sem uso e não emite JavaScript quando há erro. O Prettier concentra as regras de estilo, evitando configuração duplicada com outro linter. A CI usa Node.js 20, instala com `npm ci` e executa o mesmo comando `npm run check`.

Ao corrigir um bug, adicione um teste que falhe sem a correção. Ao alterar o contrato HTTP, atualize os testes e este README no mesmo pull request.

## Como contribuir

### Fluxo recomendado

1. Atualize sua cópia de `main` e crie uma branch curta e descritiva.
2. Instale dependências com `npm ci`.
3. Faça uma alteração focada, preservando o contrato HTTP e o comportamento existente quando não houver pedido explícito para mudá-los.
4. Atualize testes, `.env.example` e documentação quando aplicável.
5. Execute `npm run check`.
6. Revise `git diff` e confirme que artefatos, segredos e mudanças sem relação não foram incluídos.
7. Crie um commit no padrão Conventional Commits.
8. Abra um pull request descrevendo motivação, solução, validação e riscos.

### Convenções de código

- use TypeScript estrito e imports ESM com extensão `.js`, como exigido pelo modo `NodeNext`;
- não use `any` para contornar validações sem justificar a exceção;
- mantenha mensagens públicas de erro estáveis, pois clientes podem exibi-las;
- não registre payloads completos nem URLs de webhook;
- preserve o limite de corpo e a política CORS ao alterar a camada HTTP;
- não adicione uma dependência para uma funcionalidade pequena já coberta pelo Node.js;
- execute `npm run format` antes de finalizar mudanças extensas de texto ou código.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
fix: reject blank webhook URLs
feat: support a new summary endpoint
test: cover Slack failure responses
docs: clarify local setup
chore: simplify build scripts
```

O `commit-msg` valida a mensagem com Commitlint. Os hooks também impedem commit ou push direto nas branches `main`, `master` e `develop`.

### Hooks locais

O script `prepare`, executado durante `npm ci`, configura o Husky:

- `pre-commit`: formata arquivos staged com `lint-staged` e valida a branch;
- `commit-msg`: valida a mensagem do commit;
- `pre-push`: valida a branch.

Se o hook de pre-commit formatar um arquivo, revise o resultado, adicione-o novamente ao stage e repita o commit. Não ignore os hooks em alterações normais.

### Checklist do pull request

- [ ] mudança pequena e com objetivo claro;
- [ ] nenhuma credencial, URL privada ou artefato gerado foi versionado;
- [ ] contrato HTTP e CORS foram preservados ou documentados;
- [ ] testes cobrem o comportamento alterado;
- [ ] `README.md` e `.env.example` foram atualizados quando necessário;
- [ ] `npm run check` passou localmente;
- [ ] riscos e passos de validação manual foram descritos.

## Deploy

A Vercel usa `src/index.ts` como função Node e define `NODE_ENV=production`. Nesse ambiente, o módulo exporta o handler sem executar `listen()`. Em execução local, o mesmo módulo cria um servidor na porta configurada.

Antes do deploy, confirme:

- `npm run check` concluído com sucesso;
- origens de produção presentes em `ALLOWED_ORIGINS`;
- nenhuma credencial ou URL de webhook versionada;
- clientes preparados para respostas `4xx` e `5xx`;
- webhook real validado em ambiente controlado, se a integração tiver mudado.

## Solução de problemas

- **`Webhook URL is required.`**: envie `webhookUrl` no JSON; o serviço não lê essa URL do ambiente.
- **`Message is required.`**: envie `message` com pelo menos um caractere não branco.
- **`CORS origin not allowed.`**: adicione a origem exata em `ALLOWED_ORIGINS`, sem barra final, e reinicie o processo.
- **A alteração não apareceu com `npm run dev`**: o comando recompila, mas não reinicia `npm start`.
- **A porta já está em uso**: altere `PORT` no `.env`.
- **Falha do Slack retorna `502`**: confirme se o webhook está ativo e se o ambiente possui acesso de rede ao Slack.
- **O hook alterou arquivos durante o commit**: revise os arquivos, execute `git add` novamente e repita o commit.

## Licença

MIT.
