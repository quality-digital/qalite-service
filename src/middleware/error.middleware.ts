import { ExternalServiceError } from '../errors/external-service-error.js'
import { HttpError } from '../errors/http-error.js'
import { sendJson } from '../http/response.js'
import type { Middleware } from '../types/http.js'
import type { Logger } from '../utils/logger.js'

export const createErrorMiddleware =
  (log: Logger): Middleware =>
  async (req, res, next) => {
    try {
      await next()
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.statusCode, { error: error.message })
        return
      }

      if (error instanceof ExternalServiceError) {
        log.error(
          'External service request failed',
          {
            method: req.method,
            path: req.url,
            requestId: String(res.getHeader('X-Request-Id') ?? ''),
            service: error.service,
            statusCode: 502,
          },
          error.cause ?? error,
        )
        sendJson(res, 502, { error: error.message })
        return
      }

      log.error(
        'HTTP request failed',
        {
          method: req.method,
          path: req.url,
          requestId: String(res.getHeader('X-Request-Id') ?? ''),
        },
        error,
      )
      sendJson(res, 500, { error: 'Internal server error.' })
    }
  }
