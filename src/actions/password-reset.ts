'use server'

import { createHash,randomBytes } from 'crypto'
import { query,withTransaction } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/mailer'
import type { ActionState } from './memberships'
import { checkPublicRateLimit } from '@/lib/rate-limit'

const hashToken=(v:string)=>createHash('sha256').update(v).digest('hex')

export async function requestPasswordReset(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  if(!await checkPublicRateLimit('password-reset',5,60))return{ok:true}
  const email=String(form.get('email')??'').trim().toLowerCase()
  if(!email.includes('@'))return{error:'Introduce un email válido'}
  const users=await query<{id:string}>('SELECT id FROM users WHERE email=$1 AND active=true LIMIT 1',[email])
  if(users[0]&&process.env.SMTP_HOST){
    const raw=randomBytes(32).toString('hex');await query(`INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')`,[hashToken(raw),users[0].id])
    const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const link=`${base}/restablecer-contrasena?token=${raw}`
    await sendEmail({to:email,subject:'Restablece tu contraseña de APSE',text:`Abre este enlace durante la próxima hora: ${link}`,html:`<p>Abre este enlace durante la próxima hora:</p><p><a href="${link}">Restablecer contraseña</a></p>`})
  }
  return{ok:true}
}

export async function resetPassword(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const token=String(form.get('token')??'');const password=String(form.get('password')??'')
  if(token.length<32)return{error:'Enlace no válido'};if(password.length<8)return{error:'La contraseña debe tener al menos 8 caracteres'}
  try{
    await withTransaction(async tx=>{
      const rows=await tx<{user_id:string}>(`UPDATE password_reset_tokens SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() RETURNING user_id`,[hashToken(token)])
      if(!rows[0])throw new Error('INVALID_TOKEN')
      await tx('UPDATE users SET password_hash=$1,password_reset_required=false,updated_at=now() WHERE id=$2',[await hashPassword(password),rows[0].user_id])
      await tx('DELETE FROM sessions WHERE user_id=$1',[rows[0].user_id])
      await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'user.password_reset','user',$1)`,[rows[0].user_id])
    })
    return{ok:true}
  }catch(error){if(error instanceof Error&&error.message==='INVALID_TOKEN')return{error:'El enlace ha caducado o ya se utilizó'};throw error}
}
