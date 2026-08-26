import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

// Lazy singleton: no crear el transporter a nivel de módulo (las env vars
// pueden no existir en build/CI).
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true', // true solo si el puerto es 465
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

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    replyTo: options.replyTo ?? (process.env.SMTP_REPLY_TO || undefined),
    ...options,
  })
}
