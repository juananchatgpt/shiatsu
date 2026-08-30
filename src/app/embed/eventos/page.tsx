import { listPublicEvents } from '@/features/events/service'
import { toPublicEvent } from '@/features/events/public'
import { PublicEventViews } from '@/features/events/components/public-event-views'
export const dynamic='force-dynamic'
export default async function EventsEmbed(){const events=(await listPublicEvents()).map(toPublicEvent);return <main className="bg-white p-3"><PublicEventViews events={events}/></main>}
