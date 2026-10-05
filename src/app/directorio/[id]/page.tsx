import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {SiteHeader} from '@/components/site-header'
import {getPublicDirectoryMember} from '@/features/memberships/service'

export const dynamic='force-dynamic'

function externalUrl(value:string|null,network?:'facebook'|'instagram'|'youtube'){
  if(!value)return null
  if(/^https?:\/\//i.test(value))return value
  const clean=value.replace(/^@/,'').replace(/^\/+|\/+$/g,'')
  if(network==='facebook')return `https://facebook.com/${clean}`
  if(network==='instagram')return `https://instagram.com/${clean}`
  if(network==='youtube')return `https://youtube.com/${clean}`
  return `https://${clean}`
}

export default async function DirectoryDetailPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound();const member=await getPublicDirectoryMember(id);if(!member)notFound()
  const description=member.member_type==='school'?(member.school_description||member.bio):member.bio
  const address=[member.public_address,member.public_postal_code,member.public_city,member.public_province].filter(Boolean).join(', ')
  const mapUrl=address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`:null
  const socials=[
    ['Facebook',externalUrl(member.facebook_url,'facebook')],['Instagram',externalUrl(member.instagram_url,'instagram')],
    ['YouTube',externalUrl(member.youtube_url,'youtube')],['X / Twitter',externalUrl(member.twitter_url)],
  ].filter((item):item is [string,string]=>Boolean(item[1]))
  return <><SiteHeader/><main className="pb-16">
    <section className="relative overflow-hidden border-b border-stone-200 bg-emerald-950 text-white">
      <div className="absolute inset-0 opacity-30"><div className="h-full bg-[radial-gradient(circle_at_20%_20%,rgba(199,167,99,.7),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(184,102,79,.55),transparent_28%)]"/></div>
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/75 to-emerald-950/25"/>
      <div className="apse-container relative py-10 sm:py-16"><Link href="/directorio" className="text-sm font-semibold text-white/80 hover:text-white">← Volver al directorio</Link><div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end">
        {member.has_photo?<Image unoptimized src={`/api/profile-photos/${member.id}?v=${member.photo_version??'1'}`} alt={`Imagen de ${member.name}`} width={144} height={144} className="h-32 w-32 rounded-lg border-4 border-white/90 bg-white object-cover shadow-xl sm:h-36 sm:w-36"/>:<div className="grid h-32 w-32 place-items-center rounded-lg border-4 border-white/80 bg-emerald-50 text-5xl font-semibold text-emerald-950 shadow-xl sm:h-36 sm:w-36">{member.name.slice(0,1).toUpperCase()}</div>}
        <div className="pb-1"><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[1px]">{member.member_type==='school'?(member.center_type||'Escuela'):'Profesional APSE'}</span><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">{member.name}</h1>{(member.public_city||member.public_province)&&<p className="mt-3 text-lg text-white/75">{[member.public_city,member.public_province].filter(Boolean).join(' · ')}</p>}</div>
      </div></div>
    </section>
    <div className="apse-container mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-7">
        {description&&<Section title={member.member_type==='school'?'Sobre el centro':'Sobre mí'}><p className="whitespace-pre-line text-base leading-8 text-stone-700">{description}</p></Section>}
        {member.member_type==='professional'&&(member.training_school||member.qualification_summary)&&<Section title="Formación en Shiatsu"><Details items={[["Escuela de formación",member.training_school],["Titulación y formación",member.qualification_summary]]}/></Section>}
        {member.member_type==='professional'&&(member.teaching_level||member.teaching_schools||member.teaching_since_year)&&<Section title="Docencia"><Details items={[["Nivel de enseñanza",member.teaching_level],["Escuelas donde imparte",member.teaching_schools],["Inicio de docencia",member.teaching_since_year?.toString()??null]]}/></Section>}
        {member.member_type==='professional'&&member.home_visit_available&&<Section title="Atención a domicilio"><Details items={[["Se desplaza al domicilio del paciente",'Sí'],["Observaciones",member.home_visit_notes]]}/></Section>}
        {member.member_type==='school'&&(member.program_summary||member.teachers_summary||member.direction_experience_summary)&&<Section title="Formación del centro"><Details items={[["Programa formativo",member.program_summary],["Equipo docente",member.teachers_summary],["Experiencia de la dirección",member.direction_experience_summary]]}/></Section>}
      </div>
      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(31,52,44,.08)]"><h2 className="text-lg font-semibold text-emerald-950">Contacto</h2><div className="mt-5 space-y-3">
          {member.website&&<ContactLink href={externalUrl(member.website)!} label="Página web" external/>}{member.public_email&&<ContactLink href={`mailto:${member.public_email}`} label={member.public_email}/>} {member.public_phone&&<ContactLink href={`tel:${member.public_phone.replace(/[^+\d]/g,'')}`} label={member.public_phone}/>} {!member.website&&!member.public_email&&!member.public_phone&&<p className="text-sm text-stone-500">Este perfil no ha publicado datos de contacto.</p>}
        </div></section>
        {(address||member.languages)&&<section className="apse-card p-6">{address&&<div><p className="text-xs font-bold uppercase tracking-[1px] text-stone-400">Dirección</p><p className="mt-2 leading-6 text-stone-700">{address}</p>{mapUrl&&<a className="mt-3 inline-flex text-sm font-semibold text-emerald-900" href={mapUrl} target="_blank" rel="noreferrer">Abrir en el mapa ↗</a>}</div>}{member.languages&&<div className={address?'mt-6 border-t border-stone-100 pt-5':''}><p className="text-xs font-bold uppercase tracking-[1px] text-stone-400">Idiomas</p><p className="mt-2 text-stone-700">{member.languages}</p></div>}</section>}
        {socials.length>0&&<section className="apse-card p-6"><p className="text-xs font-bold uppercase tracking-[1px] text-stone-400">También en</p><div className="mt-3 flex flex-wrap gap-2">{socials.map(([label,href])=><a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-[3px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100">{label}</a>)}</div></section>}
      </aside>
    </div>
  </main></>
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-semibold text-emerald-950">{title}</h2><div className="mt-5">{children}</div></section>}
function Details({items}:{items:[string,string|null][]}){return <dl className="space-y-5">{items.filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="text-xs font-bold uppercase tracking-[1px] text-stone-400">{label}</dt><dd className="mt-2 whitespace-pre-line leading-7 text-stone-700">{value}</dd></div>)}</dl>}
function ContactLink({href,label,external=false}:{href:string;label:string;external?:boolean}){return <a href={href} target={external?'_blank':undefined} rel={external?'noreferrer':undefined} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"><span className="truncate">{label}</span><span aria-hidden="true">↗</span></a>}
