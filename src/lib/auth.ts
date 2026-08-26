import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { query } from './db'

const SESSION_COOKIE = 'apse_session'
const SESSION_DAYS = 30

export interface SessionUser {
  id: string
  email: string
  full_name: string | null
  role: string
  password_reset_required: boolean
}

/** Hash de contraseña (bcryptjs, JS puro — sin node-gyp). */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Crea una sesión y devuelve el token (a guardar en cookie httpOnly). */
export async function createSession(userId: string): Promise<string> {
  // Limpieza oportunista de sesiones caducadas.
  await query('DELETE FROM sessions WHERE expires_at < now()')
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await query(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [token, userId, expires.toISOString()],
  )
  return token
}

export async function destroySession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token = $1', [token])
}

/** Lee la cookie de sesión y devuelve el usuario válido (o null). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await query<SessionUser>(
    `SELECT u.id, u.email, u.full_name, u.role, u.password_reset_required
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now() AND u.active = true
     LIMIT 1`,
    [token],
  )
  return rows[0] ?? null
}

export { SESSION_COOKIE, SESSION_DAYS }
