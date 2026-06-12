import { HttpError } from '../errors.js'

export interface TaskSummaryPayload {
  message?: string
  webhookUrl?: string | null
}

export interface SlackNotifier {
  sendMessage(message: string, webhookUrl?: string | null): Promise<void>
}

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
