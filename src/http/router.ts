import { URL } from 'node:url'

import { HttpError } from '../errors/http-error.js'
import type { HttpHandler, HttpMethod, RouteTable } from '../types/http.js'

const HTTP_METHODS = new Set<HttpMethod>(['DELETE', 'GET', 'PATCH', 'POST', 'PUT'])

const toHttpMethod = (method: string | undefined): HttpMethod => {
  const normalizedMethod = method ?? 'GET'
  if (!HTTP_METHODS.has(normalizedMethod as HttpMethod)) {
    throw new HttpError(405, 'Method not allowed.')
  }

  return normalizedMethod as HttpMethod
}

export const createRouter =
  (routes: RouteTable): HttpHandler =>
  async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    const handlers = routes[pathname]

    if (!handlers) {
      throw new HttpError(404, 'Not found.')
    }

    const handler = handlers[toHttpMethod(req.method)]
    if (!handler) {
      throw new HttpError(405, 'Method not allowed.')
    }

    await handler(req, res)
  }
