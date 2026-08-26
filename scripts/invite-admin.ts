import { createHash,randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'
import { loadEnvLocal } from './load-env'
import { sendEmail } from '../src/lib/mailer'

async function main(){
  loadEnvLocal()
  const[emailArg,nameArg]=process.argv.slice(2);const email=(emailArg||'').trim().toLowerCase();const fullName=(nameArg||'').trim()
  if(!email.includes('@')||fullName.length<2)throw new Error('Uso: npm run admin:invite -- correo@dominio.es "Nombre"')
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL no está definida')
  if(!process.env.SMTP_HOST)throw new Error('SMTP_HOST no está definido')
  const rawToken=randomBytes(32).toString('hex');const tokenHash=createHash('sha256').update(rawToken).digest('hex')
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect()
  try{
    await client.query('BEGIN')
    const existing=await client.query<{id:string;role:string}>('SELECT id,role FROM users WHERE email=$1 LIMIT 1',[email])
    let userId=existing.rows[0]?.id
    if(existing.rows[0]&&existing.rows[0].role!=='admin')throw new Error('El email ya pertenece a un socio y no se ha modificado')
    if(!userId){const unusable=await bcrypt.hash(randomBytes(48).toString('hex'),10);const inserted=await client.query<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role,password_reset_required) VALUES($1,$2,$3,'admin',true) RETURNING id`,[email,unusable,fullName]);userId=inserted.rows[0].id}
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id=$1 AND used_at IS NULL`,[userId])
    await client.query(`INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')`,[tokenHash,userId])
    await client.query(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'admin.invited','user',$2)`,[userId,userId])
    await client.query('COMMIT')
  }catch(error){await client.query('ROLLBACK');throw error}finally{await client.end()}
  const base=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/$/,'');const link=`${base}/restablecer-contrasena?token=${rawToken}`
  await sendEmail({to:email,subject:'Activa tu cuenta de administración de APSE',text:`Hola ${fullName}. Define tu contraseña durante las próximas 24 horas: ${link}`,html:`<p>Hola ${fullName}.</p><p>Define tu contraseña de administración de APSE durante las próximas 24 horas:</p><p><a href="${link}">Crear contraseña</a></p>`})
  console.log(`Administrador preparado e invitación enviada a ${email}`)
}
main().catch(error=>{console.error('Error invitando al administrador:',error instanceof Error?error.message:String(error));process.exit(1)})
