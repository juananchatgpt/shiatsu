'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/access'
import { query, withTransaction } from '@/lib/db'
import { membershipStatusSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'

export async function updateMembershipStatus(form:FormData) {
  const admin=await requireAdmin()
  const parsed=membershipStatusSchema.safeParse({membershipId:String(form.get('membershipId')??''),status:String(form.get('status')??''),reason:String(form.get('reason')??'')})
  if(!parsed.success) return
  const {membershipId,status,reason}=parsed.data
  await withTransaction(async tx=>{
    const rows=await tx<{member_number:string|null}>(`UPDATE memberships SET status=$1,rejection_reason=$2,
      approved_by=CASE WHEN $1='active' THEN $3 ELSE approved_by END,
      approved_at=CASE WHEN $1='active' THEN COALESCE(approved_at,now()) ELSE approved_at END,
      anniversary_date=CASE WHEN $1='active' THEN COALESCE(anniversary_date,CURRENT_DATE) ELSE anniversary_date END,
      member_number=CASE WHEN $1='active' AND member_number IS NULL THEN 'APSE-'||LPAD(nextval('member_number_seq')::text,5,'0') ELSE member_number END,
      updated_at=now() WHERE id=$4 RETURNING member_number`,[status,reason||null,admin.id,membershipId])
    if(!rows[0]) throw new Error('MEMBERSHIP_NOT_FOUND')
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.status_changed','membership',$2,$3::jsonb)`,[admin.id,membershipId,JSON.stringify({status,reason:reason||null})])
  })
  revalidatePath('/admin/socios'); revalidatePath(`/admin/socios/${membershipId}`); revalidatePath('/directorio')
}

export async function createCommunicationDraft(form:FormData) {
  const admin=await requireAdmin(); const title=String(form.get('title')??'').trim(); const subject=String(form.get('subject')??'').trim()
  if(title.length<3||subject.length<3)return
  await query(`INSERT INTO communication_drafts(title,subject,body_text,body_html,audience_filter,created_by)
    VALUES($1,$2,$3,$4,$5::jsonb,$6)`,[title,subject,String(form.get('bodyText')??''),'',JSON.stringify({memberType:String(form.get('memberType')??'all'),status:'active'}),admin.id])
  revalidatePath('/admin/comunicaciones')
}

export async function createAdminAccount(_prev:{ok?:boolean;error?:string}|null,form:FormData){
  const actor=await requireAdmin();const email=String(form.get('email')??'').trim().toLowerCase();const name=String(form.get('fullName')??'').trim();const password=String(form.get('password')??'')
  if(!email.includes('@')||name.length<2||password.length<8)return{error:'Revisa nombre, email y contraseña (mínimo 8 caracteres)'}
  try{const rows=await query<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role) VALUES($1,$2,$3,'admin') RETURNING id`,[email,await hashPassword(password),name]);await query(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'admin.created','user',$2)`,[actor.id,rows[0].id]);revalidatePath('/admin/administradores');return{ok:true}}catch(error){if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'Ese email ya existe'};return{error:'No se pudo crear el administrador'}}
}
