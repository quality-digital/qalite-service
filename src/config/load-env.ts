import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const loadEnvFile = (cwd = process.cwd()): void => {
  const envPath = resolve(cwd, '.env')
  if (!existsSync(envPath)) return

  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 1) continue

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
  }
}
