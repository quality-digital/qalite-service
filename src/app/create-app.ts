import { sendSlackMessage } from '../clients/slack-webhook.client.js'
import type { AppConfig } from '../config/app-config.js'
import { composeMiddleware } from '../middlewares/compose.js'
import { createCorsMiddleware } from '../middlewares/cors.middleware.js'
import { createErrorMiddleware } from '../middlewares/error.middleware.js'
import { requestIdMiddleware } from '../middlewares/request-id.middleware.js'
import { HttpError } from '../utils/http-error.js'
import type { HttpHandler } from '../utils/http.js'
import type { Logger } from '../utils/logger.js'
import { readJsonBody } from '../utils/request.js'
import { sendJson } from '../utils/response.js'
import { validateTaskSummary } from '../validators/task-summary.validator.js'

export const createApp = (config: AppConfig, logger: Logger): HttpHandler => {
  const handleRequest: HttpHandler = async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    if (pathname !== '/slack/task-summary') {
      throw new HttpError(404, 'Not found.')
    }
    if (req.method !== 'POST') {
      throw new HttpError(405, 'Method not allowed.')
    }

    const input = validateTaskSummary(await readJsonBody(req))
    await sendSlackMessage(input.message, input.webhookUrl, config.slack.requestTimeoutMs)
    sendJson(res, 200, { message: 'Slack task summary sent.' })
  }

  return composeMiddleware(
    [
      createErrorMiddleware(logger),
      requestIdMiddleware,
      createCorsMiddleware(config.allowedOrigins),
    ],
    handleRequest,
  )
}
