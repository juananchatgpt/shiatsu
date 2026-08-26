import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { MemberNav } from '@/components/member-nav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validación REAL de la sesión (el middleware solo comprueba la cookie).
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-stone-50">
      <MemberNav user={user}/>
      <main className="apse-container py-8">{children}</main>
    </div>
  )
}
