import { query } from '@/lib/db'
import type { EventStatus } from '@/lib/domain'

export interface EventRow {
  id:string; organizer_membership_id:string; organizer_name:string; organizer_type:string; title:string; description:string
  image_url:string|null; starts_at:string; ends_at:string; all_day:boolean; modality:string; venue_name:string|null
  address:string|null; city:string|null; province:string|null; postal_code:string|null; country:string
  registration_url:string|null; public_contact:string|null; is_free:boolean; price_cents:number|null; currency:string
  featured:boolean; status:EventStatus; moderation_notes:string|null; created_at:string; updated_at:string
}

const SELECT = `SELECT e.*, COALESCE(sc.school_name,NULLIF(p.public_name,''),p.first_name||' '||p.last_name) organizer_name,
  m.member_type organizer_type FROM events e JOIN memberships m ON m.id=e.organizer_membership_id
  JOIN member_profiles p ON p.membership_id=m.id LEFT JOIN school_profiles sc ON sc.membership_id=m.id`

export async function listPublicEvents(from?: string) {
  return query<EventRow>(`${SELECT} WHERE e.status='approved' AND e.ends_at >= COALESCE($1::timestamptz,now()) ORDER BY e.featured DESC,e.starts_at ASC LIMIT 200`,[from||null])
}
export async function listMemberEvents(membershipId:string) {
  return query<EventRow>(`${SELECT} WHERE e.organizer_membership_id=$1 ORDER BY e.starts_at DESC`,[membershipId])
}
export async function getMemberEvent(id:string,membershipId:string){
  const rows=await query<EventRow>(`${SELECT} WHERE e.id=$1 AND e.organizer_membership_id=$2 LIMIT 1`,[id,membershipId])
  return rows[0]??null
}
export async function listAdminEvents(status?:string) {
  return query<EventRow>(`${SELECT} ${status?'WHERE e.status=$1':''} ORDER BY CASE e.status WHEN 'pending_review' THEN 0 ELSE 1 END,e.created_at DESC LIMIT 300`,status?[status]:[])
}
