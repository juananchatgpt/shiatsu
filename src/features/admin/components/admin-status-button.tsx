'use client'

import {useActionState} from 'react'
import {setAdminActive} from '@/actions/admin'

export function AdminStatusButton({adminId,active,isCurrent}:{adminId:string;active:boolean;isCurrent:boolean}){
  const[state,action,pending]=useActionState(setAdminActive,null)
  return <div className="text-right"><form action={action}><input type="hidden" name="adminId" value={adminId}/><input type="hidden" name="active" value={active?'false':'true'}/><button className={active?'text-sm font-semibold text-red-700':'text-sm font-semibold text-emerald-800'} disabled={pending||isCurrent}>{pending?'Guardando…':active?'Desactivar':'Activar'}</button></form>{isCurrent&&<p className="mt-1 text-xs text-stone-400">Tu cuenta actual</p>}{state?.error&&<p className="mt-1 max-w-48 text-xs text-red-700">{state.error}</p>}</div>
}
