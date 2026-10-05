import Link from 'next/link'
import { logout } from '@/actions/auth'
import type { SessionUser } from '@/lib/auth'
import { AppLogo } from './app-logo'

export function MemberNav({user}:{user:SessionUser}){
  return <header className="border-b border-stone-200 bg-white">
    <div className="apse-container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
      <Link href="/dashboard" aria-label="APSE · Área privada"><AppLogo compact/></Link>
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/dashboard">Inicio</Link>
        {user.role!=='admin'&&<><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/perfil">Mi perfil</Link><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/mis-eventos">Mis eventos</Link></>}
        {user.role==='admin'&&<><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/admin/socios">Socios</Link><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/admin/eventos">Eventos</Link><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/admin/comunicaciones">Comunicaciones</Link><Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/admin/administradores">Administradores</Link></>}
        <Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/seguridad">Seguridad</Link>
        <form action={logout}><button className="rounded-lg px-3 py-2 text-stone-500 hover:bg-stone-100">Salir</button></form>
      </nav>
    </div>
  </header>
}
