import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

// Lazy singleton: no crear el transporter a nivel de módulo (las env vars
// pueden no existir en build/CI).
function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)
    // 465 = TLS implícito (secure). 587 = STARTTLS (secure=false + requireTLS).
    // Si SMTP_SECURE no se define, se deduce del puerto.
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      // En 587 (p. ej. IONOS) se exige STARTTLS: nunca enviar credenciales en claro.
      requireTLS: !secure && port === 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/** Comprueba conexión, STARTTLS y autenticación sin enviar ningún correo. */
export async function verifyEmailTransport(): Promise<void> {
  await getTransporter().verify()
}

const FOOTER_TEXT = 'Este es un mensaje automático del área privada de la Asociación de Profesionales de Shiatsu de España (APSE). Por favor, no respondas a este correo.'

/**
 * Envuelve el cuerpo en un documento HTML en español (lang="es"), con una
 * plantilla sencilla y el pie común. Sin lang, Gmail lo toma por inglés.
 */
export function wrapEmailHtml(subject: string, body: string): string {
  const title = subject.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>`
    + `<body style="margin:0;padding:24px;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;font-size:15px;line-height:1.6">`
    + `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">`
    + `<p style="margin:0 0 16px;font-weight:bold;color:#57534e">APSE · Área privada</p>${body}`
    + `<hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0 12px"><p style="margin:0;font-size:12px;color:#78716c">${FOOTER_TEXT}</p>`
    + `</div></body></html>`
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // IONOS (y la mayoría de SMTP autenticados) exige que el From sea el buzón
  // autenticado o un alias suyo: por defecto se usa SMTP_USER.
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER
  const from = process.env.SMTP_FROM_NAME && fromEmail ? { name: process.env.SMTP_FROM_NAME, address: fromEmail } : fromEmail
  const html = /^\s*<(!doctype|html)/i.test(options.html) ? options.html : wrapEmailHtml(options.subject, options.html)
  const text = options.text ? `${options.text}\n\n--\n${FOOTER_TEXT}` : undefined
  await getTransporter().sendMail({
    ...options,
    html,
    text,
    from,
    replyTo: options.replyTo ?? (process.env.SMTP_REPLY_TO || undefined),
    headers: { 'Content-Language': 'es' },
  })
}
