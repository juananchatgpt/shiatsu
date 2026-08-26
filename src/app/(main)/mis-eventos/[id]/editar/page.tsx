import {notFound,redirect}from'next/navigation'
import{requireUser,getMembershipContext,canCreateEvents}from'@/lib/access'
import{getMemberEvent}from'@/features/events/service'
import{EventForm}from'@/features/events/components/event-form'
export default async function EditEventPage({params}:{params:Promise<{id:string}>}){const user=await requireUser();const m=await getMembershipContext(user.id);if(!canCreateEvents(m))redirect('/mis-eventos');const{id}=await params;const event=await getMemberEvent(id,m!.membership_id);if(!event)notFound();return <div className="mx-auto max-w-4xl"><div className="mb-7"><h1 className="text-3xl font-semibold text-emerald-950">Editar evento</h1><p className="mt-2 text-stone-600">Al guardar, volverá a revisión y dejará de publicarse hasta ser aprobado.</p></div><EventForm event={event}/></div>}
