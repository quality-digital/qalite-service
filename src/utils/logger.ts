export interface LogContext {
  [key: string]: boolean | number | string | undefined
}

export interface Logger {
  error(message: string, context?: LogContext, error?: unknown): void
  info(message: string, context?: LogContext): void
}

const serializeError = (error: unknown): Record<string, string> | undefined => {
  if (!(error instanceof Error)) return undefined

  return {
    errorMessage: error.message,
    errorName: error.name,
  }
}

const write = (
  level: 'error' | 'info',
  message: string,
  context: LogContext = {},
  error?: unknown,
): void => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...serializeError(error),
  })

  if (level === 'error') {
    console.error(entry)
    return
  }

  console.info(entry)
}

export const logger: Logger = {
  error: (message, context, error) => write('error', message, context, error),
  info: (message, context) => write('info', message, context),
}
