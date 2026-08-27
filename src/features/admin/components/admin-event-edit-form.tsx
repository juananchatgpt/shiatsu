'use client'

import {useActionState} from 'react'
import Image from 'next/image'
import {adminUpdateEvent} from '@/actions/events'
import type {EventOrganizerOption,EventRow} from '@/features/events/service'
import {EVENT_STATUSES,SPANISH_PROVINCES,eventStatusLabels,memberTypeLabels} from '@/lib/domain'

export function AdminEventEditForm({event,organizers}:{event:EventRow;organizers:EventOrganizerOption[]}){
  const[state,action,pending]=useActionState(adminUpdateEvent,null)
  return <form action={action} className="apse-card space-y-7 p-6 sm:p-8">
    <input type="hidden" name="eventId" value={event.id}/>
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-semibold text-amber-950">Revisión y publicación</h2>
      <p className="mt-1 text-sm text-amber-800">Revisa la ficha completa y selecciona «Aprobado» para publicarla.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div><label className="apse-label" htmlFor="organizerMembershipId">Organizador *</label><select className="apse-input" id="organizerMembershipId" name="organizerMembershipId" defaultValue={event.organizer_membership_id} required>{organizers.map(o=><option value={o.id} key={o.id}>{o.name} · {memberTypeLabels[o.member_type]}</option>)}</select></div>
        <div><label className="apse-label" htmlFor="status">Estado *</label><select className="apse-input" id="status" name="status" defaultValue={event.status}>{EVENT_STATUSES.map(s=><option value={s} key={s}>{eventStatusLabels[s]}</option>)}</select></div>
      </div>
      <div className="mt-5"><label className="apse-label" htmlFor="moderationNotes">Notas internas de moderación</label><textarea className="apse-input min-h-24" id="moderationNotes" name="moderationNotes" defaultValue={event.moderation_notes??''}/></div>
    </section>
    <div><label className="apse-label" htmlFor="title">Título *</label><input className="apse-input" id="title" name="title" defaultValue={event.title} required/></div>
    <div><label className="apse-label" htmlFor="description">Descripción *</label><textarea className="apse-input min-h-48" id="description" name="description" defaultValue={event.description} required minLength={20}/><p className="mt-2 text-xs text-stone-500">Mínimo 20 caracteres.</p></div>
    {event.image_url&&<div><p className="apse-label">Imagen actual</p><Image className="mt-2 max-h-72 w-full rounded-2xl object-cover" src={event.image_url} alt="Vista previa del evento" width={1200} height={600} unoptimized/></div>}
    <div className="grid gap-5 md:grid-cols-2">
      <Field name="startsAt" label="Inicio *" type="datetime-local" value={madridDateInput(event.starts_at)} required/>
      <Field name="endsAt" label="Fin *" type="datetime-local" value={madridDateInput(event.ends_at)} required/>
      <div><label className="apse-label" htmlFor="modality">Modalidad</label><select className="apse-input" id="modality" name="modality" defaultValue={event.modality}><option value="in_person">Presencial</option><option value="online">Online</option><option value="hybrid">Híbrido</option></select></div>
      <Field name="venueName" label="Recinto" value={event.venue_name}/><Field name="address" label="Dirección" value={event.address}/><Field name="city" label="Municipio" value={event.city}/>
      <div><label className="apse-label" htmlFor="province">Provincia</label><select className="apse-input" id="province" name="province" defaultValue={event.province??''}><option value="">Seleccionar</option>{SPANISH_PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>
      <Field name="postalCode" label="Código postal" value={event.postal_code}/><Field name="registrationUrl" label="URL de inscripción" type="url" value={event.registration_url}/><Field name="publicContact" label="Contacto público" value={event.public_contact}/><Field name="imageUrl" label="URL de imagen" type="url" value={event.image_url}/><Field name="priceEuros" label="Precio (€)" type="number" step="0.01" value={event.price_cents!=null?String(event.price_cents/100):''}/>
    </div>
    <div className="flex flex-wrap gap-6"><Check name="allDay" label="Día completo" checked={event.all_day}/><Check name="isFree" label="Evento gratuito" checked={event.is_free}/><Check name="featured" label="Evento destacado" checked={event.featured}/></div>
    {state?.error&&<p className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}{state?.ok&&<p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">Evento guardado y estado actualizado.</p>}
    <button className="apse-button" disabled={pending}>{pending?'Guardando…':'Guardar cambios'}</button>
  </form>
}

function Field({name,label,type='text',value,required=false,step}:{name:string;label:string;type?:string;value?:string|null;required?:boolean;step?:string}){return <div><label className="apse-label" htmlFor={name}>{label}</label><input className="apse-input" id={name} name={name} type={type} defaultValue={value??''} required={required} step={step}/></div>}
function Check({name,label,checked}:{name:string;label:string;checked:boolean}){return <label className="flex items-center gap-2"><input type="checkbox" name={name} defaultChecked={checked}/>{label}</label>}
function madridDateInput(value:string){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(value));const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===type)?.value??'';return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`}
