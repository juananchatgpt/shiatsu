import { requireUser,getMembershipContext,canCreateEvents } from '@/lib/access'
import { redirect } from 'next/navigation'
import { EventForm } from '@/features/events/components/event-form'
export default async function NewEventPage(){const user=await requireUser();if(!canCreateEvents(await getMembershipContext(user.id)))redirect('/mis-eventos');return <div className="mx-auto max-w-4xl"><div className="mb-7"><h1 className="text-3xl font-semibold text-emerald-950">Proponer un evento</h1><p className="mt-2 text-stone-600">Se enviará directamente a revisión.</p></div><EventForm/></div>}
