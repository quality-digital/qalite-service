# QaLite Service

Serviço HTTP em Node.js e TypeScript responsável por receber um resumo de execução de QA, formatá-lo e enviá-lo para um webhook do Slack. O mesmo ponto de entrada atende ao servidor local e à função serverless publicada na Vercel.

## Requisitos

- Node.js 20 ou superior;
- npm (incluído na instalação do Node.js);
- uma URL de Incoming Webhook do Slack para testar o envio real;
- Git para usar os hooks de qualidade do repositório.

As versões exatas das dependências npm são registradas em `package-lock.json`. Use `npm ci` em vez de `npm install` em CI ou quando quiser uma instalação totalmente reproduzível.

## Configuração local

1. Clone o repositório e entre na pasta do projeto.
2. Instale as dependências:

   ```bash
   npm ci
   ```

3. Crie o arquivo local de ambiente:

   ```bash
   cp .env.example .env
   ```

4. Ajuste as variáveis, se necessário:

   | Variável          | Obrigatória | Padrão                                           | Descrição                                                                                            |
   | ----------------- | ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
   | `PORT`            | Não         | `3000`                                           | Porta do servidor HTTP local.                                                                        |
   | `ALLOWED_ORIGINS` | Não         | Aplicação local em `5173` e frontend de produção | Lista de origens CORS separadas por vírgula.                                                         |
   | `NODE_ENV`        | Não         | Ambiente local                                   | Quando vale `production`, impede que o processo abra uma porta e mantém apenas o handler serverless. |

> Não inclua credenciais ou URLs privadas de webhook em arquivos versionados. O `.gitignore` já exclui os arquivos `.env` locais.

## Comandos disponíveis

| Comando             | Finalidade                                                           |
| ------------------- | -------------------------------------------------------------------- |
| `npm run dev`       | Compila o TypeScript continuamente durante o desenvolvimento.        |
| `npm run build`     | Remove artefatos antigos de `dist/` e gera uma compilação limpa.     |
| `npm start`         | Inicia o JavaScript já compilado em `dist/index.js`.                 |
| `npm run lint`      | Verifica a formatação de todos os arquivos suportados pelo Prettier. |
| `npm run typecheck` | Executa o TypeScript em modo estrito sem gerar arquivos.             |
| `npm run format`    | Aplica a formatação do Prettier.                                     |
| `npm run check`     | Executa lint, typecheck e build, na mesma ordem usada pela CI.       |

Para executar o serviço localmente em modo semelhante ao de produção:

```bash
npm run build
npm start
```

O modo `dev` observa e recompila os arquivos, mas não reinicia o processo HTTP. Em dois terminais, use `npm run dev` no primeiro e `npm start` no segundo; reinicie o segundo quando quiser carregar a nova compilação.

## API

### `POST /slack/task-summary`

Aceita uma mensagem pronta ou dados estruturados para a montagem do resumo.

#### Mensagem pronta

```json
{
  "webhookUrl": "https://hooks.slack.com/services/...",
  "message": "Execução finalizada com sucesso."
}
```

#### Resumo estruturado

```json
{
  "webhookUrl": "https://hooks.slack.com/services/...",
  "environmentSummary": {
    "identifier": "Homologação",
    "totalTimeMs": 125000,
    "scenariosCount": 12,
    "executedScenariosCount": 12,
    "fix": { "type": "bug", "value": 2 },
    "jira": "QA-123",
    "suiteName": "Regressão",
    "suiteDetails": "Checkout",
    "participantsCount": 2,
    "monitoredUrls": ["https://example.com"],
    "attendees": [{ "name": "Pessoa QA", "email": "qa@example.com" }, "Pessoa convidada"]
  }
}
```

Respostas relevantes:

- `200`: resumo enviado;
- `400`: corpo JSON inválido, resumo ausente ou webhook ausente;
- `403`: origem bloqueada pela configuração CORS;
- `404`: rota inexistente;
- `405`: método HTTP não permitido;
- `413`: corpo maior que 1 MiB;
- `500`: erro inesperado ou rejeição do webhook remoto.

A requisição de preflight `OPTIONS` recebe `204` quando a origem é permitida.

## Estrutura do projeto

```text
src/
├── application/
│   ├── ports/             # Contratos usados pelos casos de uso
│   └── usecases/          # Orquestração da regra de aplicação
├── domain/
│   ├── entities/          # Tipos do payload de resumo
│   └── services/          # Formatação da mensagem do Slack
├── infrastructure/slack/  # Integração concreta com o webhook
├── interfaces/http/       # CORS, parsing, respostas e roteamento HTTP
├── config.ts              # Leitura e normalização do ambiente
├── errors.ts              # Erros HTTP conhecidos
├── index.ts               # Entrada local e serverless
└── server.ts              # Composição e tratamento das requisições
```

O fluxo principal é: rota HTTP → `SendTaskSummaryUseCase` → `TaskSummaryFormatter` → `SlackWebhookNotifier`. Mantenha as regras de formatação no domínio e detalhes de rede na infraestrutura.

## Como contribuir

1. Crie uma branch a partir de `main`; commits e pushes diretos em `main`, `master` e `develop` são bloqueados pelos hooks locais.
2. Faça alterações pequenas e focadas, sem misturar refatorações sem relação com a correção ou funcionalidade.
3. Preserve o contrato HTTP e o formato visual das mensagens, a menos que a mudança tenha sido explicitamente solicitada.
4. Adicione ou atualize documentação quando alterar payloads, variáveis ou comandos.
5. Antes de abrir o pull request, execute:

   ```bash
   npm run check
   ```

6. Use commits no padrão [Conventional Commits](https://www.conventionalcommits.org/), por exemplo:

   ```text
   fix: handle empty Slack messages
   feat: add execution owner to task summary
   docs: document local environment
   ```

7. Descreva no pull request o motivo da mudança, o comportamento afetado, como validar e qualquer risco conhecido.

### Hooks locais

O `npm ci` executa o script `prepare` e configura o Husky:

- `pre-commit`: formata arquivos staged com `lint-staged` e bloqueia commits em branches protegidas;
- `commit-msg`: valida a mensagem com Commitlint;
- `pre-push`: bloqueia pushes em branches protegidas.

Se um hook alterar arquivos durante o commit, revise o diff e adicione novamente os arquivos formatados antes de repetir o commit. Não ignore hooks em alterações normais; se houver uma limitação excepcional de ambiente, registre-a no pull request.

## Qualidade e CI

A configuração TypeScript usa modo estrito, rejeita símbolos sem uso e não emite JavaScript quando há erro. O Prettier é a única ferramenta de estilo, evitando regras duplicadas entre formatadores e linters.

A workflow de CI roda em pull requests para `main` e também pode ser iniciada manualmente. Ela instala as dependências com `npm ci` e executa `npm run check` em Node.js 20.

O projeto ainda não possui uma suíte automatizada de testes. Mudanças de regra de negócio devem incluir testes assim que uma estratégia de execução TypeScript for adotada; até lá, valide manualmente os códigos HTTP e o conteúdo enviado a um webhook controlado.

## Deploy

A Vercel usa `src/index.ts` como função Node e define `NODE_ENV=production`. Nesse modo o arquivo exporta somente o handler HTTP; o servidor com `listen()` é criado apenas em execução local.

Antes do deploy, confirme:

- `npm run check` concluído com sucesso;
- origens de produção presentes em `ALLOWED_ORIGINS`;
- nenhuma URL de webhook ou credencial versionada;
- frontend preparado para tratar respostas `4xx` e `5xx`.

## Solução de problemas

- **`Webhook URL is required.`**: envie `webhookUrl` no JSON; ele não é lido do ambiente.
- **`CORS origin not allowed.`**: adicione a origem exata em `ALLOWED_ORIGINS`, sem barra final, e reinicie o processo.
- **A alteração não apareceu com `npm run dev`**: o comando recompila, mas não reinicia o servidor; reinicie `npm start`.
- **A porta já está em uso**: altere `PORT` no `.env`.
- **Falha do Slack retorna `500`**: confirme se o webhook está ativo e se o ambiente possui acesso de rede ao Slack.

## Licença

MIT.
