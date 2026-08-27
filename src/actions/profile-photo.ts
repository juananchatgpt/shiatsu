'use server'

import { revalidatePath } from 'next/cache'
import { requireUser,getMembershipContext,requireAdmin } from '@/lib/access'
import { withTransaction } from '@/lib/db'
import { isValidImage } from '@/lib/images'
import type { ActionState } from './memberships'

const ALLOWED=new Set(['image/jpeg','image/png','image/webp'])
const MAX_BYTES=5*1024*1024

async function readImage(form:FormData,name:string){
  const file=form.get(name);if(!(file instanceof File)||file.size===0)throw new Error('NO_FILE')
  if(!ALLOWED.has(file.type))throw new Error('BAD_TYPE')
  if(file.size>MAX_BYTES)throw new Error('TOO_LARGE')
  const content=Buffer.from(await file.arrayBuffer());if(!isValidImage(content,file.type))throw new Error('BAD_IMAGE')
  return{file,content}
}
function imageError(error:unknown):ActionState{if(error instanceof Error){if(error.message==='NO_FILE')return{error:'Selecciona una imagen'};if(error.message==='BAD_TYPE')return{error:'Solo se admiten JPG, PNG o WebP'};if(error.message==='TOO_LARGE')return{error:'La imagen no puede superar 5 MB'};if(error.message==='BAD_IMAGE')return{error:'El contenido no corresponde a una imagen válida'}}return{error:'No se pudo guardar la imagen'}}
function revalidateMemberImages(id:string){revalidatePath('/perfil');revalidatePath('/directorio');revalidatePath(`/directorio/${id}`);revalidatePath('/embed/directorio');revalidatePath(`/admin/socios/${id}`)}

export async function uploadProfilePhoto(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const user=await requireUser();const membership=await getMembershipContext(user.id)
  if(!membership||membership.member_type==='student')return{error:'Solo profesionales y escuelas pueden subir una imagen'}
  try{const{file,content}=await readImage(form,'photo');await withTransaction(async tx=>{await tx(`INSERT INTO membership_profile_photos(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'member_upload') ON CONFLICT(membership_id) DO UPDATE SET original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,content=EXCLUDED.content,source='member_upload',updated_at=now()`,[membership.membership_id,file.name.slice(0,255),file.type,file.size,content]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_updated','membership',$2)`,[user.id,membership.membership_id])});revalidateMemberImages(membership.membership_id);return{ok:true}}catch(error){return imageError(error)}
}

export async function deleteProfilePhoto(){
  const user=await requireUser();const membership=await getMembershipContext(user.id);if(!membership)return
  await withTransaction(async tx=>{const rows=await tx(`DELETE FROM membership_profile_photos WHERE membership_id=$1 RETURNING membership_id`,[membership.membership_id]);if(rows[0])await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_deleted','membership',$2)`,[user.id,membership.membership_id])})
  revalidateMemberImages(membership.membership_id)
}

export async function uploadProfileCover(_prev:ActionState|null,form:FormData):Promise<ActionState>{
  const user=await requireUser();const membership=await getMembershipContext(user.id);if(!membership||membership.member_type!=='school')return{error:'Solo las escuelas pueden subir una portada'}
  try{const{file,content}=await readImage(form,'cover');await withTransaction(async tx=>{await tx(`INSERT INTO membership_cover_images(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'member_upload') ON CONFLICT(membership_id) DO UPDATE SET original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,content=EXCLUDED.content,source='member_upload',updated_at=now()`,[membership.membership_id,file.name.slice(0,255),file.type,file.size,content]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.cover_updated','membership',$2)`,[user.id,membership.membership_id])});revalidateMemberImages(membership.membership_id);return{ok:true}}catch(error){return imageError(error)}
}
export async function deleteProfileCover(){const user=await requireUser();const membership=await getMembershipContext(user.id);if(!membership||membership.member_type!=='school')return;await withTransaction(async tx=>{const rows=await tx(`DELETE FROM membership_cover_images WHERE membership_id=$1 RETURNING membership_id`,[membership.membership_id]);if(rows[0])await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.cover_deleted','membership',$2)`,[user.id,membership.membership_id])});revalidateMemberImages(membership.membership_id)}

export async function adminUploadProfilePhoto(_prev:ActionState|null,form:FormData):Promise<ActionState>{const admin=await requireAdmin();const id=String(form.get('membershipId')??'');try{const{file,content}=await readImage(form,'photo');await withTransaction(async tx=>{const members=await tx(`SELECT 1 FROM memberships WHERE id=$1`,[id]);if(!members[0])throw new Error('NOT_FOUND');await tx(`INSERT INTO membership_profile_photos(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'member_upload') ON CONFLICT(membership_id) DO UPDATE SET original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,content=EXCLUDED.content,source='member_upload',updated_at=now()`,[id,file.name.slice(0,255),file.type,file.size,content]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_updated_by_admin','membership',$2)`,[admin.id,id])});revalidateMemberImages(id);return{ok:true}}catch(error){return imageError(error)}}
export async function adminDeleteProfilePhoto(form:FormData){const admin=await requireAdmin();const id=String(form.get('membershipId')??'');await withTransaction(async tx=>{await tx(`DELETE FROM membership_profile_photos WHERE membership_id=$1`,[id]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.photo_deleted_by_admin','membership',$2)`,[admin.id,id])});revalidateMemberImages(id)}
export async function adminUploadProfileCover(_prev:ActionState|null,form:FormData):Promise<ActionState>{const admin=await requireAdmin();const id=String(form.get('membershipId')??'');try{const{file,content}=await readImage(form,'cover');await withTransaction(async tx=>{const members=await tx(`SELECT 1 FROM memberships WHERE id=$1 AND member_type='school'`,[id]);if(!members[0])throw new Error('NOT_FOUND');await tx(`INSERT INTO membership_cover_images(membership_id,original_name,mime_type,size_bytes,content,source) VALUES($1,$2,$3,$4,$5,'member_upload') ON CONFLICT(membership_id) DO UPDATE SET original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,content=EXCLUDED.content,source='member_upload',updated_at=now()`,[id,file.name.slice(0,255),file.type,file.size,content]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.cover_updated_by_admin','membership',$2)`,[admin.id,id])});revalidateMemberImages(id);return{ok:true}}catch(error){return imageError(error)}}
export async function adminDeleteProfileCover(form:FormData){const admin=await requireAdmin();const id=String(form.get('membershipId')??'');await withTransaction(async tx=>{await tx(`DELETE FROM membership_cover_images WHERE membership_id=$1`,[id]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.cover_deleted_by_admin','membership',$2)`,[admin.id,id])});revalidateMemberImages(id)}
