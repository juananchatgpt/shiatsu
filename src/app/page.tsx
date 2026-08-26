import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'

export default function Home() {
  return (
    <><SiteHeader/><main>
      <section className="bg-[var(--apse-cream)] py-20 sm:py-28"><div className="apse-container grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div><p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-[var(--apse-clay)]">Asociación nacional de Shiatsu</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[var(--apse-ink)] sm:text-6xl">Tu espacio para crecer dentro de APSE</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Gestiona tu perfil, publica tu actividad profesional y comparte eventos con la comunidad desde un único lugar.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link className="apse-button" href="/registro">Solicitar el alta</Link><Link className="apse-button-secondary" href="/directorio">Buscar profesionales</Link></div>
        </div>
        <div className="apse-card grid gap-4 p-6 sm:grid-cols-2"><Feature n="01" title="Área privada" text="Mantén tus datos al día."/><Feature n="02" title="Directorio" text="Decide si quieres aparecer."/><Feature n="03" title="Eventos" text="Envía actividades a revisión."/><Feature n="04" title="Asociación" text="Una gestión clara y centralizada."/></div>
      </div></section>
      <section className="py-20"><div className="apse-container"><div className="grid gap-6 md:grid-cols-3">
        <Profile title="Alumno" price="40 € / año" href="/registro/alumno" text="Para personas que se están formando en Shiatsu."/>
        <Profile title="Profesional" price="95 € / año" href="/registro/profesional" text="Perfil público opcional y publicación de eventos."/>
        <Profile title="Escuela" price="95 € / año" href="/registro/escuela" text="Cuenta propia vinculada a un profesional activo."/>
      </div></div></section>
    </main></>
  )
}

function Feature({n,title,text}:{n:string;title:string;text:string}){return <div className="rounded-xl bg-stone-50 p-4"><span className="text-xs font-bold text-[var(--apse-clay)]">{n}</span><h2 className="mt-2 font-semibold text-emerald-950">{title}</h2><p className="mt-1 text-sm text-stone-600">{text}</p></div>}
function Profile({title,price,href,text}:{title:string;price:string;href:string;text:string}){return <article className="apse-card p-6"><p className="text-sm font-semibold text-[var(--apse-clay)]">{price}</p><h2 className="mt-2 text-2xl font-semibold text-emerald-950">{title}</h2><p className="mt-3 min-h-12 text-stone-600">{text}</p><Link className="mt-6 inline-block font-semibold text-emerald-900" href={href}>Comenzar alta →</Link></article>}
