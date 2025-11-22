import { config } from './config.js'
import { requestHandler, server } from './server.js'

if (!config.isProduction) {
  server.listen(config.port, () => {
    console.log(`QaLite-Servidor listening on http://localhost:${config.port}`)
  })
}

export default requestHandler
