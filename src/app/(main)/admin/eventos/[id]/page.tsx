import Link from 'next/link'
import {notFound} from 'next/navigation'
import {requireAdmin} from '@/lib/access'
import {getAdminEvent,listEventOrganizerOptions} from '@/features/events/service'
import {AdminEventEditForm} from '@/features/admin/components/admin-event-edit-form'
import {StatusBadge} from '@/components/status-badge'

export default async function AdminEventPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{returnTo?:string}>}){await requireAdmin();const[{id},query]=await Promise.all([params,searchParams]);const event=await getAdminEvent(id);if(!event)notFound();const organizers=await listEventOrganizerOptions(event.organizer_membership_id);const backHref=query.returnTo==='/admin/eventos'||query.returnTo?.startsWith('/admin/eventos?')?query.returnTo:'/admin/eventos';return <div className="mx-auto max-w-5xl"><div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><Link href={backHref} className="text-sm font-semibold text-stone-500">← Volver a eventos</Link><p className="mt-5 text-sm text-stone-500">{event.organizer_name}</p><h1 className="mt-1 text-3xl font-semibold text-emerald-950">{event.title}</h1></div><StatusBadge status={event.status}/></div><AdminEventEditForm event={event} organizers={organizers}/></div>}
