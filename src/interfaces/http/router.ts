import { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { HttpError } from '../../errors.js'

export interface RouteContext {
  params: Record<string, string>
  query: Pick<URLSearchParams, 'get'>
}

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext,
) => Promise<void>

export type RouteTable = Record<string, Partial<Record<string, RouteHandler>>>

const matchPath = (
  template: string,
  path: string,
): { matched: boolean; params: Record<string, string> } => {
  if (template === path) {
    return { matched: true, params: {} }
  }

  const templateSegments = template.split('/').filter(Boolean)
  const pathSegments = path.split('/').filter(Boolean)

  if (templateSegments.length !== pathSegments.length) {
    return { matched: false, params: {} }
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < templateSegments.length; index += 1) {
    const templateSegment = templateSegments[index]
    const pathSegment = pathSegments[index]

    if (templateSegment.startsWith(':')) {
      params[templateSegment.slice(1)] = decodeURIComponent(pathSegment)
      continue
    }

    if (templateSegment !== pathSegment) {
      return { matched: false, params: {} }
    }
  }

  return { matched: true, params }
}

export class HttpRouter {
  constructor(private readonly routes: RouteTable) {}

  async route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')

    for (const [pathTemplate, handlers] of Object.entries(this.routes)) {
      const match = matchPath(pathTemplate, url.pathname)
      if (!match.matched) {
        continue
      }

      const handler = handlers[method]
      if (!handler) {
        throw new HttpError(405, 'Method not allowed.')
      }

      await handler(req, res, { params: match.params, query: url.searchParams })
      return
    }

    throw new HttpError(404, 'Not found.')
  }
}
