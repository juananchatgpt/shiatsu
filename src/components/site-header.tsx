import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'

export async function SiteHeader() {
  const user=await getSessionUser()
  return <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
    <div className="apse-container flex h-20 items-center justify-between gap-6">
      <Link href="/" className="flex items-center gap-3 text-emerald-950">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-950 text-sm font-bold text-white">AP</span>
        <span><strong className="block leading-tight">APSE</strong><span className="hidden text-xs text-stone-500 sm:block">Profesionales de Shiatsu de España</span></span>
      </Link>
      <nav className="flex items-center gap-2 text-sm font-medium">
        <Link className="hidden rounded-lg px-3 py-2 hover:bg-stone-100 md:block" href="/directorio">Directorio</Link>
        <Link className="hidden rounded-lg px-3 py-2 hover:bg-stone-100 md:block" href="/eventos">Eventos</Link>
        {user?<Link className="apse-button" href="/dashboard">Área privada</Link>:<>
          <Link className="rounded-lg px-3 py-2 hover:bg-stone-100" href="/login">Entrar</Link>
          <Link className="apse-button" href="/registro">Hazte socio</Link>
        </>}
      </nav>
    </div>
  </header>
}
