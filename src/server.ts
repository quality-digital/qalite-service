import type { IncomingMessage, ServerResponse } from 'node:http'

import {
  SendTaskSummaryUseCase,
  type TaskSummaryPayload,
} from './application/send-task-summary.js'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { SlackWebhookNotifier } from './infrastructure/slack-webhook-notifier.js'
import { applyCors } from './interfaces/http/cors.js'
import { readJsonBody } from './interfaces/http/http-request.js'
import { json } from './interfaces/http/http-response.js'
import { routeRequest, type RouteTable } from './interfaces/http/router.js'

const sendTaskSummary = new SendTaskSummaryUseCase(new SlackWebhookNotifier())

const routes: RouteTable = {
  '/slack/task-summary': {
    POST: async (req, res) => {
      const payload = await readJsonBody<TaskSummaryPayload>(req)
      await sendTaskSummary.execute(payload)
      json(res, 200, { message: 'Slack task summary sent.' })
    },
  },
}

export const requestHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  try {
    if (!applyCors(req, res, config.allowedOrigins)) {
      return
    }

    await routeRequest(req, res, routes)
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, { error: error.message })
      return
    }

    console.error('[server] request failed', error)
    json(res, 500, { error: 'Internal server error.' })
  }
}
