import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'APSE · Gestión de socios',
  description: 'Área de socios de la Asociación de Profesionales de Shiatsu de España',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
