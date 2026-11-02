import { loadEnvLocal } from './load-env'
import { sendEmail, verifyEmailTransport } from '../src/lib/mailer'

// Prueba SMTP controlada. Nunca envía a nadie que no se pase como argumento.
//   npm run smtp:test -- --verify               → solo conexión, STARTTLS y login (no envía)
//   npm run smtp:test -- destinatario@dominio.es → lo anterior + un correo de prueba a esa dirección
async function main(){
  loadEnvLocal()
  const arg=(process.argv[2]||'').trim()
  const verifyOnly=arg==='--verify'
  if(!verifyOnly&&!arg.includes('@'))throw new Error('Uso: npm run smtp:test -- --verify  |  npm run smtp:test -- destinatario@dominio.es')
  const missing=['SMTP_HOST','SMTP_USER','SMTP_PASS'].filter(key=>!process.env[key])
  if(missing.length)throw new Error(`Faltan variables: ${missing.join(', ')}`)
  const port=process.env.SMTP_PORT||'587'
  const from=process.env.SMTP_FROM_EMAIL||process.env.SMTP_FROM||process.env.SMTP_USER
  console.log(`SMTP ${process.env.SMTP_HOST}:${port} · SMTP_SECURE=${process.env.SMTP_SECURE||'(auto)'} · usuario ${process.env.SMTP_USER} · From ${from}`)
  if(from&&process.env.SMTP_USER&&from.toLowerCase()!==process.env.SMTP_USER.toLowerCase())console.warn('Aviso: el From no coincide con SMTP_USER; IONOS solo lo acepta si es un alias del mismo buzón.')
  await verifyEmailTransport()
  console.log('Conexión y autenticación correctas.')
  if(verifyOnly)return
  const sentAt=new Date().toLocaleString('es-ES',{timeZone:'Europe/Madrid'})
  await sendEmail({to:arg,subject:'APSE · Prueba SMTP',text:`Correo de prueba de la aplicación de socios de APSE (${sentAt}).`,html:`<p>Correo de prueba de la aplicación de socios de APSE (${sentAt}).</p>`})
  console.log(`Correo de prueba entregado al servidor SMTP para ${arg}. Revisa la bandeja (y spam).`)
}
main().catch(error=>{console.error('Error en la prueba SMTP:',error instanceof Error?error.message:String(error));process.exit(1)})
