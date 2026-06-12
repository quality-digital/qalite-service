import { ExternalServiceError } from '../../errors/external-service-error.js'
import type { MessageNotifier } from '../../types/message-notifier.js'

export class SlackWebhookClient implements MessageNotifier {
  constructor(
    private readonly timeoutMs: number,
    private readonly fetchImplementation?: typeof fetch,
  ) {}

  async send(message: string, webhookUrl: string): Promise<void> {
    try {
      const response = await (this.fetchImplementation ?? globalThis.fetch)(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      if (!response.ok) {
        throw new Error(`Slack webhook responded with status ${response.status}`)
      }
    } catch (error) {
      throw new ExternalServiceError('slack', 'Unable to deliver message to Slack.', {
        cause: error,
      })
    }
  }
}
