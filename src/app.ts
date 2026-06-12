import type { AppConfig } from './config/app-config.js'
import { createRouter } from './http/router.js'
import { SlackWebhookClient } from './integrations/slack/slack-webhook.client.js'
import { composeMiddleware } from './middleware/compose.js'
import { createCorsMiddleware } from './middleware/cors.middleware.js'
import { createErrorMiddleware } from './middleware/error.middleware.js'
import { requestIdMiddleware } from './middleware/request-id.middleware.js'
import { createTaskSummaryHandler } from './routes/task-summary.route.js'
import { TaskSummaryService } from './services/task-summary.service.js'
import type { HttpHandler, RouteTable } from './types/http.js'
import type { Logger } from './utils/logger.js'

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
  const routes: RouteTable = {
    '/slack/task-summary': {
      POST: createTaskSummaryHandler(taskSummaryService),
    },
  }

  return composeMiddleware(
    [
      createErrorMiddleware(dependencies.logger),
      requestIdMiddleware,
      createCorsMiddleware(config.allowedOrigins),
    ],
    createRouter(routes),
  )
}
