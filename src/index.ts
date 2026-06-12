import { createServer } from 'node:http'

import { config } from './config/app-config.js'
import { requestHandler } from './server.js'
import { logger } from './utils/logger.js'

if (!config.isProduction) {
  createServer(requestHandler).listen(config.port, () => {
    logger.info('HTTP server started', { port: config.port })
  })
}

export default requestHandler
