import { ExternalServiceError } from '../utils/external-service-error.js'

export const sendSlackMessage = async (
  message: string,
  webhookUrl: string,
  timeoutMs: number,
): Promise<void> => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(timeoutMs),
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
