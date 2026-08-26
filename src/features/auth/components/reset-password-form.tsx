'use client'
import{useActionState}from'react'
import Link from'next/link'
import{resetPassword}from'@/actions/password-reset'
export function ResetPasswordForm({token}:{token:string}){const[state,action,pending]=useActionState(resetPassword,null);return <form action={action} className="apse-card w-full max-w-md p-8"><input type="hidden" name="token" value={token}/><h1 className="text-3xl font-semibold text-emerald-950">Nueva contraseña</h1>{!state?.ok&&<><label className="apse-label mt-6">Contraseña</label><input className="apse-input" name="password" type="password" minLength={8} required/><button className="apse-button mt-5 w-full" disabled={pending}>{pending?'Guardando…':'Cambiar contraseña'}</button></>}{state?.ok&&<p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Contraseña actualizada. <Link className="font-semibold" href="/login">Inicia sesión</Link>.</p>}{state?.error&&<p className="mt-4 text-sm text-red-700">{state.error}</p>}</form>}
