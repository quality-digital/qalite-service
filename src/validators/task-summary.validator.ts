import { HttpError } from '../errors/http-error.js'

interface TaskSummaryInput {
  message: string
  webhookUrl: string
}

interface TaskSummaryPayload {
  message?: unknown
  webhookUrl?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const SLACK_WEBHOOK_HOSTS = new Set(['hooks.slack.com', 'hooks.slack-gov.com'])

const parseSlackWebhookUrl = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'Webhook URL is required.')
  }

  try {
    const url = new URL(value.trim())
    if (
      url.protocol !== 'https:' ||
      !SLACK_WEBHOOK_HOSTS.has(url.hostname) ||
      !url.pathname.startsWith('/services/')
    ) {
      throw new Error('Unsupported Slack webhook URL')
    }

    return url.toString()
  } catch (error) {
    throw new HttpError(400, 'Webhook URL must be a valid Slack HTTPS URL.', {
      cause: error,
    })
  }
}

export const validateTaskSummary = (value: unknown): TaskSummaryInput => {
  const payload: TaskSummaryPayload = isRecord(value) ? value : {}
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''

  if (!message) {
    throw new HttpError(400, 'Message is required.')
  }

  return {
    message,
    webhookUrl: parseSlackWebhookUrl(payload.webhookUrl),
  }
}
