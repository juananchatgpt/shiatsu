'use server'

import { revalidatePath } from 'next/cache'
import { requireUser,getMembershipContext } from '@/lib/access'
import { withTransaction } from '@/lib/db'
import { isValidImage } from '@/lib/images'
import type { ActionState } from './memberships'

const ALLOWED=new Set(['image/jpeg','image/png','image/webp'])
const MAX_BYTES=5*1024*1024

export async function uploadProfilePhoto(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const user=await requireUser();const membership=await getMembershipContext(user.id)
  if(!membership||membership.member_type==='student')return{error:'Solo profesionales y escuelas pueden subir una imagen'}
  const file=form.get('photo');if(!(file instanceof File)||file.size===0)return{error:'Selecciona una imagen'}
  if(!ALLOWED.has(file.type))return{error:'Solo se admiten JPG, PNG o WebP'}
  if(file.size>MAX_BYTES)return{error:'La imagen no puede superar 5 MB'}
  const content=Buffer.from(await file.arrayBuffer());if(!isValidImage(content,file.type))return{error:'El contenido no corresponde a una imagen válida'}
  await withTransaction(async tx=>{await tx(`INSERT INTO membership_profile_photos(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'member_upload') ON CONFLICT(membership_id) DO UPDATE SET original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,content=EXCLUDED.content,source='member_upload',updated_at=now()`,[membership.membership_id,file.name.slice(0,255),file.type,file.size,content]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_updated','membership',$2)`,[user.id,membership.membership_id])})
  revalidatePath('/perfil');revalidatePath('/directorio');revalidatePath('/embed/directorio');return{ok:true}
}

export async function deleteProfilePhoto(){
  const user=await requireUser();const membership=await getMembershipContext(user.id);if(!membership)return
  await withTransaction(async tx=>{const rows=await tx(`DELETE FROM membership_profile_photos WHERE membership_id=$1 RETURNING membership_id`,[membership.membership_id]);if(rows[0])await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_deleted','membership',$2)`,[user.id,membership.membership_id])})
  revalidatePath('/perfil');revalidatePath('/directorio');revalidatePath('/embed/directorio')
}
