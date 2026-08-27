import Link from 'next/link'
import {requireAdmin} from '@/lib/access'
import {listEventOrganizerOptions} from '@/features/events/service'
import {AdminEventCreateForm} from '@/features/admin/components/admin-event-create-form'

export default async function NewAdminEventPage(){await requireAdmin();const organizers=await listEventOrganizerOptions();return <div className="mx-auto max-w-5xl"><div className="mb-7"><Link className="text-sm font-semibold text-stone-500" href="/admin/eventos">← Volver a eventos</Link><h1 className="mt-5 text-3xl font-semibold text-emerald-950">Crear evento</h1><p className="mt-2 text-stone-600">El administrador puede dejarlo como borrador, enviarlo a revisión o publicarlo directamente.</p></div><AdminEventCreateForm organizers={organizers}/></div>}
