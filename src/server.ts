import { createApp } from './app.js'
import { config } from './config/app-config.js'
import { logger } from './utils/logger.js'

export const requestHandler = createApp(config, { logger })
