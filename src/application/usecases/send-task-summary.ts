import { HttpError } from '../../errors.js'
import type { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import type { SlackNotifier } from '../ports/slack-notifier.js'

export class SendTaskSummaryUseCase {
  constructor(private readonly notifier: SlackNotifier) {}

  async execute(payload: TaskSummaryPayload): Promise<void> {
    const message = payload?.message?.trim()
    if (!message) {
      throw new HttpError(400, 'Message is required.')
    }

    await this.notifier.sendMessage(message, payload.webhookUrl)
  }
}
