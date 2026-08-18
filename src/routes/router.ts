import { URL } from 'node:url'

import { HttpError } from '../utils/http-error.js'
import type { HttpHandler, RouteTable } from '../utils/http.js'

export const createRouter =
  (routes: RouteTable): HttpHandler =>
  async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    const handlers = routes[pathname]

    if (!handlers) {
      throw new HttpError(404, 'Not found.')
    }

    const handler = handlers[req.method ?? 'GET']
    if (!handler) {
      throw new HttpError(405, 'Method not allowed.')
    }

    await handler(req, res)
  }
