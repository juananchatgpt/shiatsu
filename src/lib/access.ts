import { redirect } from 'next/navigation'
import { getSessionUser } from './auth'
import { query } from './db'
import type { MemberStatus, MemberType } from './domain'

export interface MembershipContext {
  membership_id: string
  member_type: MemberType
  status: MemberStatus
  directory_opt_in: boolean
  member_number: string | null
  profile_completed_at?:string|null
  payment_confirmed_at?:string|null
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/dashboard')
  return user
}

export async function getMembershipContext(userId: string) {
  const rows = await query<MembershipContext>(
    `SELECT id AS membership_id, member_type, status, directory_opt_in, member_number,profile_completed_at::text,payment_confirmed_at::text
     FROM memberships WHERE user_id = $1 LIMIT 1`, [userId],
  )
  return rows[0] ?? null
}

export function canCreateEvents(membership: MembershipContext | null) {
  return Boolean(membership && membership.status === 'active' && ['professional', 'school'].includes(membership.member_type))
}

export function isPublicDirectoryMember(type: MemberType, status: MemberStatus, optedIn: boolean) {
  return status === 'active' && optedIn && (type === 'professional' || type === 'school')
}
