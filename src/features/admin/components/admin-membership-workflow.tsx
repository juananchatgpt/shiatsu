'use client'

import { useActionState } from 'react'
import { updateMembershipStatus } from '@/actions/admin'
import { MEMBER_STATUSES, memberStatusLabels, type MemberStatus } from '@/lib/domain'

interface Props { membershipId:string; status:MemberStatus; rejectionReason:string|null; approvedAt:string|null; profileCompletedAt:string|null }

export function AdminMembershipWorkflow(props:Props){
  const[state,action,pending]=useActionState(updateMembershipStatus,null)
  return <section className="apse-card p-6">
    <h2 className="text-xl font-semibold">Estado del alta</h2>
    <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4 text-sm"><Step label="Solicitud revisada" done={Boolean(props.approvedAt)||!['pending','rejected'].includes(props.status)} detail={props.approvedAt?.slice(0,10)}/><Step label="Perfil obligatorio completo" done={Boolean(props.profileCompletedAt)} detail={props.profileCompletedAt?.slice(0,10)}/></div>
    <form action={action} className="mt-6 space-y-4"><input type="hidden" name="membershipId" value={props.membershipId}/><div><label className="apse-label">Estado</label><select className="apse-input" name="status" defaultValue={props.status}>{MEMBER_STATUSES.map(status=><option key={status} value={status}>{memberStatusLabels[status]}</option>)}</select></div><div><label className="apse-label">Motivo del estado</label><textarea className="apse-input min-h-24" name="reason" defaultValue={props.rejectionReason??''}/></div><button className="apse-button w-full" disabled={pending}>{pending?'Guardando…':'Guardar estado'}</button></form>
    {state?.error&&<Message error>{state.error}</Message>}{state?.message&&<Message>{state.message}</Message>}
  </section>
}
function Step({label,done,detail}:{label:string;done:boolean;detail?:string}){return <div className="flex items-center justify-between gap-3"><span className={done?'font-semibold text-emerald-900':'text-stone-600'}>{done?'✓':'○'} {label}</span><span className="text-xs text-stone-400">{detail||'Pendiente'}</span></div>}
function Message({children,error=false}:{children:React.ReactNode;error?:boolean}){return <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${error?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800'}`}>{children}</p>}
