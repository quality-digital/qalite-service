import type { IncomingMessage, ServerResponse } from 'node:http'

import { config } from './config.js'
import { HttpError } from './errors.js'
import { SendTaskSummaryUseCase } from './application/usecases/send-task-summary.js'
import { SlackWebhookNotifier } from './infrastructure/slack/slack-webhook-notifier.js'
import { applyCors } from './interfaces/http/cors.js'
import { json } from './interfaces/http/http-response.js'
import { HttpRouter } from './interfaces/http/router.js'
import { buildRouteTable } from './interfaces/http/routes.js'

const slackNotifier = new SlackWebhookNotifier()
const sendTaskSummaryUseCase = new SendTaskSummaryUseCase(slackNotifier)

const router = new HttpRouter(
  buildRouteTable({
    sendTaskSummary: sendTaskSummaryUseCase,
  }),
)

export const requestHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  try {
    if (!applyCors(req, res, config.allowedOrigins)) {
      return
    }

    await router.route(req, res)
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, { error: error.message })
      return
    }

    console.error('[server] request failed', error)
    json(res, 500, { error: 'Internal server error.' })
  }
}
