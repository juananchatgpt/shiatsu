'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin,requireUser,getMembershipContext } from '@/lib/access'
import { withTransaction } from '@/lib/db'
import type { ActionState } from './memberships'

const ALLOWED_MIME=new Set(['application/pdf','image/jpeg','image/png','image/webp'])
const MAX_BYTES=5*1024*1024
const ALLOWED_KINDS={professional:new Set(['professional_qualification','other']),school:new Set(['school_program','school_teachers','school_direction','other'])}

export async function uploadMembershipDocument(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const user=await requireUser();const membership=await getMembershipContext(user.id)
  if(!membership||membership.member_type==='student')return{error:'Tu tipo de socio no admite documentación'}
  const file=form.get('document');const kind=String(form.get('kind')??'')
  if(!(file instanceof File)||file.size===0)return{error:'Selecciona un archivo'}
  if(!ALLOWED_KINDS[membership.member_type].has(kind))return{error:'Tipo de documento no válido'}
  if(!ALLOWED_MIME.has(file.type))return{error:'Solo se admiten PDF, JPG, PNG o WebP'}
  if(file.size>MAX_BYTES)return{error:'El archivo no puede superar 5 MB'}
  const content=Buffer.from(await file.arrayBuffer())
  await withTransaction(async tx=>{
    const rows=await tx<{id:string}>(`INSERT INTO membership_documents(membership_id,kind,original_name,storage_key,mime_type,size_bytes,content) VALUES($1,$2,$3,NULL,$4,$5,$6) RETURNING id`,[membership.membership_id,kind,file.name.slice(0,255),file.type,file.size,content])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.document_uploaded','membership_document',$2)`,[user.id,rows[0].id])
  })
  revalidatePath('/perfil');return{ok:true}
}

export async function deleteMembershipDocument(form:FormData){
  const user=await requireUser();const id=String(form.get('documentId')??'')
  await withTransaction(async tx=>{const rows=await tx<{id:string}>(`DELETE FROM membership_documents d USING memberships m WHERE d.id=$1 AND d.membership_id=m.id AND m.user_id=$2 RETURNING d.id`,[id,user.id]);if(rows[0])await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.document_deleted','membership_document',$2)`,[user.id,id])})
  revalidatePath('/perfil')
}

export async function reviewMembershipDocument(form:FormData){
  const admin=await requireAdmin();const id=String(form.get('documentId')??'');const status=String(form.get('status')??'')
  if(!['valid','rejected','pending'].includes(status))return
  await withTransaction(async tx=>{const rows=await tx<{membership_id:string}>(`UPDATE membership_documents SET status=$1,reviewed_by=$2,reviewed_at=CASE WHEN $1='pending' THEN NULL ELSE now() END WHERE id=$3 RETURNING membership_id`,[status,admin.id,id]);if(rows[0])await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.document_reviewed','membership_document',$2,$3::jsonb)`,[admin.id,id,JSON.stringify({status})])})
  revalidatePath('/admin/socios')
}
