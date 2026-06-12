import { loadEnvFile } from './load-env.js'

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://qualitydigital-qamanager.vercel.app',
]

const parseList = (value: string | undefined, fallback: readonly string[]): string[] => {
  if (value === undefined) return [...fallback]

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export interface AppConfig {
  readonly allowedOrigins: readonly string[]
  readonly isProduction: boolean
  readonly port: number
  readonly slack: {
    readonly requestTimeoutMs: number
  }
}

export const createAppConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => ({
  allowedOrigins: parseList(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS),
  isProduction: env.NODE_ENV === 'production',
  port: parsePositiveInteger(env.PORT, 3000),
  slack: {
    requestTimeoutMs: parsePositiveInteger(env.SLACK_REQUEST_TIMEOUT_MS, 5_000),
  },
})

loadEnvFile()

export const config = createAppConfig()
