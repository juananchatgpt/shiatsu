'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/actions/memberships'
import { SPANISH_PROVINCES } from '@/lib/domain'
import type { MembershipDetail } from '../service'

export function ProfileForm({member}:{member:MembershipDetail}){
  const[state,action,pending]=useActionState(updateProfile,null)
  const[optedIn,setOptedIn]=useState(member.directory_opt_in)
  const publicAllowed=member.member_type!=='student'
  const completingRegistration=member.status==='pending'||member.status==='pre_registered'
  return <form action={action} className="space-y-6">
    <Section title="Datos privados"><p className="mb-5 text-sm text-stone-500">Los campos marcados con * son necesarios para completar el alta.</p><div className="grid gap-5 md:grid-cols-2">
      <Field n="firstName" l="Nombre" v={member.first_name} required/><Field n="lastName" l="Apellidos" v={member.last_name} required/>
      <Field n="email" l="Email de acceso" v={member.email} type="email" required/><Field n="currentPassword" l="Contraseña actual (solo si cambias el email)" v="" type="password"/>
      <Field n="identityDocument" l="DNI / NIE" v={member.identity_document} required={completingRegistration}/><Field n="phone" l="Teléfono" v={member.phone} required={completingRegistration}/>
      <Field n="secondaryPhone" l="Segundo teléfono" v={member.secondary_phone}/><Field n="address" l="Dirección" v={member.address} required={completingRegistration}/>
      <Field n="postalCode" l="Código postal" v={member.postal_code} required={completingRegistration}/><Field n="city" l="Municipio" v={member.city} required={completingRegistration}/>
      <Province n="province" v={member.province} required={completingRegistration}/>
    </div></Section>
    <TypeFields member={member} required={completingRegistration}/>
    {publicAllowed&&<>
      <Section title="Cuota y visibilidad">
        <label className="flex gap-3 rounded-xl border border-stone-200 p-4"><input type="checkbox" name="insuranceSelected" defaultChecked={member.insurance_selected}/><span><strong className="block">Quiero seguro</strong><span className="text-sm text-stone-500">APSE gestionará tu solicitud de seguro.</span></span></label>
        <label className="mt-3 flex gap-3 rounded-xl border border-stone-200 p-4"><input type="checkbox" name="directoryOptIn" checked={optedIn} onChange={event=>setOptedIn(event.target.checked)}/><span><strong className="block">Aparecer en el directorio público</strong><span className="text-sm text-stone-500">Al desmarcarlo desaparece toda tu ficha pública. La opción inicial es no aparecer.</span></span></label>
      </Section>
      <Section title="Ficha pública"><p className="mb-5 text-sm text-stone-500">Si eliges aparecer en el directorio, completa los campos públicos marcados con *.</p><div className="grid gap-5 md:grid-cols-2">
        <Field n="publicName" l="Nombre público" v={member.public_name} required={completingRegistration&&optedIn}/><Field n="publicEmail" l="Email público" v={member.public_email} type="email" required={completingRegistration&&optedIn}/>
        <Field n="publicPhone" l="Teléfono público" v={member.public_phone} required={completingRegistration&&optedIn}/><Field n="publicAddress" l="Dirección pública" v={member.public_address}/>
        <Field n="publicPostalCode" l="Código postal público" v={member.public_postal_code}/><Field n="publicCity" l="Municipio público" v={member.public_city} required={completingRegistration&&optedIn}/>
        <Province n="publicProvince" v={member.public_province} required={completingRegistration&&optedIn}/><Field n="website" l="Web" v={member.website} type="url"/>
        <Field n="facebookUrl" l="Facebook (URL o usuario)" v={member.facebook_url}/><Field n="instagramUrl" l="Instagram (URL o usuario)" v={member.instagram_url}/>
        <Field n="youtubeUrl" l="YouTube (URL o canal)" v={member.youtube_url}/><Field n="twitterUrl" l="X / Twitter (URL o usuario)" v={member.twitter_url}/>
      </div><Area n="bio" l="Presentación" v={member.bio} required={completingRegistration&&optedIn}/></Section>
    </>}
    {state?.error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}
    {state?.message&&<p role="status" className={`rounded-xl p-4 ${state.profileComplete?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{state.message}</p>}
    <button className="apse-button" disabled={pending}>{pending?'Guardando…':'Guardar cambios'}</button>
  </form>
}

function TypeFields({member,required}:{member:MembershipDetail;required:boolean}){
  if(member.member_type==='student')return <Section title="Formación"><Field n="schoolOrigin" l="Escuela de procedencia" v={member.school_origin} required={required}/></Section>
  if(member.member_type==='professional')return <Section title="Formación profesional"><Field n="trainingSchool" l="Escuela de formación" v={member.training_school} required={required}/><Area n="qualificationSummary" l="Titulación o formación en Shiatsu" v={member.qualification_summary} required={required}/><div className="grid gap-5 md:grid-cols-2"><Field n="teachingLevel" l="Nivel de enseñanza" v={member.teaching_level}/><Field n="teachingSinceYear" l="Año de inicio en docencia" v={member.teaching_since_year?.toString()??''} type="number"/></div><Area n="teachingSchools" l="Escuelas donde imparte formación" v={member.teaching_schools}/></Section>
  return <Section title="Datos de la escuela"><div className="grid gap-5 md:grid-cols-2"><Field n="schoolName" l="Nombre de la escuela" v={member.school_name} required={required}/><Field n="centerType" l="Tipo de centro" v={member.center_type}/><Field n="languages" l="Idiomas" v={member.languages}/></div><Area n="schoolDescription" l="Descripción" v={member.school_description}/><Area n="programSummary" l="Programa formativo" v={member.program_summary} required={required}/><Area n="teachersSummary" l="Equipo docente" v={member.teachers_summary} required={required}/><Area n="directionExperienceSummary" l="Experiencia de la dirección" v={member.direction_experience_summary} required={required}/></Section>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="apse-card p-6 sm:p-8"><h2 className="mb-5 text-xl font-semibold text-emerald-950">{title}</h2>{children}</section>}
function Field({n,l,v,type='text',required=false}:{n:string;l:string;v:string|null;type?:string;required?:boolean}){return <div><label className="apse-label" htmlFor={n}>{l}{required?' *':''}</label><input className="apse-input" id={n} name={n} type={type} defaultValue={v??''} required={required}/></div>}
function Area({n,l,v,required=false}:{n:string;l:string;v:string|null;required?:boolean}){return <div className="mt-5"><label className="apse-label" htmlFor={n}>{l}{required?' *':''}</label><textarea className="apse-input min-h-28" id={n} name={n} defaultValue={v??''} required={required}/></div>}
function Province({n,v,required=false}:{n:string;v:string|null;required?:boolean}){return <div><label className="apse-label" htmlFor={n}>Provincia{required?' *':''}</label><select className="apse-input" id={n} name={n} defaultValue={v??''} required={required}><option value="">Seleccionar</option>{SPANISH_PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>}
