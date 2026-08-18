import { SlackWebhookClient } from '../clients/slack-webhook.client.js'
import type { AppConfig } from '../config/app-config.js'
import { composeMiddleware } from '../middlewares/compose.js'
import { createCorsMiddleware } from '../middlewares/cors.middleware.js'
import { createErrorMiddleware } from '../middlewares/error.middleware.js'
import { requestIdMiddleware } from '../middlewares/request-id.middleware.js'
import { createRouter } from '../routes/router.js'
import { createRoutes } from '../routes/routes.js'
import { TaskSummaryService } from '../services/task-summary.service.js'
import type { HttpHandler } from '../utils/http.js'
import type { Logger } from '../utils/logger.js'

export interface AppDependencies {
  readonly fetchImplementation?: typeof fetch
  readonly logger: Logger
}

export const createApp = (
  config: AppConfig,
  dependencies: AppDependencies,
): HttpHandler => {
  const slackClient = new SlackWebhookClient(
    config.slack.requestTimeoutMs,
    dependencies.fetchImplementation,
  )
  const taskSummaryService = new TaskSummaryService(slackClient)

  return composeMiddleware(
    [
      createErrorMiddleware(dependencies.logger),
      requestIdMiddleware,
      createCorsMiddleware(config.allowedOrigins),
    ],
    createRouter(createRoutes(taskSummaryService)),
  )
}
