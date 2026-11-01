'use client'

import {useActionState} from 'react'
import {deleteAdmin} from '@/actions/admin'

export function AdminDeleteButton({adminId}:{adminId:string}){
  const[state,action,pending]=useActionState(deleteAdmin,null)
  return <div className="mt-2 text-right"><form action={action} onSubmit={event=>{if(!window.confirm('¿Eliminar definitivamente esta cuenta administradora? Esta acción no se puede deshacer.'))event.preventDefault()}}><input type="hidden" name="adminId" value={adminId}/><button className="text-sm font-semibold text-red-700" disabled={pending}>{pending?'Eliminando…':'Eliminar cuenta'}</button></form>{state?.error&&<p className="mt-1 max-w-64 text-xs text-red-700">{state.error}</p>}{state?.ok&&<p className="mt-1 text-xs text-emerald-700">Cuenta eliminada.</p>}</div>
}
