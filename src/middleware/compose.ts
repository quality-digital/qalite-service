import type { HttpHandler, Middleware } from '../types/http.js'

export const composeMiddleware = (
  middlewares: readonly Middleware[],
  handler: HttpHandler,
): HttpHandler => {
  return async (req, res) => {
    let currentIndex = -1

    const dispatch = async (index: number): Promise<void> => {
      if (index <= currentIndex) {
        throw new Error('next() called multiple times')
      }

      currentIndex = index
      const middleware = middlewares[index]

      if (middleware) {
        await middleware(req, res, () => dispatch(index + 1))
        return
      }

      await handler(req, res)
    }

    await dispatch(0)
  }
}
