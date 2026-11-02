import { sendEmail } from '@/lib/mailer'
import { memberTypeLabels, type MemberType } from '@/lib/domain'

interface RegistrationPerson {
  email: string
  name: string
  memberType: MemberType
  membershipId: string
}

const enabled = () => process.env.REGISTRATION_EMAILS_ENABLED === 'true'
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const secretaryRecipients = () => (process.env.APSE_SECRETARY_EMAILS || '').split(',').map(email => email.trim()).filter(Boolean)
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character] || character))

async function safelySend(message: Parameters<typeof sendEmail>[0]) {
  try { await sendEmail(message) } catch (error) { console.error('registration notification', error) }
}

export async function notifyRegistrationSubmitted(person: RegistrationPerson) {
  if (!enabled()) return
  const name = escapeHtml(person.name)
  const type = memberTypeLabels[person.memberType]
  const adminUrl = `${siteUrl()}/admin/socios/${person.membershipId}`
  const jobs: Promise<void>[] = [safelySend({
    to: person.email,
    subject: 'APSE · Solicitud recibida',
    text: `Hola ${person.name}:\n\nHemos recibido tu solicitud de alta en APSE como ${type}. Gracias por tu interés.\n\nSecretaría revisará la información y te avisaremos por correo en cuanto haya una decisión. No necesitas hacer nada más por ahora.\n\nUn saludo,\nSecretaría de APSE`,
    html: `<p>Hola ${name}:</p><p>Hemos recibido tu solicitud de alta en APSE como <strong>${type}</strong>. Gracias por tu interés.</p><p>Secretaría revisará la información y te avisaremos por correo en cuanto haya una decisión. No necesitas hacer nada más por ahora.</p><p>Un saludo,<br>Secretaría de APSE</p>`,
  })]
  const recipients = secretaryRecipients()
  if (recipients.length) jobs.push(safelySend({
    to: recipients,
    replyTo: person.email,
    subject: `APSE · Nueva solicitud de ${type}`,
    text: `${person.name} (${person.email}) ha presentado una solicitud de alta como ${type}.\n\nRevisar la solicitud: ${adminUrl}`,
    html: `<p><strong>${name}</strong> (${escapeHtml(person.email)}) ha presentado una solicitud de alta como <strong>${type}</strong>.</p><p><a href="${adminUrl}">Revisar la solicitud</a></p>`,
  }))
  await Promise.all(jobs)
}

export async function notifyRegistrationDecision(person: RegistrationPerson, decision: 'approved' | 'rejected') {
  if (!enabled()) return
  const name = escapeHtml(person.name)
  const loginUrl = `${siteUrl()}/login`
  const helpUrl = process.env.REGISTRATION_HELP_URL?.trim()
  const approved = decision === 'approved'
  const text = approved
    ? `Hola ${person.name}:\n\nTu solicitud ha sido aprobada y tu alta en APSE ya está activa. Te damos la bienvenida.\n\nPuedes entrar en el área privada con tu email y la contraseña que elegiste: ${loginUrl}${helpUrl ? `\n\nGuía de ayuda: ${helpUrl}` : ''}\n\nUn saludo,\nSecretaría de APSE`
    : `Hola ${person.name}:\n\nHemos revisado tu solicitud de alta y en esta ocasión no ha podido ser aprobada.\n\nSi quieres más información, puedes ponerte en contacto con Secretaría de APSE.\n\nUn saludo,\nSecretaría de APSE`
  const html = approved
    ? `<p>Hola ${name}:</p><p>Tu solicitud ha sido aprobada y tu alta en APSE ya está activa. Te damos la bienvenida.</p><p>Puedes entrar en el área privada con tu email y la contraseña que elegiste.</p><p><a href="${loginUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px">Entrar en el área privada</a></p>${helpUrl ? `<p><a href="${escapeHtml(helpUrl)}">Consultar la guía de ayuda</a></p>` : ''}<p>Un saludo,<br>Secretaría de APSE</p>`
    : `<p>Hola ${name}:</p><p>Hemos revisado tu solicitud de alta y en esta ocasión no ha podido ser aprobada.</p><p>Si quieres más información, puedes ponerte en contacto con Secretaría de APSE.</p><p>Un saludo,<br>Secretaría de APSE</p>`
  const jobs: Promise<void>[] = [safelySend({to: person.email, subject: approved ? 'APSE · Solicitud aprobada' : 'APSE · Solicitud no aprobada', text, html})]
  const recipients = secretaryRecipients()
  if (recipients.length) jobs.push(safelySend({
    to: recipients,
    subject: approved ? 'APSE · Solicitud aprobada' : 'APSE · Solicitud rechazada',
    text: `La solicitud de alta de ${person.name} (${person.email}) ha sido ${approved ? 'aprobada y el socio ya está activo' : 'rechazada'}.\n\nFicha: ${siteUrl()}/admin/socios/${person.membershipId}`,
    html: `<p>La solicitud de alta de <strong>${name}</strong> (${escapeHtml(person.email)}) ha sido ${approved ? 'aprobada y el socio ya está activo' : 'rechazada'}.</p><p><a href="${siteUrl()}/admin/socios/${person.membershipId}">Ver la ficha</a></p>`,
  }))
  await Promise.all(jobs)
}
