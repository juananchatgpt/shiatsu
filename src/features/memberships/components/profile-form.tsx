'use client'

import { useActionState, useState } from 'react'
import { updateProfile } from '@/actions/memberships'
import { SPANISH_PROVINCES } from '@/lib/domain'
import type { MembershipDetail } from '../service'

export function ProfileForm({member}:{member:MembershipDetail}){
  const[state,action,pending]=useActionState(updateProfile,null)
  const[optedIn,setOptedIn]=useStateValue(member.directory_opt_in)
  const[publicAddressAllowed,setPublicAddressAllowed]=useStateValue(member.public_address_opt_in)
  const publicAllowed=member.member_type!=='student'
  const completingRegistration=member.status==='pending'||member.status==='pre_registered'
  return <form action={action} className="space-y-6">
    <Section title="Datos privados"><p className="mb-5 text-sm text-stone-500">Los campos marcados con * son necesarios para completar el alta.</p><div className="grid gap-5 md:grid-cols-2">
      <Field n="firstName" l="Nombre" v={member.first_name} required/><Field n="lastName" l="Apellidos" v={member.last_name} required/>
      <Field n="email" l="Email de acceso" v={member.email} type="email" required/><Field n="emailConfirmation" l="Repite el email de acceso" v={member.email} type="email" required/>
      <Field n="currentPassword" l="Contraseña actual (necesaria para cambiar el email)" v="" type="password"/>
      <Field n="identityDocument" l="DNI / NIE" v={member.identity_document} required={completingRegistration}/><Field n="phone" l="Teléfono" v={member.phone} required={completingRegistration}/>
      <Field n="secondaryPhone" l="Segundo teléfono" v={member.secondary_phone}/><Field n="address" l="Dirección postal privada para recibir la revista anual" v={member.address} required={completingRegistration}/>
      <Field n="postalCode" l="Código postal privado" v={member.postal_code} required={completingRegistration}/><Field n="city" l="Municipio privado" v={member.city} required={completingRegistration}/>
      <Province n="province" l="Provincia privada" v={member.province} required={completingRegistration}/>
    </div></Section>
    <TypeFields member={member} required={completingRegistration}/>
    {member.member_type==='student'&&<Section title="Biografía o presentación"><Area n="bio" l="Biografía o presentación" v={member.bio} required={completingRegistration}/></Section>}
    {publicAllowed&&<>
      <Section title="Estado y visibilidad">{member.member_type==='professional'&&<YesNo name="insuranceSelected" label="¿Quieres recibir información sobre el seguro?" value={member.insurance_selected}/>}<div className={member.member_type==='professional'?'mt-4':''}><YesNo name="directoryOptIn" label="¿Quieres aparecer en el directorio?" value={optedIn} onChange={setOptedIn}/></div></Section>
      <Section title="Datos públicos para el directorio"><p className="mb-5 text-sm text-stone-500">Si eliges aparecer en el directorio, completa los datos públicos. La dirección pública es independiente de la privada y solo se mostrará si autorizas expresamente su publicación.</p><div className="grid gap-5 md:grid-cols-2">
        <Field n="publicName" l="Nombre público" v={member.public_name} required={completingRegistration&&optedIn}/><Field n="publicEmail" l="Email público" v={member.public_email} type="email" required={completingRegistration&&optedIn}/>
        <Field n="publicPhone" l="Teléfono público" v={member.public_phone} required={completingRegistration&&optedIn}/><Field n="publicAddress" l="Dirección pública para el directorio" v={member.public_address} required={completingRegistration&&optedIn&&publicAddressAllowed}/>
        <Field n="publicPostalCode" l="Código postal público" v={member.public_postal_code} required={completingRegistration&&optedIn&&publicAddressAllowed}/><Field n="publicCity" l="Municipio público" v={member.public_city} required={completingRegistration&&optedIn&&publicAddressAllowed}/>
        <Province n="publicProvince" l="Provincia pública" v={member.public_province} required={completingRegistration&&optedIn&&publicAddressAllowed}/><Field n="website" l="Web" v={member.website} type="url"/>
        <Field n="facebookUrl" l="Facebook (URL o usuario)" v={member.facebook_url}/><Field n="instagramUrl" l="Instagram (URL o usuario)" v={member.instagram_url}/><Field n="youtubeUrl" l="YouTube (URL o canal)" v={member.youtube_url}/><Field n="twitterUrl" l="X / Twitter (URL o usuario)" v={member.twitter_url}/>
      </div><label className="mt-5 flex items-start gap-3"><input type="checkbox" name="publicAddressOptIn" value="yes" checked={publicAddressAllowed} onChange={event=>setPublicAddressAllowed(event.target.checked)} className="mt-1"/><span className="text-sm text-stone-600">Autorizo la publicación de esta dirección pública en mi ficha del directorio. La dirección privada solo se usará para recibir la revista anual.</span></label><Area n="bio" l="Biografía o presentación" v={member.bio} required={completingRegistration}/></Section>
    </>}
    {state?.error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}
    {state?.message&&<p role="status" className={`rounded-xl p-4 ${state.profileComplete?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{state.message}</p>}
    <button className="apse-button" disabled={pending}>{pending?'Guardando…':'Guardar cambios'}</button>
  </form>
}

function TypeFields({member,required}:{member:MembershipDetail;required:boolean}){
  if(member.member_type==='student')return <Section title="Formación"><Field n="schoolOrigin" l="Escuela de procedencia" v={member.school_origin} required={required}/></Section>
  if(member.member_type==='professional')return <><Section title="Formación profesional"><Field n="trainingSchool" l="Escuela de formación" v={member.training_school} required={required}/><Area n="qualificationSummary" l="Titulación o formación en Shiatsu" v={member.qualification_summary} required={required}/><div className="grid gap-5 md:grid-cols-2"><Field n="teachingLevel" l="Nivel de enseñanza" v={member.teaching_level}/><Field n="teachingSinceYear" l="Año de inicio en docencia" v={member.teaching_since_year?.toString()??''} type="number"/></div><Area n="teachingSchools" l="Escuelas donde imparte formación" v={member.teaching_schools}/></Section><Section title="Atención a domicilio"><YesNo name="homeVisitAvailable" label="¿Te desplazas a domicilios para atender a pacientes?" value={member.home_visit_available}/><Area n="homeVisitNotes" l="Observaciones" v={member.home_visit_notes}/></Section></>
  return <Section title="Datos de la escuela"><div className="grid gap-5 md:grid-cols-2"><Field n="schoolName" l="Nombre de la escuela" v={member.school_name} required={required}/><Field n="centerType" l="Tipo de centro" v={member.center_type}/><Field n="languages" l="Idiomas" v={member.languages}/></div><Area n="schoolDescription" l="Descripción" v={member.school_description}/><Area n="programSummary" l="Programa formativo" v={member.program_summary} required={required}/><Area n="teachersSummary" l="Equipo docente" v={member.teachers_summary} required={required}/><Area n="directionExperienceSummary" l="Experiencia de la dirección" v={member.direction_experience_summary} required={required}/></Section>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="apse-card p-6 sm:p-8"><h2 className="mb-5 text-xl font-semibold text-emerald-950">{title}</h2>{children}</section>}
function Field({n,l,v,type='text',required=false}:{n:string;l:string;v:string|null;type?:string;required?:boolean}){return <div><label className="apse-label" htmlFor={n}>{l}{required?' *':''}</label><input className="apse-input" id={n} name={n} type={type} defaultValue={v??''} required={required} autoComplete={type==='password'?'current-password':undefined}/></div>}
function Area({n,l,v,required=false}:{n:string;l:string;v:string|null;required?:boolean}){return <div className="mt-5"><label className="apse-label" htmlFor={n}>{l}{required?' *':''}</label><textarea className="apse-input min-h-28" id={n} name={n} defaultValue={v??''} required={required}/></div>}
function Province({n,l,v,required=false}:{n:string;l:string;v:string|null;required?:boolean}){return <div><label className="apse-label" htmlFor={n}>{l}{required?' *':''}</label><select className="apse-input" id={n} name={n} defaultValue={v??''} required={required}><option value="">Seleccionar</option>{SPANISH_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}</select></div>}
function YesNo({name,label,value,onChange}:{name:string;label:string;value:boolean;onChange?:(value:boolean)=>void}){return <fieldset><legend className="apse-label">{label}</legend><div className="mt-2 flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="radio" name={name} value="yes" defaultChecked={value} onChange={()=>onChange?.(true)} required/>Sí</label><label className="flex items-center gap-2"><input type="radio" name={name} value="no" defaultChecked={!value} onChange={()=>onChange?.(false)}/>No</label></div></fieldset>}
function useStateValue(initial:boolean){
  const [value,setValue]=useState(initial)
  return [value,setValue] as const
}
