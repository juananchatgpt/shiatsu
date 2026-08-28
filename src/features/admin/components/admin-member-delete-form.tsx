'use client'

import {useActionState} from 'react'
import {adminDeleteMember} from '@/actions/admin'

export function AdminMemberDeleteForm({membershipId,returnTo}:{membershipId:string;returnTo:string}){
  const[state,action,pending]=useActionState(adminDeleteMember,null)
  return <section className="rounded-3xl border border-red-200 bg-red-50/60 p-6">
    <h2 className="text-xl font-semibold text-red-950">Borrar socio</h2>
    <p className="mt-3 text-sm leading-6 text-red-900/75">El borrado es definitivo: elimina la cuenta, la ficha, las sesiones, los documentos y las imágenes. Si el socio tiene eventos o una escuela vinculada, primero tendrás que reasignarlos. Para conservar el historial, utiliza el estado Inactivo.</p>
    <form action={action} className="mt-5 space-y-3"><input type="hidden" name="membershipId" value={membershipId}/><input type="hidden" name="returnTo" value={returnTo}/><div><label className="apse-label" htmlFor="delete-confirmation">Escribe BORRAR para confirmar</label><input className="apse-input border-red-200 focus:border-red-500 focus:ring-red-500/20" id="delete-confirmation" name="confirmation" required pattern="BORRAR" autoComplete="off"/></div>
      {state?.error&&<p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      <button className="w-full rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>{pending?'Borrando…':'Borrar definitivamente'}</button>
    </form>
  </section>
}
