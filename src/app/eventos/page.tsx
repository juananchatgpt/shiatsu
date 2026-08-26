import { SiteHeader } from '@/components/site-header'
import { listPublicEvents } from '@/features/events/service'
import { EventList } from '@/features/events/components/event-list'
export const dynamic='force-dynamic'
export default async function EventsPage(){const events=await listPublicEvents();return <><SiteHeader/><main className="apse-container py-12"><div className="mb-8 max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Agenda APSE</p><h1 className="mt-2 text-4xl font-semibold text-emerald-950">Próximos eventos</h1><p className="mt-3 text-stone-600">Actividades enviadas por profesionales y escuelas y revisadas por APSE.</p></div><EventList events={events}/></main></>}
