'use server'

import { hashPassword, verifyPassword } from '@/lib/auth'
import { withTransaction } from '@/lib/db'
import { FEES_CENTS, type MemberType } from '@/lib/domain'
import { registrationSchema, profileSchema } from '@/lib/validation'
import { requireUser } from '@/lib/access'
import { checkPublicRateLimit } from '@/lib/rate-limit'

export interface ActionState { ok?: boolean; error?: string }
const checked = (form: FormData, name: string) => form.get(name) === 'on'
const text = (form: FormData, name: string) => String(form.get(name) ?? '')

export async function registerMember(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  if(text(form,'website_confirm'))return{ok:true}
  if(!await checkPublicRateLimit('registration',8,60))return{error:'Demasiados intentos. Prueba de nuevo más tarde.'}
  const parsed = registrationSchema.safeParse({
    memberType: text(form, 'memberType'), firstName: text(form, 'firstName'), lastName: text(form, 'lastName'),
    identityDocument: text(form, 'identityDocument'), phone: text(form, 'phone'), email: text(form, 'email'),
    password: text(form, 'password'), privacyAccepted: text(form, 'privacyAccepted'),
    schoolOrigin: text(form, 'schoolOrigin'), responsibleMemberNumber: text(form, 'responsibleMemberNumber'),
    trainingSchool:text(form,'trainingSchool'), qualificationSummary:text(form,'qualificationSummary'),
    schoolName: text(form, 'schoolName'), schoolDescription:text(form,'schoolDescription'),
    programSummary:text(form,'programSummary'),teachersSummary:text(form,'teachersSummary'),
    directionExperienceSummary:text(form,'directionExperienceSummary'),insuranceSelected: checked(form, 'insuranceSelected'),
    directoryOptIn: checked(form, 'directoryOptIn'), publicName: text(form, 'publicName'),
    publicEmail: text(form, 'publicEmail'), publicPhone: text(form, 'publicPhone'),
    publicProvince: text(form, 'publicProvince'), publicCity: text(form, 'publicCity'),
    website: text(form, 'website'), bio: text(form, 'bio'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  const data = parsed.data
  try {
    await withTransaction(async (tx) => {
      let responsibleId: string | null = null
      if (data.memberType === 'school') {
        const responsible = await tx<{ id: string }>(
          `SELECT m.id FROM memberships m
           WHERE m.member_number=$1 AND m.member_type='professional' AND m.status='active'
           AND NOT EXISTS (SELECT 1 FROM school_profiles s WHERE s.responsible_professional_membership_id=m.id)
           LIMIT 1`, [data.responsibleMemberNumber],
        )
        if (!responsible[0]) throw new Error('RESPONSIBLE_NOT_FOUND')
        responsibleId = responsible[0].id
      }
      const users = await tx<{ id: string }>(
        `INSERT INTO users (email,password_hash,full_name,role) VALUES ($1,$2,$3,'member') RETURNING id`,
        [data.email, await hashPassword(data.password), `${data.firstName} ${data.lastName}`.trim()],
      )
      const insuranceAllowed = data.memberType !== 'student' && data.insuranceSelected
      const memberships = await tx<{ id: string }>(
        `INSERT INTO memberships (user_id,member_type,status,insurance_selected,base_fee_cents,insurance_fee_cents,directory_opt_in,privacy_accepted_at)
         VALUES ($1,$2,'pending',$3,$4,$5,$6,now()) RETURNING id`,
        [users[0].id, data.memberType, insuranceAllowed, FEES_CENTS[data.memberType], 0,
          data.memberType !== 'student' && data.directoryOptIn],
      )
      const membershipId = memberships[0].id
      await tx(
        `INSERT INTO member_profiles (membership_id,first_name,last_name,identity_document,phone,city,province,public_name,public_email,public_phone,public_city,public_province,website,bio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [membershipId, data.firstName, data.lastName, data.identityDocument, data.phone, data.publicCity || null,
          data.publicProvince || null, data.publicName || null, data.publicEmail || null, data.publicPhone || null,
          data.publicCity || null, data.publicProvince || null, data.website || null, data.bio || null],
      )
      if (data.memberType === 'student') await tx('INSERT INTO student_profiles (membership_id,school_origin) VALUES ($1,$2)', [membershipId, data.schoolOrigin])
      if (data.memberType === 'professional') await tx('INSERT INTO professional_profiles (membership_id,training_school,qualification_summary) VALUES ($1,$2,$3)', [membershipId,data.trainingSchool,data.qualificationSummary])
      if (data.memberType === 'school') await tx(
        `INSERT INTO school_profiles (membership_id,responsible_professional_membership_id,school_name,description,program_summary,teachers_summary,direction_experience_summary)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [membershipId,responsibleId,data.schoolName,data.schoolDescription||null,data.programSummary,data.teachersSummary,data.directionExperienceSummary],
      )
      await tx(`INSERT INTO audit_log (action,entity_type,entity_id,details) VALUES ('membership.registered','membership',$1,$2::jsonb)`,
        [membershipId, JSON.stringify({ memberType: data.memberType })])
    })
    return { ok: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'RESPONSIBLE_NOT_FOUND') return { error: 'El profesional responsable no existe, no está activo o ya tiene una escuela' }
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') return { error: 'Ya existe una cuenta con ese email' }
    console.error('registerMember', error)
    return { error: 'No se pudo completar el alta. Inténtalo de nuevo.' }
  }
}

export async function updateProfile(_prev: ActionState | null, form: FormData): Promise<ActionState> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse({
    email:text(form,'email'), currentPassword:text(form,'currentPassword'),firstName:text(form,'firstName'), lastName:text(form,'lastName'),
    identityDocument:text(form,'identityDocument'), phone:text(form,'phone'), secondaryPhone:text(form,'secondaryPhone'),
    address:text(form,'address'), postalCode:text(form,'postalCode'), city:text(form,'city'), province:text(form,'province'),
    directoryOptIn:checked(form,'directoryOptIn'), publicName:text(form,'publicName'), publicEmail:text(form,'publicEmail'),
    publicPhone:text(form,'publicPhone'), publicAddress:text(form,'publicAddress'), publicPostalCode:text(form,'publicPostalCode'),
    publicCity:text(form,'publicCity'), publicProvince:text(form,'publicProvince'), website:text(form,'website'), bio:text(form,'bio'),
    facebookUrl:text(form,'facebookUrl'), instagramUrl:text(form,'instagramUrl'), youtubeUrl:text(form,'youtubeUrl'),twitterUrl:text(form,'twitterUrl'),
    insuranceSelected:checked(form,'insuranceSelected'),schoolOrigin:text(form,'schoolOrigin'),trainingSchool:text(form,'trainingSchool'),
    qualificationSummary:text(form,'qualificationSummary'),teachingLevel:text(form,'teachingLevel'),teachingSchools:text(form,'teachingSchools'),
    teachingSinceYear:text(form,'teachingSinceYear'),schoolName:text(form,'schoolName'),schoolDescription:text(form,'schoolDescription'),
    centerType:text(form,'centerType'),languages:text(form,'languages'),
    programSummary:text(form,'programSummary'),teachersSummary:text(form,'teachersSummary'),directionExperienceSummary:text(form,'directionExperienceSummary'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' }
  const d = parsed.data
  try {
    await withTransaction(async (tx) => {
      const memberships = await tx<{ id:string; member_type:MemberType; email:string; password_hash:string }>(`SELECT m.id,m.member_type,u.email,u.password_hash FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.user_id=$1 LIMIT 1`,[user.id])
      if (!memberships[0]) throw new Error('NO_MEMBERSHIP')
      const m=memberships[0]
      if(d.email!==m.email&&(!d.currentPassword||!await verifyPassword(d.currentPassword,m.password_hash)))throw new Error('REAUTH_REQUIRED')
      await tx('UPDATE users SET email=$1,full_name=$2,updated_at=now() WHERE id=$3',[d.email,`${d.firstName} ${d.lastName}`.trim(),user.id])
      const insured=m.member_type!=='student'&&d.insuranceSelected
      await tx(`UPDATE memberships SET directory_opt_in=$1,insurance_selected=$2,insurance_fee_cents=0,updated_at=now() WHERE id=$3`,[m.member_type !== 'student' && d.directoryOptIn,insured,m.id])
      await tx(`UPDATE member_profiles SET first_name=$1,last_name=$2,identity_document=$3,phone=$4,secondary_phone=$5,address=$6,
        postal_code=$7,city=$8,province=$9,public_name=$10,public_email=$11,public_phone=$12,public_address=$13,
        public_postal_code=$14,public_city=$15,public_province=$16,website=$17,bio=$18,facebook_url=$19,
        instagram_url=$20,youtube_url=$21,twitter_url=$22,updated_at=now() WHERE membership_id=$23`,
        [d.firstName,d.lastName,d.identityDocument||null,d.phone||null,d.secondaryPhone||null,d.address||null,d.postalCode||null,
          d.city||null,d.province||null,d.publicName||null,d.publicEmail||null,d.publicPhone||null,d.publicAddress||null,
          d.publicPostalCode||null,d.publicCity||null,d.publicProvince||null,d.website||null,d.bio||null,
          d.facebookUrl||null,d.instagramUrl||null,d.youtubeUrl||null,d.twitterUrl||null,m.id])
      if(m.member_type==='student')await tx('UPDATE student_profiles SET school_origin=$1 WHERE membership_id=$2',[d.schoolOrigin||'Sin especificar',m.id])
      if(m.member_type==='professional')await tx(`UPDATE professional_profiles SET training_school=$1,qualification_summary=$2,
        teaching_level=$3,teaching_schools=$4,teaching_since_year=$5 WHERE membership_id=$6`,[d.trainingSchool||null,
        d.qualificationSummary||null,d.teachingLevel||null,d.teachingSchools||null,d.teachingSinceYear||null,m.id])
      if(m.member_type==='school')await tx(`UPDATE school_profiles SET school_name=$1,description=$2,program_summary=$3,teachers_summary=$4,direction_experience_summary=$5,center_type=$6,languages=$7 WHERE membership_id=$8`,[d.schoolName||'Escuela',d.schoolDescription||null,d.programSummary||null,d.teachersSummary||null,d.directionExperienceSummary||null,d.centerType||null,d.languages||null,m.id])
      await tx(`INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id) VALUES($1,'membership.profile_updated','membership',$2)`,[user.id,m.id])
    })
    return { ok:true }
  } catch(error) {
    if(error instanceof Error&&error.message==='REAUTH_REQUIRED')return{error:'Escribe tu contraseña actual para cambiar el email de acceso'}
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') return { error:'Ese email ya está en uso' }
    console.error('updateProfile',error); return { error:'No se pudieron guardar los cambios' }
  }
}
