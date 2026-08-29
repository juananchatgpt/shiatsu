'use client'

import { useActionState } from 'react'
import { setMembershipPaymentStatus, updateMembershipStatus } from '@/actions/admin'
import { MEMBER_STATUSES, memberStatusLabels, type MemberStatus } from '@/lib/domain'

interface Props {
  membershipId:string
  status:MemberStatus
  rejectionReason:string|null
  approvedAt:string|null
  profileCompletedAt:string|null
  paymentConfirmedAt:string|null
}

export function AdminMembershipWorkflow(props:Props){
  const[statusState,statusAction,statusPending]=useActionState(updateMembershipStatus,null)
  const[paymentState,paymentAction,paymentPending]=useActionState(setMembershipPaymentStatus,null)
  const isPreRegistration=props.status==='pre_registered'
  const paymentConfirmed=Boolean(props.paymentConfirmedAt)
  return <section className="apse-card p-6">
    <h2 className="text-xl font-semibold">Registro y pago</h2>
    <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4 text-sm">
      <Step label="Solicitud revisada" done={Boolean(props.approvedAt)||!['pending','rejected'].includes(props.status)} detail={props.approvedAt?.slice(0,10)}/>
      <Step label="Perfil obligatorio completo" done={Boolean(props.profileCompletedAt)} detail={props.profileCompletedAt?.slice(0,10)}/>
      <Step label="Pago confirmado por Secretaría" done={paymentConfirmed} detail={props.paymentConfirmedAt?.slice(0,10)}/>
    </div>
    <form action={statusAction} className="mt-6 space-y-4"><input type="hidden" name="membershipId" value={props.membershipId}/><div><label className="apse-label">Estado</label><select className="apse-input" name="status" defaultValue={props.status}>{MEMBER_STATUSES.map(status=><option key={status} value={status}>{memberStatusLabels[status]}</option>)}</select></div><div><label className="apse-label">Motivo del estado</label><textarea className="apse-input min-h-24" name="reason" defaultValue={props.rejectionReason??''}/></div><button className="apse-button w-full" disabled={statusPending}>{statusPending?'Guardando…':'Guardar estado'}</button></form>
    {statusState?.error&&<Message error>{statusState.error}</Message>}{statusState?.message&&<Message>{statusState.message}</Message>}
    {(isPreRegistration||props.status==='active')&&<form action={paymentAction} className="mt-5 border-t border-stone-200 pt-5"><input type="hidden" name="membershipId" value={props.membershipId}/><input type="hidden" name="confirmed" value={paymentConfirmed?'false':'true'}/><button className={paymentConfirmed?'apse-button-secondary w-full':'apse-button w-full'} disabled={paymentPending||props.status==='active'}>{paymentPending?'Guardando…':paymentConfirmed?(props.status==='active'?'Pago confirmado':'Retirar confirmación de pago'):'Confirmar pago recibido'}</button>{props.status==='active'&&<p className="mt-2 text-xs text-stone-500">El pago de un socio activo queda como dato histórico.</p>}</form>}
    {paymentState?.error&&<Message error>{paymentState.error}</Message>}{paymentState?.message&&<Message>{paymentState.message}</Message>}
  </section>
}

function Step({label,done,detail}:{label:string;done:boolean;detail?:string}){return <div className="flex items-center justify-between gap-3"><span className={done?'font-semibold text-emerald-900':'text-stone-600'}>{done?'✓':'○'} {label}</span><span className="text-xs text-stone-400">{detail||'Pendiente'}</span></div>}
function Message({children,error=false}:{children:React.ReactNode;error?:boolean}){return <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${error?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800'}`}>{children}</p>}
