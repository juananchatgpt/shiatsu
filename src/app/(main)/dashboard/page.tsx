import Link from 'next/link'
import { requireUser, getMembershipContext, canCreateEvents } from '@/lib/access'
import { getAdminStats } from '@/features/memberships/service'
import { memberStatusLabels, memberTypeLabels } from '@/lib/domain'
import { StatusBadge } from '@/components/status-badge'

export default async function DashboardPage(){
  const user=await requireUser()
  if(user.role==='admin'){
    const stats=await getAdminStats()
    return <><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Administración</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">Resumen de socios</h1></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Socios" value={stats.total}/><Stat label="Pendientes" value={stats.pending}/><Stat label="Activos" value={stats.active}/><Stat label="En directorio" value={stats.directory}/></div><div className="mt-8 flex flex-wrap gap-3"><Link className="apse-button" href="/admin/socios?status=pending">Revisar altas</Link><Link className="apse-button-secondary" href="/admin/eventos?status=pending_review">Revisar eventos</Link></div></>
  }
  const membership=await getMembershipContext(user.id)
  if(!membership)return <div className="apse-card p-8"><h1 className="text-2xl font-semibold">Cuenta sin membresía</h1><p className="mt-2 text-stone-600">Contacta con APSE para revisar tu cuenta.</p></div>
  return <><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Bienvenido/a</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">{user.full_name}</h1></div><div className="grid gap-5 lg:grid-cols-3"><section className="apse-card p-6"><p className="text-sm text-stone-500">Tipo de socio</p><p className="mt-2 text-xl font-semibold">{memberTypeLabels[membership.member_type]}</p><div className="mt-4"><StatusBadge status={membership.status}/></div>{membership.member_number&&<p className="mt-4 text-sm text-stone-500">N.º {membership.member_number}</p>}</section><section className="apse-card p-6"><p className="text-sm text-stone-500">Directorio</p><p className="mt-2 text-xl font-semibold">{membership.directory_opt_in?'Visible cuando estés activo':'No visible'}</p><Link className="mt-5 inline-block font-semibold text-emerald-900" href="/perfil">Revisar ficha →</Link></section><section className="apse-card p-6"><p className="text-sm text-stone-500">Eventos</p><p className="mt-2 text-xl font-semibold">{canCreateEvents(membership)?'Puedes enviar eventos':'Disponible para profesionales y escuelas activos'}</p><Link className="mt-5 inline-block font-semibold text-emerald-900" href="/mis-eventos">Ver mis eventos →</Link></section></div>{membership.status!=='active'&&<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><strong>Estado: {memberStatusLabels[membership.status]}</strong><p className="mt-1 text-sm text-amber-800">Las funciones públicas se activarán cuando APSE apruebe el alta.</p></div>}</>
}
function Stat({label,value}:{label:string;value:number}){return <div className="apse-card p-6"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-4xl font-semibold text-emerald-950">{value}</p></div>}
