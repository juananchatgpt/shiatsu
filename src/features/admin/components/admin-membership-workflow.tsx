'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateMembershipStatus } from '@/actions/admin'
import { MEMBER_STATUSES, memberStatusLabels, type MemberStatus } from '@/lib/domain'

interface Props { membershipId:string; status:MemberStatus; approvedAt:string|null; profileCompletedAt:string|null; paymentConfirmedAt:string|null }

export function AdminMembershipWorkflow(props:Props){
  const[state,action,pending]=useActionState(updateMembershipStatus,null)
  const router=useRouter()
  useEffect(()=>{if(state?.ok)router.refresh()},[router,state?.ok])
  return <section className="apse-card p-6">
    <h2 className="text-xl font-semibold">Estado del alta</h2>
    <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4 text-sm"><Step label="Perfil obligatorio completo" done={Boolean(props.profileCompletedAt)} detail={props.profileCompletedAt?.slice(0,10)}/><Step label="Pago confirmado" done={Boolean(props.paymentConfirmedAt)} detail={props.paymentConfirmedAt?.slice(0,10)}/></div>
    <form action={action} className="mt-6 space-y-4"><input type="hidden" name="membershipId" value={props.membershipId}/><div><label className="apse-label">Estado</label><select key={props.status} className="apse-input" name="status" defaultValue={props.status}>{MEMBER_STATUSES.map(status=><option key={status} value={status}>{memberStatusLabels[status]}</option>)}</select></div><label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3"><input className="mt-1" type="checkbox" name="paymentConfirmed" value="yes" defaultChecked={Boolean(props.paymentConfirmedAt)}/><span><strong className="block text-sm text-emerald-950">Pago confirmado manualmente</strong><span className="text-xs text-stone-500">No activa ningún cobro automático. Para activar el alta también debe estar completo el perfil y validada la documentación.</span></span></label><button className="apse-button w-full" disabled={pending}>{pending?'Guardando…':'Guardar estado'}</button></form>
    {state?.error&&<Message error>{state.error}</Message>}{state?.message&&<Message>{state.message}</Message>}
  </section>
}
function Step({label,done,detail}:{label:string;done:boolean;detail?:string}){return <div className="flex items-center justify-between gap-3"><span className={done?'font-semibold text-emerald-900':'text-stone-600'}>{done?'✓':'○'} {label}</span><span className="text-xs text-stone-400">{detail||'Pendiente'}</span></div>}
function Message({children,error=false}:{children:React.ReactNode;error?:boolean}){return <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${error?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800'}`}>{children}</p>}
