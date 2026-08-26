'use client'

import { useActionState } from 'react'
import { changePassword } from '@/actions/auth'

export function ChangePasswordForm(){
  const[state,action,pending]=useActionState(changePassword,null)
  return <form action={action} className="apse-card max-w-xl space-y-5 p-6 sm:p-8">
    <Field name="currentPassword" label="Contraseña actual"/>
    <Field name="newPassword" label="Nueva contraseña (mínimo 8 caracteres)"/>
    <Field name="passwordConfirmation" label="Repite la nueva contraseña"/>
    {state?.error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}
    <button className="apse-button" disabled={pending}>{pending?'Guardando…':'Cambiar contraseña'}</button>
    <p className="text-sm text-stone-500">Al cambiarla se cerrarán todas las sesiones, incluida esta.</p>
  </form>
}
function Field({name,label}:{name:string;label:string}){return <div><label className="apse-label" htmlFor={name}>{label}</label><input className="apse-input" id={name} name={name} type="password" minLength={8} required autoComplete={name==='currentPassword'?'current-password':'new-password'}/></div>}
