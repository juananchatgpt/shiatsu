import Link from 'next/link'
import {requireAdmin} from '@/lib/access'
import {listAdminEvents} from '@/features/events/service'
import {EVENT_STATUSES,eventStatusLabels,type EventStatus} from '@/lib/domain'
import {StatusBadge} from '@/components/status-badge'

export default async function EventsAdminPage({searchParams}:{searchParams:Promise<{status?:string;view?:string}>}){
  await requireAdmin()
  const p=await searchParams
  const status=EVENT_STATUSES.includes(p.status as EventStatus)?p.status as EventStatus:undefined
  const view=p.view==='upcoming'||p.view==='past'?p.view:'all'
  const events=await listAdminEvents(status,view)
  const queryParams=new URLSearchParams()
  if(status)queryParams.set('status',status)
  if(view!=='all')queryParams.set('view',view)
  const returnTo=queryParams.toString()?`/admin/eventos?${queryParams}`:'/admin/eventos'
  const emptyMessage=view==='past'?'No hay eventos pasados.':view==='upcoming'?'No hay próximos eventos.':status?'No hay eventos con este estado.':'No hay eventos guardados.'
  return <>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-emerald-950">Moderación de eventos</h1><p className="mt-2 text-stone-600">{events.length} eventos.</p></div><Link className="apse-button" href="/admin/eventos/nuevo">Crear evento</Link></div>
    <form method="get" className="mb-6 flex max-w-3xl flex-wrap gap-3"><select className="apse-input min-w-52 flex-1" name="view" defaultValue={view}><option value="all">Todos los eventos</option><option value="upcoming">Próximos eventos</option><option value="past">Eventos pasados</option></select><select className="apse-input min-w-52 flex-1" name="status" defaultValue={status}><option value="">Todos los estados</option>{EVENT_STATUSES.map(s=><option key={s} value={s}>{eventStatusLabels[s]}</option>)}</select><button className="apse-button">Filtrar</button></form>
    <div className="space-y-4">{events.map(e=><article key={e.id} className="apse-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-stone-400">{e.organizer_name}</p><Link href={`/admin/eventos/${e.id}?returnTo=${encodeURIComponent(returnTo)}`} className="mt-1 block text-xl font-semibold text-emerald-950 hover:underline">{e.title}</Link><p className="mt-2 text-sm text-stone-500">{new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(e.starts_at))}</p></div><StatusBadge status={e.status}/></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{e.description}</p><Link className="apse-button-secondary mt-5 inline-block" href={`/admin/eventos/${e.id}?returnTo=${encodeURIComponent(returnTo)}`}>Revisar y editar</Link></article>)}{!events.length&&<div className="apse-card p-8 text-center"><p className="font-semibold text-emerald-950">{emptyMessage}</p>{(status||view!=='all')&&<Link className="apse-button-secondary mt-5 inline-block" href="/admin/eventos">Ver todos los eventos</Link>}</div>}</div>
  </>
}
