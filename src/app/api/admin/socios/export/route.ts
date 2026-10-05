import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/access'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ExportRow {
  member_number:string|null; member_type:string; status:string; insurance_selected:boolean; base_fee_cents:number; insurance_fee_cents:number
  anniversary_date:string|null; directory_opt_in:boolean; privacy_accepted_at:string|null; rejection_reason:string|null; internal_notes:string|null
  approved_at:string|null; profile_completed_at:string|null; payment_confirmed_at:string|null; created_at:string; updated_at:string
  email:string; first_name:string; last_name:string; identity_document:string|null; phone:string|null; secondary_phone:string|null
  address:string|null; postal_code:string|null; city:string|null; province:string|null; public_name:string|null; public_email:string|null
  public_phone:string|null; public_address:string|null; public_address_opt_in:boolean; public_postal_code:string|null; public_city:string|null; public_province:string|null
  website:string|null; bio:string|null; facebook_url:string|null; instagram_url:string|null; youtube_url:string|null; twitter_url:string|null
  school_origin:string|null; training_school:string|null; qualification_summary:string|null; teaching_level:string|null; teaching_schools:string|null
  teaching_since_year:number|null; home_visit_available:boolean|null; home_visit_notes:string|null; school_name:string|null; school_description:string|null
  program_summary:string|null; teachers_summary:string|null; direction_experience_summary:string|null; center_type:string|null; languages:string|null
  responsible_member_number:string|null
}

const typeLabels:Record<string,string>={student:'Alumno',professional:'Profesional',school:'Escuela'}
const statusLabels:Record<string,string>={pending:'Pendiente de revisión',pre_registered:'Pre-registro',active:'Activo',inactive:'Inactivo',suspended:'Suspendido',rejected:'Rechazado'}
const money=(cents:number)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100)
const cell=(value:unknown)=>{let text=value===null||value===undefined?'':String(value);if(/^[=+\-@]/.test(text))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`}
const row=(values:unknown[])=>values.map(cell).join(';')

export async function GET(request:NextRequest){
  await requireAdmin()
  const params=request.nextUrl.searchParams
  const kind=params.get('kind')??'all'
  const conditions:string[]=[];const values:unknown[]=[]
  const type=params.get('type');if(type&&['student','professional','school'].includes(type)){values.push(type);conditions.push(`m.member_type=$${values.length}`)}
  const status=params.get('status');if(status&&Object.keys(statusLabels).includes(status)){values.push(status);conditions.push(`m.status=$${values.length}`)}
  const scope=params.get('scope');if(!status&&scope==='inactive')conditions.push(`m.status='inactive'`);else if(!status&&scope!=='all')conditions.push(`m.status<>'inactive'`)
  const search=params.get('q')?.trim();if(search){values.push(`%${search}%`);conditions.push(`(p.first_name ILIKE $${values.length} OR p.last_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR m.member_number ILIKE $${values.length})`)}
  const rows=await query<ExportRow>(`SELECT m.member_number,m.member_type,m.status,m.insurance_selected,m.base_fee_cents,m.insurance_fee_cents,m.anniversary_date::text,
    m.directory_opt_in,m.privacy_accepted_at::text,m.rejection_reason,m.internal_notes,m.approved_at::text,m.profile_completed_at::text,m.payment_confirmed_at::text,m.created_at::text,m.updated_at::text,
    u.email,p.first_name,p.last_name,p.identity_document,p.phone,p.secondary_phone,p.address,p.postal_code,p.city,p.province,p.public_name,p.public_email,p.public_phone,p.public_address,p.public_address_opt_in,p.public_postal_code,p.public_city,p.public_province,p.website,p.bio,p.facebook_url,p.instagram_url,p.youtube_url,p.twitter_url,
    st.school_origin,pr.training_school,pr.qualification_summary,pr.teaching_level,pr.teaching_schools,pr.teaching_since_year,pr.home_visit_available,pr.home_visit_notes,
    sc.school_name,sc.description school_description,sc.program_summary,sc.teachers_summary,sc.direction_experience_summary,sc.center_type,sc.languages,r.member_number responsible_member_number
    FROM memberships m JOIN users u ON u.id=m.user_id JOIN member_profiles p ON p.membership_id=m.id LEFT JOIN student_profiles st ON st.membership_id=m.id
    LEFT JOIN professional_profiles pr ON pr.membership_id=m.id LEFT JOIN school_profiles sc ON sc.membership_id=m.id LEFT JOIN memberships r ON r.id=sc.responsible_professional_membership_id
    ${conditions.length?`WHERE ${conditions.join(' AND ')}`:''} ORDER BY p.last_name,p.first_name,m.created_at`,values)
  const headers=kind==='emails'?['Email']:kind==='addresses'?['Número de socio','Tipo','Estado','Nombre','Apellidos','Email','Dirección privada para la revista','Código postal privado','Municipio privado','Provincia privada','Dirección pública de directorio','Código postal público','Municipio público','Provincia pública','Autoriza publicar dirección pública']:['Número de socio','Tipo','Estado','Cuota anual','Seguro','¿Quieres aparecer en el directorio?','Fecha de renovación','Nombre','Apellidos','Email de acceso','DNI/NIE','Teléfono','Segundo teléfono','Dirección privada para la revista','Código postal privado','Municipio privado','Provincia privada','Nombre público','Email público','Teléfono público','Dirección pública de directorio','Código postal público','Municipio público','Provincia pública','Autoriza publicar dirección pública','Web','Biografía o presentación','Facebook','Instagram','YouTube','X/Twitter','Escuela de procedencia','Escuela de formación','Titulación o formación','Nivel de enseñanza','Escuelas donde imparte','Año de inicio en docencia','Asistencia a domicilio','Observaciones de asistencia a domicilio','Nombre de la escuela','Descripción de la escuela','Programa formativo','Equipo docente','Experiencia de la dirección','Tipo de centro','Idiomas','Profesional responsable','Notas internas','Motivo del estado','Alta','Última actualización']
  const data=rows.map(r=>kind==='emails'?[r.email]:kind==='addresses'?[r.member_number,typeLabels[r.member_type]??r.member_type,statusLabels[r.status]??r.status, r.first_name,r.last_name,r.email,r.address,r.postal_code,r.city,r.province,r.public_address,r.public_postal_code,r.public_city,r.public_province,r.public_address_opt_in?'Sí':'No']:[r.member_number,typeLabels[r.member_type]??r.member_type,statusLabels[r.status]??r.status,money(r.base_fee_cents),r.insurance_selected?'Sí':'No',r.directory_opt_in?'Sí':'No',r.anniversary_date,r.first_name,r.last_name,r.email,r.identity_document,r.phone,r.secondary_phone,r.address,r.postal_code,r.city,r.province,r.public_name,r.public_email,r.public_phone,r.public_address,r.public_postal_code,r.public_city,r.public_province,r.public_address_opt_in?'Sí':'No',r.website,r.bio,r.facebook_url,r.instagram_url,r.youtube_url,r.twitter_url,r.school_origin,r.training_school,r.qualification_summary,r.teaching_level,r.teaching_schools,r.teaching_since_year,r.home_visit_available===null?'':r.home_visit_available?'Sí':'No',r.home_visit_notes,r.school_name,r.school_description,r.program_summary,r.teachers_summary,r.direction_experience_summary,r.center_type,r.languages,r.responsible_member_number,r.internal_notes,r.rejection_reason,r.created_at,r.updated_at])
  const csv='\uFEFF'+[row(headers),...data.map(row)].join('\r\n')+'\r\n'
  const suffix=kind==='emails'?'emails':kind==='addresses'?'direcciones':'toda-la-informacion'
  return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="socios-${suffix}.csv"`,'Cache-Control':'no-store'}})
}
