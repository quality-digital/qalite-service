import { config } from '../config/app-config.js'
import { logger } from '../utils/logger.js'
import { createApp } from './create-app.js'

export const requestHandler = createApp(config, logger)
