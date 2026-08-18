import { HttpError } from '../utils/http-error.js'
import type { Middleware } from '../utils/http.js'

export const createCorsMiddleware =
  (allowedOrigins: readonly string[]): Middleware =>
  async (req, res, next) => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined

    if (origin && !allowedOrigins.includes(origin)) {
      throw new HttpError(403, 'CORS origin not allowed.')
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    await next()
  }
