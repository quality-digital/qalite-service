import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { HttpError } from '../../errors.js'

export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>
export type RouteTable = Record<string, Partial<Record<string, RouteHandler>>>

export const routeRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  routes: RouteTable,
): Promise<void> => {
  const method = req.method ?? 'GET'
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  const handlers = routes[pathname]

  if (!handlers) {
    throw new HttpError(404, 'Not found.')
  }

  const handler = handlers[method]
  if (!handler) {
    throw new HttpError(405, 'Method not allowed.')
  }

  await handler(req, res)
}
