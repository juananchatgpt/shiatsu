import type { EventRow } from './service'

export function toPublicEvent(event:EventRow){return {
  id:event.id,title:event.title,description:event.description,imageUrl:event.image_url,
  startsAt:event.starts_at,endsAt:event.ends_at,allDay:event.all_day,timezone:'Europe/Madrid',
  modality:event.modality,venueName:event.venue_name,address:event.address,city:event.city,
  province:event.province,postalCode:event.postal_code,country:event.country,
  registrationUrl:event.registration_url,publicContact:event.public_contact,isFree:event.is_free,
  priceCents:event.price_cents,currency:event.currency,featured:event.featured,
  organizerName:event.organizer_name,organizerType:event.organizer_type,
}}
