export interface SlackMessage {
  readonly text: string
}

export const toSlackMessage = (message: string): SlackMessage => ({ text: message })
