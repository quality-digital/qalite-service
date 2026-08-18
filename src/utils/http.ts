import type { IncomingMessage, ServerResponse } from 'node:http'

export type HttpHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>
export type Next = () => Promise<void>
export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: Next,
) => Promise<void>

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
export type RouteTable = Record<string, Partial<Record<HttpMethod, HttpHandler>>>
