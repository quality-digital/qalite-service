import { randomUUID } from 'node:crypto'

import type { Middleware } from '../utils/http.js'

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/

export const requestIdMiddleware: Middleware = async (req, res, next) => {
  const header = req.headers['x-request-id']
  const providedRequestId = typeof header === 'string' ? header.trim() : ''
  const requestId = REQUEST_ID_PATTERN.test(providedRequestId)
    ? providedRequestId
    : randomUUID()

  res.setHeader('X-Request-Id', requestId)
  await next()
}
