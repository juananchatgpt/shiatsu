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

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // IONOS (y la mayoría de SMTP autenticados) exige que el From sea el buzón
  // autenticado o un alias suyo: por defecto se usa SMTP_USER.
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER
  const from = process.env.SMTP_FROM_NAME && fromEmail ? { name: process.env.SMTP_FROM_NAME, address: fromEmail } : fromEmail
  await getTransporter().sendMail({
    ...options,
    from,
    replyTo: options.replyTo ?? (process.env.SMTP_REPLY_TO || undefined),
  })
}
