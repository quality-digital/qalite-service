import type { IncomingMessage } from 'node:http'

import { HttpError } from '../errors/http-error.js'

const DEFAULT_MAX_BODY_SIZE = 1024 * 1024

export const readJsonBody = async (
  req: IncomingMessage,
  maxBodySize = DEFAULT_MAX_BODY_SIZE,
): Promise<unknown> => {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of req) {
    const buffer = Buffer.from(chunk)
    totalBytes += buffer.length

    if (totalBytes > maxBodySize) {
      throw new HttpError(413, 'Payload too large.')
    }

    chunks.push(buffer)
  }

  if (chunks.length === 0) return {}

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    throw new HttpError(400, 'Invalid JSON payload.', { cause: error })
  }
}
