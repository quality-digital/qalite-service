import type { ServerResponse } from 'node:http'

export const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
): void => {
  if (res.headersSent || res.writableEnded) return

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}
