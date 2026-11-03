'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateMembershipStatus } from '@/actions/admin'
import { MEMBER_STATUSES, memberStatusLabels, type MemberStatus } from '@/lib/domain'

interface Props { membershipId:string; status:MemberStatus }

export function AdminMembershipWorkflow(props:Props){
  const[state,action,pending]=useActionState(updateMembershipStatus,null)
  const router=useRouter()
  useEffect(()=>{if(state?.ok)router.refresh()},[router,state?.ok])
  return <section className="apse-card p-6">
    <h2 className="text-xl font-semibold">Estado del alta</h2>
    <form action={action} className="mt-6 space-y-4"><input type="hidden" name="membershipId" value={props.membershipId}/><div><label className="apse-label">Estado</label><select key={props.status} className="apse-input" name="status" defaultValue={props.status}>{MEMBER_STATUSES.map(status=><option key={status} value={status}>{memberStatusLabels[status]}</option>)}</select></div><button className="apse-button w-full" disabled={pending}>{pending?'Guardando…':'Guardar estado'}</button></form>
    {state?.error&&<Message error>{state.error}</Message>}{state?.message&&<Message>{state.message}</Message>}
  </section>
}
function Message({children,error=false}:{children:React.ReactNode;error?:boolean}){return <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${error?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-800'}`}>{children}</p>}
