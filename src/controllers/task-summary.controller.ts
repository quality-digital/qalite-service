import { readJsonBody } from '../http/request.js'
import { sendJson } from '../http/response.js'
import type { SlackWebhookClient } from '../integrations/slack/slack-webhook.client.js'
import type { HttpHandler } from '../types/http.js'
import { validateTaskSummary } from '../validators/task-summary.validator.js'

export const createTaskSummaryController = (
  slackClient: SlackWebhookClient,
): HttpHandler =>
  async function taskSummaryController(req, res) {
    const input = validateTaskSummary(await readJsonBody(req))

    await slackClient.send(input.message, input.webhookUrl)
    sendJson(res, 200, { message: 'Slack task summary sent.' })
  }
