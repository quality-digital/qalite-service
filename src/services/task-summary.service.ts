import type { MessageNotifier } from '../types/message-notifier.js'
import type { TaskSummaryInput } from '../types/task-summary.js'

export class TaskSummaryService {
  constructor(private readonly notifier: MessageNotifier) {}

  async send(input: TaskSummaryInput): Promise<void> {
    await this.notifier.send(input.message, input.webhookUrl)
  }
}
