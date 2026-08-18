import type { SlackWebhookClient } from '../clients/slack-webhook.client.js'
import type { TaskSummaryInput } from '../validators/task-summary.validator.js'

export class TaskSummaryService {
  constructor(private readonly slackClient: SlackWebhookClient) {}

  async send(input: TaskSummaryInput): Promise<void> {
    await this.slackClient.send(input.message, input.webhookUrl)
  }
}
