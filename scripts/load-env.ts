import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Carga .env.local en process.env sin dependencias externas.
 * Parser mínimo: ignora comentarios y líneas vacías, respeta comillas.
 */
export function loadEnvLocal(): void {
  try {
    const path = resolve(process.cwd(), '.env.local')
    const content = readFileSync(path, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // .env.local opcional: si no existe, se usan las env vars del entorno.
  }
}
