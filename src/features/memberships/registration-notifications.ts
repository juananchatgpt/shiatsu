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
    text: `Hola ${person.name}, hemos recibido tu solicitud como ${type}. Secretaría revisará la información y te comunicará la decisión.`,
    html: `<p>Hola ${name},</p><p>Hemos recibido tu solicitud como <strong>${type}</strong>. Secretaría revisará la información y te comunicará la decisión.</p>`,
  })]
  const recipients = secretaryRecipients()
  if (recipients.length) jobs.push(safelySend({
    to: recipients,
    replyTo: person.email,
    subject: `APSE · Nueva solicitud de ${type}`,
    text: `${person.name} ha presentado una solicitud. Revisar: ${adminUrl}`,
    html: `<p><strong>${name}</strong> ha presentado una solicitud como ${type}.</p><p><a href="${adminUrl}">Revisar solicitud</a></p>`,
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
    ? `Hola ${person.name}, tu solicitud ha sido aprobada. Entra en ${loginUrl} con la contraseña que elegiste y completa tu perfil.${helpUrl ? ` Ayuda: ${helpUrl}` : ''}`
    : `Hola ${person.name}, APSE no ha aprobado tu solicitud. Puedes contactar con Secretaría si necesitas más información.`
  const html = approved
    ? `<p>Hola ${name},</p><p>Tu solicitud ha sido aprobada y está en <strong>pre-registro</strong>.</p><p><a href="${loginUrl}">Entrar en la intranet</a> con la contraseña que elegiste y completar tu perfil.</p>${helpUrl ? `<p><a href="${escapeHtml(helpUrl)}">Consultar la ayuda</a></p>` : ''}`
    : `<p>Hola ${name},</p><p>APSE no ha aprobado tu solicitud. Puedes contactar con Secretaría si necesitas más información.</p>`
  const jobs: Promise<void>[] = [safelySend({to: person.email, subject: approved ? 'APSE · Solicitud aprobada' : 'APSE · Solicitud no aprobada', text, html})]
  const recipients = secretaryRecipients()
  if (recipients.length) jobs.push(safelySend({
    to: recipients,
    subject: approved ? 'APSE · Solicitud aprobada' : 'APSE · Solicitud rechazada',
    text: `${person.name}: ${approved ? 'aprobada y en pre-registro' : 'rechazada'}.`,
    html: `<p>La solicitud de <strong>${name}</strong> ha sido ${approved ? 'aprobada y ha pasado a pre-registro' : 'rechazada'}.</p>`,
  }))
  await Promise.all(jobs)
}
