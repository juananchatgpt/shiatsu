'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireUser, getMembershipContext, canCreateEvents } from '@/lib/access'
import { withTransaction } from '@/lib/db'
import { EVENT_STATUSES } from '@/lib/domain'
import { eventSchema } from '@/lib/validation'
import type { ActionState } from './memberships'

const checked=(f:FormData,n:string)=>f.get(n)==='on'
const text=(f:FormData,n:string)=>String(f.get(n)??'')

export async function createEvent(_prev:ActionState|null, form:FormData):Promise<ActionState> {
  const user=await requireUser(); const membership=await getMembershipContext(user.id)
  if(!canCreateEvents(membership)) return {error:'Solo profesionales y escuelas activos pueden crear eventos'}
  const parsed=eventSchema.safeParse({title:text(form,'title'),description:text(form,'description'),startsAt:text(form,'startsAt'),
    endsAt:text(form,'endsAt'),allDay:checked(form,'allDay'),modality:text(form,'modality'),venueName:text(form,'venueName'),
    address:text(form,'address'),city:text(form,'city'),province:text(form,'province'),postalCode:text(form,'postalCode'),
    registrationUrl:text(form,'registrationUrl'),publicContact:text(form,'publicContact'),isFree:checked(form,'isFree'),
    priceEuros:text(form,'priceEuros')?Number(text(form,'priceEuros')):undefined,imageUrl:text(form,'imageUrl')})
  if(!parsed.success) return {error:parsed.error.issues[0]?.message??'Revisa los datos'}
  const d=parsed.data
  try {
    await withTransaction(async tx=>{const rows=await tx<{id:string}>(`INSERT INTO events(organizer_membership_id,title,description,image_url,starts_at,ends_at,all_day,
      modality,venue_name,address,city,province,postal_code,registration_url,public_contact,is_free,price_cents,status,submitted_at)
      VALUES($1,$2,$3,$4,$5::timestamp AT TIME ZONE 'Europe/Madrid',$6::timestamp AT TIME ZONE 'Europe/Madrid',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending_review',now()) RETURNING id`,
      [membership!.membership_id,d.title,d.description,d.imageUrl||null,d.startsAt,d.endsAt,
        d.allDay,d.modality,d.venueName||null,d.address||null,d.city||null,d.province||null,d.postalCode||null,
        d.registrationUrl||null,d.publicContact||null,d.isFree,d.isFree?null:Math.round((d.priceEuros??0)*100)])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'event.submitted','event',$2)`,[user.id,rows[0].id])})
    revalidatePath('/mis-eventos'); return {ok:true}
  }catch(error){console.error('createEvent',error);return{error:'No se pudo enviar el evento'}}
}

export async function adminCreateEvent(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const admin=await requireAdmin();const organizerId=text(form,'organizerMembershipId');const status=text(form,'status')
  if(!['draft','pending_review','approved'].includes(status))return{error:'Estado no válido'}
  const parsed=eventSchema.safeParse({title:text(form,'title'),description:text(form,'description'),startsAt:text(form,'startsAt'),endsAt:text(form,'endsAt'),
    allDay:checked(form,'allDay'),modality:text(form,'modality'),venueName:text(form,'venueName'),address:text(form,'address'),city:text(form,'city'),
    province:text(form,'province'),postalCode:text(form,'postalCode'),registrationUrl:text(form,'registrationUrl'),publicContact:text(form,'publicContact'),
    isFree:checked(form,'isFree'),priceEuros:text(form,'priceEuros')?Number(text(form,'priceEuros')):undefined,imageUrl:text(form,'imageUrl')})
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??'Revisa los datos'};const d=parsed.data
  try{await withTransaction(async tx=>{
    const organizers=await tx<{id:string}>(`SELECT id FROM memberships WHERE id=$1 AND status='active' AND member_type IN ('professional','school') LIMIT 1`,[organizerId]);if(!organizers[0])throw new Error('ORGANIZER_NOT_FOUND')
    const rows=await tx<{id:string}>(`INSERT INTO events(organizer_membership_id,title,description,image_url,starts_at,ends_at,all_day,modality,venue_name,address,city,province,postal_code,registration_url,public_contact,is_free,price_cents,status,submitted_at,reviewed_by,reviewed_at)
      VALUES($1,$2,$3,$4,$5::timestamp AT TIME ZONE 'Europe/Madrid',$6::timestamp AT TIME ZONE 'Europe/Madrid',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,CASE WHEN $18='draft' THEN NULL ELSE now() END,CASE WHEN $18='approved' THEN $19 END,CASE WHEN $18='approved' THEN now() END) RETURNING id`,
      [organizerId,d.title,d.description,d.imageUrl||null,d.startsAt,d.endsAt,d.allDay,d.modality,d.venueName||null,d.address||null,d.city||null,d.province||null,d.postalCode||null,d.registrationUrl||null,d.publicContact||null,d.isFree,d.isFree?null:Math.round((d.priceEuros??0)*100),status,admin.id])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'event.created_by_admin','event',$2,$3::jsonb)`,[admin.id,rows[0].id,JSON.stringify({status,organizerId})])
  });revalidatePath('/admin/eventos');revalidatePath('/eventos');revalidatePath('/embed/eventos');return{ok:true}}
  catch(error){if(error instanceof Error&&error.message==='ORGANIZER_NOT_FOUND')return{error:'Selecciona un profesional o escuela activos'};return{error:'No se pudo crear el evento'}}
}

export async function updateEvent(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const user=await requireUser();const membership=await getMembershipContext(user.id)
  if(!canCreateEvents(membership))return{error:'No tienes permiso para editar eventos'}
  const id=text(form,'eventId')
  const parsed=eventSchema.safeParse({title:text(form,'title'),description:text(form,'description'),startsAt:text(form,'startsAt'),endsAt:text(form,'endsAt'),allDay:checked(form,'allDay'),modality:text(form,'modality'),venueName:text(form,'venueName'),address:text(form,'address'),city:text(form,'city'),province:text(form,'province'),postalCode:text(form,'postalCode'),registrationUrl:text(form,'registrationUrl'),publicContact:text(form,'publicContact'),isFree:checked(form,'isFree'),priceEuros:text(form,'priceEuros')?Number(text(form,'priceEuros')):undefined,imageUrl:text(form,'imageUrl')})
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??'Revisa los datos'}
  const d=parsed.data
  const updated=await withTransaction(async tx=>{const rows=await tx<{id:string}>(`UPDATE events SET title=$1,description=$2,image_url=$3,starts_at=$4::timestamp AT TIME ZONE 'Europe/Madrid',ends_at=$5::timestamp AT TIME ZONE 'Europe/Madrid',all_day=$6,modality=$7,
    venue_name=$8,address=$9,city=$10,province=$11,postal_code=$12,registration_url=$13,public_contact=$14,is_free=$15,
    price_cents=$16,status='pending_review',submitted_at=now(),reviewed_by=NULL,reviewed_at=NULL,updated_at=now()
    WHERE id=$17 AND organizer_membership_id=$18 RETURNING id`,[d.title,d.description,d.imageUrl||null,d.startsAt,d.endsAt,d.allDay,d.modality,d.venueName||null,d.address||null,d.city||null,d.province||null,d.postalCode||null,d.registrationUrl||null,d.publicContact||null,d.isFree,d.isFree?null:Math.round((d.priceEuros??0)*100),id,membership!.membership_id])
  if(!rows[0])return false
  await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'event.updated_resubmitted','event',$2)`,[user.id,id]);return true})
  if(!updated)return{error:'Evento no encontrado'}
  revalidatePath('/mis-eventos');revalidatePath('/eventos');return{ok:true}
}

export async function reviewEvent(form:FormData) {
  const admin=await requireAdmin(); const id=text(form,'eventId'); const status=text(form,'status'); const notes=text(form,'notes')
  if(!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])||!['approved','rejected','cancelled'].includes(status)) return
  await withTransaction(async tx=>{
    await tx(`UPDATE events SET status=$1,moderation_notes=$2,reviewed_by=$3,reviewed_at=now(),updated_at=now() WHERE id=$4`,[status,notes||null,admin.id,id])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'event.reviewed','event',$2,$3::jsonb)`,[admin.id,id,JSON.stringify({status})])
  })
  revalidatePath('/admin/eventos'); revalidatePath('/eventos'); revalidatePath('/embed/eventos')
}
