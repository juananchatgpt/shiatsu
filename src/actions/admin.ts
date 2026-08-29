'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/access'
import { query, withTransaction } from '@/lib/db'
import { adminDeleteMemberSchema,adminManualMemberSchema,adminMemberProfileSchema,membershipPaymentSchema,membershipStatusSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'
import { FEES_CENTS, type MemberType } from '@/lib/domain'
import { getProfileCompletionIssues } from '@/features/memberships/profile-completion'
import { notifyRegistrationDecision } from '@/features/memberships/registration-notifications'

const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface MembershipWorkflowState {ok?:boolean;error?:string;message?:string}

export async function updateMembershipStatus(_prev:MembershipWorkflowState|null,form:FormData):Promise<MembershipWorkflowState> {
  const admin=await requireAdmin()
  const parsed=membershipStatusSchema.safeParse({membershipId:String(form.get('membershipId')??''),status:String(form.get('status')??''),reason:String(form.get('reason')??'')})
  if(!parsed.success) return{error:'Revisa el estado seleccionado'}
  const {membershipId,status,reason}=parsed.data
  try{
    const result=await withTransaction(async tx=>{
      const rows=await tx<{status:string;member_type:MemberType;profile_completed_at:string|null;payment_confirmed_at:string|null;email:string;name:string;has_qualification:boolean}>(`SELECT m.status,m.member_type,m.profile_completed_at,m.payment_confirmed_at,u.email,
        BTRIM(CONCAT(p.first_name,' ',p.last_name)) name,
        EXISTS(SELECT 1 FROM membership_documents d WHERE d.membership_id=m.id AND d.kind='professional_qualification' AND d.status='valid') has_qualification
        FROM memberships m JOIN users u ON u.id=m.user_id JOIN member_profiles p ON p.membership_id=m.id
        WHERE m.id=$1 FOR UPDATE OF m`,[membershipId])
      const member=rows[0];if(!member)throw new Error('MEMBERSHIP_NOT_FOUND')
      if(status==='pre_registered'&&member.member_type==='professional'&&!member.has_qualification)throw new Error('QUALIFICATION_REQUIRED')
      if(status==='active'&&['pending','rejected'].includes(member.status))throw new Error('APPROVAL_REQUIRED')
      if(status==='active'&&member.status==='pre_registered'&&(!member.profile_completed_at||!member.payment_confirmed_at))throw new Error('ACTIVATION_REQUIREMENTS')
      await tx(`UPDATE memberships SET status=$1,rejection_reason=$2,
        approved_by=CASE WHEN $1='pre_registered' THEN $3 ELSE approved_by END,
        approved_at=CASE WHEN $1='pre_registered' THEN COALESCE(approved_at,now()) ELSE approved_at END,
        anniversary_date=CASE WHEN $1='active' THEN COALESCE(anniversary_date,CURRENT_DATE) ELSE anniversary_date END,
        member_number=CASE WHEN $1='active' AND member_number IS NULL THEN nextval('member_number_seq')::text ELSE member_number END,
        updated_at=now() WHERE id=$4`,[status,reason||null,admin.id,membershipId])
      await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.status_changed','membership',$2,$3::jsonb)`,[admin.id,membershipId,JSON.stringify({from:member.status,to:status,reason:reason||null})])
      const decision:'approved'|'rejected'|null=member.status!==status?(status==='pre_registered'?'approved':status==='rejected'?'rejected':null):null
      return{...member,decision}
    })
    if(result.decision)await notifyRegistrationDecision({email:result.email,name:result.name,memberType:result.member_type,membershipId},result.decision)
    revalidateMembershipViews(membershipId)
    return{ok:true,message:status==='pre_registered'?'Solicitud aprobada. Queda en pre-registro hasta completar perfil y confirmar el pago.':'Estado guardado.'}
  }catch(error){
    if(error instanceof Error&&error.message==='QUALIFICATION_REQUIRED')return{error:'Antes de aprobar a un profesional, revisa su titulación y márcala como Válida en Documentación.'}
    if(error instanceof Error&&error.message==='APPROVAL_REQUIRED')return{error:'Primero aprueba la solicitud para pasarla a pre-registro.'}
    if(error instanceof Error&&error.message==='ACTIVATION_REQUIREMENTS')return{error:'Para activar deben constar el perfil completo y el pago confirmado.'}
    return{error:'No se pudo cambiar el estado del socio'}
  }
}

export async function setMembershipPaymentStatus(_prev:MembershipWorkflowState|null,form:FormData):Promise<MembershipWorkflowState>{
  const admin=await requireAdmin();const parsed=membershipPaymentSchema.safeParse({membershipId:text(form,'membershipId'),confirmed:text(form,'confirmed')})
  if(!parsed.success)return{error:'Solicitud de pago no válida'}
  const{membershipId,confirmed}=parsed.data
  try{
    const activated=await withTransaction(async tx=>{
      const rows=await tx<{status:string;profile_completed_at:string|null}>(`SELECT status,profile_completed_at FROM memberships WHERE id=$1 FOR UPDATE`,[membershipId]);const member=rows[0]
      if(!member)throw new Error('NOT_FOUND')
      if(member.status==='active'&&!confirmed)throw new Error('ACTIVE_PAYMENT')
      if(!['pre_registered','active'].includes(member.status))throw new Error('NOT_PRE_REGISTERED')
      const willActivate=confirmed&&member.status==='pre_registered'&&Boolean(member.profile_completed_at)
      await tx(`UPDATE memberships SET payment_confirmed_at=CASE WHEN $1 THEN COALESCE(payment_confirmed_at,now()) ELSE NULL END,
        payment_confirmed_by=CASE WHEN $1 THEN $2 ELSE NULL END,
        status=CASE WHEN $3 THEN 'active' ELSE status END,
        anniversary_date=CASE WHEN $3 THEN COALESCE(anniversary_date,CURRENT_DATE) ELSE anniversary_date END,
        member_number=CASE WHEN $3 AND member_number IS NULL THEN nextval('member_number_seq')::text ELSE member_number END,
        updated_at=now() WHERE id=$4`,[confirmed,admin.id,willActivate,membershipId])
      await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.payment_confirmation_changed','membership',$2,$3::jsonb)`,[admin.id,membershipId,JSON.stringify({confirmed,activated:willActivate})])
      return willActivate
    })
    revalidateMembershipViews(membershipId)
    return{ok:true,message:activated?'Pago confirmado. El perfil estaba completo y el socio ha quedado activo.':confirmed?'Pago confirmado. El socio se activará cuando complete el perfil.':'Se ha retirado la confirmación del pago.'}
  }catch(error){
    if(error instanceof Error&&error.message==='ACTIVE_PAYMENT')return{error:'No se puede retirar el pago de un socio activo. Cambia antes su estado si procede.'}
    if(error instanceof Error&&error.message==='NOT_PRE_REGISTERED')return{error:'El pago solo se confirma cuando la solicitud está en pre-registro.'}
    return{error:'No se pudo guardar la confirmación del pago'}
  }
}

function revalidateMembershipViews(membershipId:string){
  revalidatePath('/dashboard');revalidatePath('/admin/socios');revalidatePath(`/admin/socios/${membershipId}`);revalidatePath('/directorio');revalidatePath(`/directorio/${membershipId}`);revalidatePath('/embed/directorio')
}

export async function adminDeleteMember(_prev:{error?:string}|null,form:FormData){
  const admin=await requireAdmin();const parsed=adminDeleteMemberSchema.safeParse({membershipId:text(form,'membershipId'),confirmation:text(form,'confirmation').trim()})
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??'No se pudo confirmar el borrado'}
  const returnToRaw=text(form,'returnTo');const returnTo=returnToRaw==='/admin/socios'||returnToRaw.startsWith('/admin/socios?')?returnToRaw:'/admin/socios'
  try{await withTransaction(async tx=>{
    const rows=await tx<{user_id:string;member_type:string;member_number:string|null;has_school:boolean;has_events:boolean}>(`SELECT m.user_id,m.member_type,m.member_number,
      EXISTS(SELECT 1 FROM school_profiles s WHERE s.responsible_professional_membership_id=m.id) has_school,
      EXISTS(SELECT 1 FROM events e WHERE e.organizer_membership_id=m.id) has_events
      FROM memberships m WHERE m.id=$1 FOR UPDATE`,[parsed.data.membershipId]);const member=rows[0]
    if(!member)throw new Error('NOT_FOUND')
    if(member.has_school)throw new Error('HAS_SCHOOL')
    if(member.has_events)throw new Error('HAS_EVENTS')
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.deleted','membership',$2,$3::jsonb)`,[admin.id,parsed.data.membershipId,JSON.stringify({memberType:member.member_type,memberNumber:member.member_number})])
    await tx('DELETE FROM users WHERE id=$1',[member.user_id])
  })}
  catch(error){if(error instanceof Error&&error.message==='HAS_SCHOOL')return{error:'Este profesional tiene una escuela vinculada. Reasigna o elimina primero la escuela.'};if(error instanceof Error&&error.message==='HAS_EVENTS')return{error:'Este socio tiene eventos. Reasígnalos a otro profesional o escuela desde Administración → Eventos antes de borrarlo.'};if(error instanceof Error&&error.message==='NOT_FOUND')return{error:'El socio ya no existe'};return{error:'No se pudo borrar el socio'}}
  revalidatePath('/admin/socios');revalidatePath('/directorio');revalidatePath('/eventos');revalidatePath('/embed/directorio');revalidatePath('/embed/eventos')
  const separator=returnTo.includes('?')?'&':'?';redirect(`${returnTo}${separator}deleted=1`)
}

export async function createCommunicationDraft(form:FormData) {
  const admin=await requireAdmin(); const title=String(form.get('title')??'').trim(); const subject=String(form.get('subject')??'').trim()
  if(title.length<3||subject.length<3)return
  await query(`INSERT INTO communication_drafts(title,subject,body_text,body_html,audience_filter,created_by)
    VALUES($1,$2,$3,$4,$5::jsonb,$6)`,[title,subject,String(form.get('bodyText')??''),'',JSON.stringify({memberType:String(form.get('memberType')??'all'),status:'active'}),admin.id])
  revalidatePath('/admin/comunicaciones')
}

export async function deleteCommunicationDraft(form:FormData){
  const admin=await requireAdmin();const id=String(form.get('draftId')??'')
  if(!UUID_PATTERN.test(id))return
  await withTransaction(async tx=>{
    const drafts=await tx<{id:string}>('SELECT id FROM communication_drafts WHERE id=$1 FOR UPDATE',[id]);if(!drafts[0])return
    await tx('DELETE FROM communication_deliveries WHERE batch_id IN (SELECT id FROM communication_batches WHERE draft_id=$1)',[id])
    await tx('DELETE FROM communication_batches WHERE draft_id=$1',[id])
    await tx('DELETE FROM communication_drafts WHERE id=$1',[id])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'communication.deleted','communication_draft',$2)`,[admin.id,id])
  })
  revalidatePath('/admin/comunicaciones')
}

export async function createAdminAccount(_prev:{ok?:boolean;error?:string}|null,form:FormData){
  const actor=await requireAdmin();const email=String(form.get('email')??'').trim().toLowerCase();const name=String(form.get('fullName')??'').trim();const password=String(form.get('password')??'')
  if(!email.includes('@')||name.length<2||password.length<8)return{error:'Revisa nombre, email y contraseña (mínimo 8 caracteres)'}
  try{await withTransaction(async tx=>{const rows=await tx<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role) VALUES($1,$2,$3,'admin') RETURNING id`,[email,await hashPassword(password),name]);await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'admin.created','user',$2)`,[actor.id,rows[0].id])});revalidatePath('/admin/administradores');return{ok:true}}catch(error){if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'Ese email ya existe'};return{error:'No se pudo crear el administrador'}}
}

export async function setAdminActive(_prev:{ok?:boolean;error?:string}|null,form:FormData){
  const actor=await requireAdmin();const targetId=String(form.get('adminId')??'');const active=form.get('active')==='true'
  if(!UUID_PATTERN.test(targetId))return{error:'Administrador no válido'}
  if(!active&&targetId===actor.id)return{error:'No puedes desactivar tu propia cuenta'}
  try{await withTransaction(async tx=>{
    const targets=await tx<{active:boolean}>(`SELECT active FROM users WHERE id=$1 AND role='admin' FOR UPDATE`,[targetId]);if(!targets[0])throw new Error('NOT_FOUND')
    if(!active){const current=await tx<{id:string}>(`SELECT id FROM users WHERE role='admin' AND active=true FOR UPDATE`);if(current.length<=1)throw new Error('LAST_ADMIN')}
    await tx('UPDATE users SET active=$1,updated_at=now() WHERE id=$2',[active,targetId])
    if(!active)await tx('DELETE FROM sessions WHERE user_id=$1',[targetId])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'admin.active_changed','user',$2,$3::jsonb)`,[actor.id,targetId,JSON.stringify({active})])
  });revalidatePath('/admin/administradores');return{ok:true}}
  catch(error){if(error instanceof Error&&error.message==='LAST_ADMIN')return{error:'Debe quedar al menos un administrador activo'};return{error:'No se pudo cambiar el estado'}}
}

const text=(form:FormData,name:string)=>String(form.get(name)??'')
const checked=(form:FormData,name:string)=>form.get(name)==='on'

export async function adminCreateMember(_prev:{ok?:boolean;error?:string;membershipId?:string}|null,form:FormData){
  const admin=await requireAdmin();const parsed=adminManualMemberSchema.safeParse({
    memberType:text(form,'memberType'),status:text(form,'status'),email:text(form,'email'),password:text(form,'password'),
    firstName:text(form,'firstName'),lastName:text(form,'lastName'),memberNumber:text(form,'memberNumber'),anniversaryDate:text(form,'anniversaryDate'),
    identityDocument:text(form,'identityDocument'),phone:text(form,'phone'),city:text(form,'city'),province:text(form,'province'),
    directoryOptIn:checked(form,'directoryOptIn'),insuranceSelected:checked(form,'insuranceSelected'),schoolOrigin:text(form,'schoolOrigin'),
    trainingSchool:text(form,'trainingSchool'),qualificationSummary:text(form,'qualificationSummary'),schoolName:text(form,'schoolName'),
    responsibleMemberNumber:text(form,'responsibleMemberNumber'),publicName:text(form,'publicName'),publicEmail:text(form,'publicEmail'),
    publicPhone:text(form,'publicPhone'),publicCity:text(form,'publicCity'),publicProvince:text(form,'publicProvince'),website:text(form,'website'),bio:text(form,'bio'),
  });if(!parsed.success)return{error:parsed.error.issues[0]?.message??'Revisa los datos'};const d=parsed.data
  try{let membershipId='';await withTransaction(async tx=>{
    let responsibleId:string|null=null;if(d.memberType==='school'&&d.responsibleMemberNumber){const responsible=await tx<{id:string}>(`SELECT id FROM memberships WHERE member_number=$1 AND member_type='professional' LIMIT 1`,[d.responsibleMemberNumber]);if(!responsible[0])throw new Error('RESPONSIBLE_NOT_FOUND');responsibleId=responsible[0].id}
    const users=await tx<{id:string}>(`INSERT INTO users(email,password_hash,full_name,role,email_verified_at) VALUES($1,$2,$3,'member',now()) RETURNING id`,[d.email,await hashPassword(d.password),`${d.firstName} ${d.lastName}`.trim()])
    const insured=d.memberType!=='student'&&d.insuranceSelected
    const memberships=await tx<{id:string}>(`INSERT INTO memberships(user_id,member_number,member_type,status,insurance_selected,base_fee_cents,insurance_fee_cents,anniversary_date,directory_opt_in,privacy_accepted_at,approved_by,approved_at,profile_completed_at,payment_confirmed_at,payment_confirmed_by)
      VALUES($1,COALESCE(NULLIF($2,''),CASE WHEN $3='active' THEN nextval('member_number_seq')::text END),$4,$3,$5,$6,$7,NULLIF($8,'')::date,$9,now(),
      CASE WHEN $3 IN ('pre_registered','active') THEN $10 END,CASE WHEN $3 IN ('pre_registered','active') THEN now() END,
      CASE WHEN $3='active' THEN now() END,CASE WHEN $3='active' THEN now() END,CASE WHEN $3='active' THEN $10 END) RETURNING id`,
      [users[0].id,d.memberNumber||'',d.status,d.memberType,insured,FEES_CENTS[d.memberType],0,d.anniversaryDate||'',d.memberType!=='student'&&d.directoryOptIn,admin.id]);membershipId=memberships[0].id
    await tx(`INSERT INTO member_profiles(membership_id,first_name,last_name,identity_document,phone,city,province,public_name,public_email,public_phone,public_city,public_province,website,bio)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,[membershipId,d.firstName,d.lastName,d.identityDocument||null,d.phone||null,d.city||null,d.province||null,d.publicName||null,d.publicEmail||null,d.publicPhone||null,d.publicCity||null,d.publicProvince||null,d.website||null,d.bio||null])
    if(d.memberType==='student')await tx('INSERT INTO student_profiles(membership_id,school_origin) VALUES($1,$2)',[membershipId,d.schoolOrigin||'Sin especificar'])
    if(d.memberType==='professional')await tx('INSERT INTO professional_profiles(membership_id,training_school,qualification_summary) VALUES($1,$2,$3)',[membershipId,d.trainingSchool||null,d.qualificationSummary||null])
    if(d.memberType==='school')await tx(`INSERT INTO school_profiles(membership_id,responsible_professional_membership_id,school_name) VALUES($1,$2,$3)`,[membershipId,responsibleId,d.schoolName])
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.created_by_admin','membership',$2,$3::jsonb)`,[admin.id,membershipId,JSON.stringify({memberType:d.memberType,status:d.status})])
  });revalidatePath('/admin/socios');return{ok:true,membershipId}}
  catch(error){if(error instanceof Error&&error.message==='RESPONSIBLE_NOT_FOUND')return{error:'El número indicado no pertenece a un profesional'};if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'El email, número de socio o profesional responsable ya está en uso'};return{error:'No se pudo crear el socio'}}
}

export async function adminUpdateMemberProfile(_prev:{ok?:boolean;error?:string;message?:string}|null,form:FormData){
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
    responsibleMemberNumber:text(form,'responsibleMemberNumber'),newPassword:text(form,'newPassword'),confirmPassword:text(form,'confirmPassword'),
  })
  if(!parsed.success)return{error:parsed.error.issues[0]?.message??'Revisa los datos'}
  const d=parsed.data
  try{const activated=await withTransaction(async tx=>{
    const members=await tx<{user_id:string;member_type:MemberType;status:string}>('SELECT user_id,member_type,status FROM memberships WHERE id=$1 FOR UPDATE',[d.membershipId]);const member=members[0];if(!member)throw new Error('NOT_FOUND')
    const completionIssues=getProfileCompletionIssues(member.member_type,d);const profileComplete=completionIssues.length===0
    const passwordHash=d.newPassword?await hashPassword(d.newPassword):null
    await tx(`UPDATE users SET email=$1,full_name=$2,password_hash=COALESCE($3,password_hash),password_reset_required=CASE WHEN $3 IS NULL THEN password_reset_required ELSE false END,updated_at=now() WHERE id=$4`,[d.email,`${d.firstName} ${d.lastName}`.trim(),passwordHash,member.user_id])
    if(passwordHash){await tx('DELETE FROM sessions WHERE user_id=$1',[member.user_id]);await tx('DELETE FROM password_reset_tokens WHERE user_id=$1',[member.user_id])}
    const insured=member.member_type!=='student'&&d.insuranceSelected
    await tx(`UPDATE memberships SET member_number=$1,anniversary_date=NULLIF($2,'')::date,internal_notes=$3,directory_opt_in=$4,
      insurance_selected=$5,insurance_fee_cents=$6,updated_at=now() WHERE id=$7`,[d.memberNumber||null,d.anniversaryDate||'',d.internalNotes||null,
      member.member_type!=='student'&&d.directoryOptIn,insured,0,d.membershipId])
    await tx(`UPDATE member_profiles SET first_name=$1,last_name=$2,identity_document=$3,phone=$4,secondary_phone=$5,address=$6,postal_code=$7,city=$8,province=$9,
      public_name=$10,public_email=$11,public_phone=$12,public_address=$13,public_postal_code=$14,public_city=$15,public_province=$16,website=$17,bio=$18,
      facebook_url=$19,instagram_url=$20,youtube_url=$21,twitter_url=$22,updated_at=now() WHERE membership_id=$23`,[d.firstName,d.lastName,d.identityDocument||null,d.phone||null,
      d.secondaryPhone||null,d.address||null,d.postalCode||null,d.city||null,d.province||null,d.publicName||null,d.publicEmail||null,d.publicPhone||null,d.publicAddress||null,
      d.publicPostalCode||null,d.publicCity||null,d.publicProvince||null,d.website||null,d.bio||null,d.facebookUrl||null,d.instagramUrl||null,d.youtubeUrl||null,d.twitterUrl||null,d.membershipId])
    if(member.member_type==='student')await tx('UPDATE student_profiles SET school_origin=$1 WHERE membership_id=$2',[d.schoolOrigin||'Sin especificar',d.membershipId])
    if(member.member_type==='professional')await tx(`UPDATE professional_profiles SET training_school=$1,qualification_summary=$2,teaching_level=$3,teaching_schools=$4,teaching_since_year=$5 WHERE membership_id=$6`,[d.trainingSchool||null,d.qualificationSummary||null,d.teachingLevel||null,d.teachingSchools||null,d.teachingSinceYear||null,d.membershipId])
    if(member.member_type==='school'){let responsibleId:null|string=null;if(d.responsibleMemberNumber){const responsible=await tx<{id:string}>(`SELECT id FROM memberships WHERE member_number=$1 AND member_type='professional' LIMIT 1`,[d.responsibleMemberNumber]);if(!responsible[0])throw new Error('RESPONSIBLE_NOT_FOUND');responsibleId=responsible[0].id}await tx(`UPDATE school_profiles SET school_name=$1,description=$2,program_summary=$3,teachers_summary=$4,direction_experience_summary=$5,center_type=$6,languages=$7,responsible_professional_membership_id=$8 WHERE membership_id=$9`,[d.schoolName||'Escuela',d.schoolDescription||null,d.programSummary||null,d.teachersSummary||null,d.directionExperienceSummary||null,d.centerType||null,d.languages||null,responsibleId,d.membershipId])}
    const workflow=await tx<{status:string}>(`UPDATE memberships SET
      profile_completed_at=CASE WHEN status IN ('pending','pre_registered') THEN CASE WHEN $1 THEN COALESCE(profile_completed_at,now()) ELSE NULL END ELSE profile_completed_at END,
      status=CASE WHEN status='pre_registered' AND $1 AND payment_confirmed_at IS NOT NULL THEN 'active' ELSE status END,
      anniversary_date=CASE WHEN status='pre_registered' AND $1 AND payment_confirmed_at IS NOT NULL THEN COALESCE(anniversary_date,CURRENT_DATE) ELSE anniversary_date END,
      member_number=CASE WHEN status='pre_registered' AND $1 AND payment_confirmed_at IS NOT NULL AND member_number IS NULL THEN nextval('member_number_seq')::text ELSE member_number END,
      updated_at=now() WHERE id=$2 RETURNING status`,[profileComplete,d.membershipId])
    const wasActivated=member.status!=='active'&&workflow[0]?.status==='active'
    await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES($1,'membership.profile_updated_by_admin','membership',$2,$3::jsonb)`,[admin.id,d.membershipId,JSON.stringify({passwordChanged:Boolean(passwordHash),profileComplete,activated:wasActivated})])
    return wasActivated
  });revalidateMembershipViews(d.membershipId);return{ok:true,message:activated?'Ficha completada: como el pago ya estaba confirmado, el socio ha quedado activo.':'Todos los datos se han guardado.'}}
  catch(error){if(error instanceof Error&&error.message==='RESPONSIBLE_NOT_FOUND')return{error:'El número indicado no pertenece a un profesional'};if(typeof error==='object'&&error&&'code'in error&&error.code==='23505')return{error:'El email, número de socio o profesional responsable ya está en uso'};return{error:'No se pudieron guardar los cambios'}}
}
