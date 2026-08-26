import { query } from '@/lib/db'
import type { MemberStatus, MemberType } from '@/lib/domain'

export interface MembershipDetail {
  id: string; user_id: string; email: string; full_name: string | null; member_number: string | null
  member_type: MemberType; status: MemberStatus; insurance_selected: boolean; base_fee_cents: number
  insurance_fee_cents: number; anniversary_date: string | null; directory_opt_in: boolean
  rejection_reason: string | null; first_name: string; last_name: string; identity_document: string | null
  phone: string | null; secondary_phone: string | null; address: string | null; postal_code: string | null
  city: string | null; province: string | null; public_name: string | null; public_email: string | null
  public_phone: string | null; public_address: string | null; public_postal_code: string | null
  public_city: string | null; public_province: string | null; website: string | null; bio: string | null
  facebook_url: string | null; instagram_url: string | null; youtube_url: string | null
  school_origin: string | null; training_school: string | null; school_name: string | null
  has_photo:boolean
  qualification_summary:string|null; school_description:string|null; program_summary:string|null
  teachers_summary:string|null; direction_experience_summary:string|null
  created_at: string; updated_at: string
}

const DETAIL_SELECT = `
  SELECT m.id, m.user_id, u.email, u.full_name, m.member_number, m.member_type, m.status,
    m.insurance_selected, m.base_fee_cents, m.insurance_fee_cents, m.anniversary_date,
    m.directory_opt_in, m.rejection_reason, p.first_name, p.last_name, p.identity_document,
    p.phone, p.secondary_phone, p.address, p.postal_code, p.city, p.province,
    p.public_name, p.public_email, p.public_phone, p.public_address, p.public_postal_code,
    p.public_city, p.public_province, p.website, p.bio, p.facebook_url, p.instagram_url, p.youtube_url,
    st.school_origin, pr.training_school, pr.qualification_summary, sc.school_name, sc.description AS school_description,
    sc.program_summary,sc.teachers_summary,sc.direction_experience_summary,
    EXISTS(SELECT 1 FROM membership_profile_photos ph WHERE ph.membership_id=m.id) has_photo,m.created_at, m.updated_at
  FROM memberships m JOIN users u ON u.id = m.user_id
  JOIN member_profiles p ON p.membership_id = m.id
  LEFT JOIN student_profiles st ON st.membership_id = m.id
  LEFT JOIN professional_profiles pr ON pr.membership_id = m.id
  LEFT JOIN school_profiles sc ON sc.membership_id = m.id`

export async function getMembershipByUser(userId: string) {
  const rows = await query<MembershipDetail>(`${DETAIL_SELECT} WHERE m.user_id = $1 LIMIT 1`, [userId])
  return rows[0] ?? null
}

export async function getMembershipById(id: string) {
  const rows = await query<MembershipDetail>(`${DETAIL_SELECT} WHERE m.id = $1 LIMIT 1`, [id])
  return rows[0] ?? null
}

export interface AdminMemberRow {
  id: string; email: string; member_number: string | null; member_type: MemberType; status: MemberStatus
  insurance_selected: boolean; directory_opt_in: boolean; first_name: string; last_name: string
  province: string | null; created_at: string
}

export async function listAdminMembers(filters: { type?: string; status?: string; search?: string } = {}) {
  const conditions: string[] = []
  const params: unknown[] = []
  if (filters.type) { params.push(filters.type); conditions.push(`m.member_type = $${params.length}`) }
  if (filters.status) { params.push(filters.status); conditions.push(`m.status = $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR m.member_number ILIKE $${params.length})`)
  }
  return query<AdminMemberRow>(
    `SELECT m.id, u.email, m.member_number, m.member_type, m.status, m.insurance_selected,
      m.directory_opt_in, p.first_name, p.last_name, p.province, m.created_at
     FROM memberships m JOIN users u ON u.id=m.user_id JOIN member_profiles p ON p.membership_id=m.id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY CASE m.status WHEN 'pending' THEN 0 ELSE 1 END, m.created_at DESC LIMIT 500`, params,
  )
}

export interface PublicDirectoryRow {
  id: string; member_type: 'professional' | 'school'; name: string; public_email: string | null
  public_phone: string | null; public_city: string | null; public_province: string | null
  website: string | null; bio: string | null; has_photo:boolean; photo_version:string|null; school_name: string | null
  training_school: string | null
}

export async function listPublicDirectory(filters: { type?: string; province?: string; search?: string; limit?:number; offset?:number } = {}) {
  const conditions = ["m.status = 'active'", 'm.directory_opt_in = true', "m.member_type IN ('professional','school')"]
  const params: unknown[] = []
  if (filters.type && ['professional', 'school'].includes(filters.type)) {
    params.push(filters.type); conditions.push(`m.member_type = $${params.length}`)
  }
  if (filters.province) { params.push(filters.province); conditions.push(`p.public_province = $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(COALESCE(sc.school_name, p.public_name, p.first_name || ' ' || p.last_name) ILIKE $${params.length} OR COALESCE(pr.training_school,'') ILIKE $${params.length})`)
  }
  return query<PublicDirectoryRow>(
    `SELECT m.id, m.member_type,
      COALESCE(sc.school_name, NULLIF(p.public_name,''), p.first_name || ' ' || p.last_name) AS name,
      p.public_email, p.public_phone, p.public_city, p.public_province, p.website, p.bio,
      (ph.membership_id IS NOT NULL) has_photo,EXTRACT(EPOCH FROM ph.updated_at)::bigint::text photo_version,
      sc.school_name, pr.training_school
     FROM memberships m JOIN member_profiles p ON p.membership_id=m.id
     LEFT JOIN professional_profiles pr ON pr.membership_id=m.id
     LEFT JOIN school_profiles sc ON sc.membership_id=m.id
     LEFT JOIN membership_profile_photos ph ON ph.membership_id=m.id
     WHERE ${conditions.join(' AND ')} ORDER BY name ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params,filters.limit??250,filters.offset??0],
  )
}

export async function getAdminStats() {
  const rows = await query<{ total: number; pending: number; active: number; directory: number }>(
    `SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE status='pending')::int pending,
      COUNT(*) FILTER (WHERE status='active')::int active,
      COUNT(*) FILTER (WHERE status='active' AND directory_opt_in)::int directory FROM memberships`,
  )
  return rows[0] ?? { total: 0, pending: 0, active: 0, directory: 0 }
}
