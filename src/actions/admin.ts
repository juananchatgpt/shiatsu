'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/access'
import { query, withTransaction } from '@/lib/db'
import { adminMemberProfileSchema,membershipStatusSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'
import { INSURANCE_FEE_CENTS } from '@/lib/domain'

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
  try{await withTransaction(async tx=>{const rows=await tx<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role) VALUES($1,$2,$3,'admin') RETURNING id`,[email,await hashPassword(password),name]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'admin.created','user',$2)`,[actor.id,rows[0].id])});revalidatePath('/admin/administradores');return{ok:true}}catch(error){if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'Ese email ya existe'};return{error:'No se pudo crear el administrador'}}
}

const text=(form:FormData,name:string)=>String(form.get(name)??'')
const checked=(form:FormData,name:string)=>form.get(name)==='on'

export async function adminUpdateMemberProfile(_prev:{ok?:boolean;error?:string}|null,form:FormData){
  const admin=await requireAdmin()
  const parsed=adminMemberProfileSchema.safeParse({
    membershipId:text(form,'membershipId'),memberNumber:text(form,'memberNumber'),anniversaryDate:text(form,'anniversaryDate'),internalNotes:text(form,'internalNotes'),
    email:text(form,'email'),currentPassword:'',firstName:text(form,'firstName'),lastName:text(form,'lastName'),identityDocument:text(form,'identityDocument'),
    phone:text(form,'phone'),secondaryPhone:text(form,'secondaryPhone'),address:text(form,'address'),postalCode:text(form,'postalCode'),city:text(form,'city'),province:text(form,'province'),
    directoryOptIn:checked(form,'directoryOptIn'),insuranceSelected:checked(form,'insuranceSelected'),publicName:text(form,'publicName'),publicEmail:text(form,'publicEmail'),
    publicPhone:text(form,'publicPhone'),publicAddress:text(form,'publicAddress'),publicPostalCode:text(form,'publicPostalCode'),publicCity:text(form,'publicCity'),
    publicProvince:text(form,'publicProvince'),website:text(form,'website'),bio:text(form,'bio'),facebookUrl:text(form,'facebookUrl'),instagramUrl:text(form,'instagramUrl'),
    youtubeUrl:text(form,'youtubeUrl'),twitterUrl:text(form,'twitterUrl'),schoolOrigin:text(form,'schoolOrigin'),trainingSchool:text(form,'trainingSchool'),
    qualificationSummary:text(form,'qualificationSummary'),teachingLevel:text(form,'teachingLevel'),teachingSchools:text(form,'teachingSchools'),
    teachingSinceYear:text(form,'teachingSinceYear'),schoolName:text(form,'schoolName'),schoolDescription:text(form,'schoolDescription'),centerType:text(form,'centerType'),
    languages:text(form,'languages'),programSummary:text(form,'programSummary'),teachersSummary:text(form,'teachersSummary'),directionExperienceSummary:text(form,'directionExperienceSummary'),
    responsibleMemberNumber:text(form,'responsibleMemberNumber'),
  })
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??'Revisa los datos'}
  const d=parsed.data
  try{await withTransaction(async tx=>{
    const members=await tx<{user_id:string;member_type:'student'|'professional'|'school'}>('SELECT user_id,member_type FROM memberships WHERE id=$1 LIMIT 1',[d.membershipId]);const member=members[0];if(!member)throw new Error('NOT_FOUND')
    await tx('UPDATE users SET email=$1,full_name=$2,updated_at=now() WHERE id=$3',[d.email,`${d.firstName} ${d.lastName}`.trim(),member.user_id])
    const insured=member.member_type!=='student'&&d.insuranceSelected
    await tx(`UPDATE memberships SET member_number=$1,anniversary_date=NULLIF($2,'')::date,internal_notes=$3,directory_opt_in=$4,
      insurance_selected=$5,insurance_fee_cents=$6,updated_at=now() WHERE id=$7`,[d.memberNumber||null,d.anniversaryDate||'',d.internalNotes||null,
      member.member_type!=='student'&&d.directoryOptIn,insured,insured?INSURANCE_FEE_CENTS:0,d.membershipId])
    await tx(`UPDATE member_profiles SET first_name=$1,last_name=$2,identity_document=$3,phone=$4,secondary_phone=$5,address=$6,postal_code=$7,city=$8,province=$9,
      public_name=$10,public_email=$11,public_phone=$12,public_address=$13,public_postal_code=$14,public_city=$15,public_province=$16,website=$17,bio=$18,
      facebook_url=$19,instagram_url=$20,youtube_url=$21,twitter_url=$22,updated_at=now() WHERE membership_id=$23`,[d.firstName,d.lastName,d.identityDocument||null,d.phone||null,
      d.secondaryPhone||null,d.address||null,d.postalCode||null,d.city||null,d.province||null,d.publicName||null,d.publicEmail||null,d.publicPhone||null,d.publicAddress||null,
      d.publicPostalCode||null,d.publicCity||null,d.publicProvince||null,d.website||null,d.bio||null,d.facebookUrl||null,d.instagramUrl||null,d.youtubeUrl||null,d.twitterUrl||null,d.membershipId])
    if(member.member_type==='student')await tx('UPDATE student_profiles SET school_origin=$1 WHERE membership_id=$2',[d.schoolOrigin||'Sin especificar',d.membershipId])
    if(member.member_type==='professional')await tx(`UPDATE professional_profiles SET training_school=$1,qualification_summary=$2,teaching_level=$3,teaching_schools=$4,teaching_since_year=$5 WHERE membership_id=$6`,[d.trainingSchool||null,d.qualificationSummary||null,d.teachingLevel||null,d.teachingSchools||null,d.teachingSinceYear||null,d.membershipId])
    if(member.member_type==='school'){let responsibleId:null|string=null;if(d.responsibleMemberNumber){const responsible=await tx<{id:string}>(`SELECT id FROM memberships WHERE member_number=$1 AND member_type='professional' LIMIT 1`,[d.responsibleMemberNumber]);if(!responsible[0])throw new Error('RESPONSIBLE_NOT_FOUND');responsibleId=responsible[0].id}await tx(`UPDATE school_profiles SET school_name=$1,description=$2,program_summary=$3,teachers_summary=$4,direction_experience_summary=$5,center_type=$6,languages=$7,responsible_professional_membership_id=$8 WHERE membership_id=$9`,[d.schoolName||'Escuela',d.schoolDescription||null,d.programSummary||null,d.teachersSummary||null,d.directionExperienceSummary||null,d.centerType||null,d.languages||null,responsibleId,d.membershipId])}
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.profile_updated_by_admin','membership',$2)`,[admin.id,d.membershipId])
  });revalidatePath('/admin/socios');revalidatePath(`/admin/socios/${d.membershipId}`);revalidatePath('/directorio');revalidatePath(`/directorio/${d.membershipId}`);revalidatePath('/embed/directorio');return{ok:true}}
  catch(error){if(error instanceof Error&&error.message==='RESPONSIBLE_NOT_FOUND')return{error:'El número indicado no pertenece a un profesional'};if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'El email, número de socio o profesional responsable ya está en uso'};return{error:'No se pudieron guardar los cambios'}}
}
