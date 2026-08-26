import { query } from '@/lib/db'
import type { MembershipDocument } from './document-types'

export async function listMembershipDocuments(membershipId:string){
  return query<MembershipDocument>(`SELECT id,membership_id,kind,original_name,mime_type,size_bytes::int,status,created_at FROM membership_documents WHERE membership_id=$1 ORDER BY created_at DESC`,[membershipId])
}
