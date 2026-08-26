import Link from 'next/link'
import { requireUser,getMembershipContext,canCreateEvents } from '@/lib/access'
import { listMemberEvents } from '@/features/events/service'
import { EventList } from '@/features/events/components/event-list'
export default async function MyEventsPage(){const user=await requireUser();const m=await getMembershipContext(user.id);const allowed=canCreateEvents(m);const events=m?await listMemberEvents(m.membership_id):[];return <><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-emerald-950">Mis eventos</h1><p className="mt-2 text-stone-600">Los eventos se publican después de la revisión de APSE.</p></div>{allowed&&<Link className="apse-button" href="/mis-eventos/nuevo">Nuevo evento</Link>}</div>{!allowed&&<div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Esta función requiere una cuenta profesional o escuela activa.</div>}<EventList events={events} showStatus/></>}
