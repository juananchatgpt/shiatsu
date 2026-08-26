'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { query, withTransaction } from '@/lib/db'
import {
  createSession,
  destroySession,
  verifyPassword,
  hashPassword,
  getSessionUser,
  SESSION_COOKIE,
  SESSION_DAYS,
} from '@/lib/auth'

interface UserRow {
  id: string
  password_hash: string
  active: boolean
}

/**
 * Login con email + contraseña contra la tabla `users`.
 * No hay registro público: los usuarios se crean con scripts/create-user.ts.
 */
export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) {
    return { error: 'Introduce email y contraseña' }
  }

  const rows = await query<UserRow>(
    'SELECT id, password_hash, active FROM users WHERE email = $1 LIMIT 1',
    [email],
  )
  const user = rows[0]
  // Mensaje genérico: no revelar si falló el email o la contraseña.
  if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'Credenciales incorrectas' }
  }

  const token = await createSession(user.id)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  })
  redirect('/dashboard')
}

export async function logout() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await destroySession(token)
  store.delete(SESSION_COOKIE)
  redirect('/login')
}

/** Cambio de contraseña del usuario autenticado. */
export async function changePassword(_prev: unknown, formData: FormData) {
  const user = await getSessionUser()
  if (!user) return { error: 'No autenticado' }
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmation = String(formData.get('passwordConfirmation') ?? '')
  if (newPassword.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if(newPassword!==confirmation)return{error:'Las contraseñas nuevas no coinciden'}
  const rows=await query<{password_hash:string}>('SELECT password_hash FROM users WHERE id=$1 LIMIT 1',[user.id])
  if(!rows[0]||!await verifyPassword(currentPassword,rows[0].password_hash))return{error:'La contraseña actual no es correcta'}
  await withTransaction(async tx=>{
    await tx('UPDATE users SET password_hash=$1,password_reset_required=false,updated_at=now() WHERE id=$2',[await hashPassword(newPassword),user.id])
    await tx('DELETE FROM sessions WHERE user_id=$1',[user.id])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'user.password_changed','user',$1)`,[user.id])
  })
  const store=await cookies();store.delete(SESSION_COOKIE)
  redirect('/login?password=changed')
}
