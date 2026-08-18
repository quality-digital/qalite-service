import type { SlackWebhookClient } from '../clients/slack-webhook.client.js'
import type { HttpHandler } from '../utils/http.js'
import { readJsonBody } from '../utils/request.js'
import { sendJson } from '../utils/response.js'
import { validateTaskSummary } from '../validators/task-summary.validator.js'

export const createTaskSummaryController = (
  slackClient: SlackWebhookClient,
): HttpHandler =>
  async function taskSummaryController(req, res) {
    const input = validateTaskSummary(await readJsonBody(req))

    await slackClient.send(input.message, input.webhookUrl)
    sendJson(res, 200, { message: 'Slack task summary sent.' })
  }
