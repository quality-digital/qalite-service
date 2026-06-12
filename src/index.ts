import { createServer } from 'node:http'

import { config } from './config.js'
import { requestHandler } from './server.js'

if (!config.isProduction) {
  createServer(requestHandler).listen(config.port)
}

export default requestHandler
