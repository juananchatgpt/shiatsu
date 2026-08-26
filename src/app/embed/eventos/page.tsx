import { listPublicEvents } from '@/features/events/service'
import { EventList } from '@/features/events/components/event-list'
export const dynamic='force-dynamic'
export default async function EventsEmbed(){const events=await listPublicEvents();return <main className="bg-white p-3"><EventList events={events}/></main>}
