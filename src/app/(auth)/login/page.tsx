'use client'

import { useActionState } from 'react'
import { login } from '@/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--apse-cream)] p-4">
      <form action={formAction} className="apse-card w-full max-w-md space-y-6 p-8">
        <div><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Área privada APSE</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">Inicia sesión</h1></div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="apse-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="apse-input"
          />
        </div>

        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="apse-button w-full"
        >
          {pending ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="flex justify-between text-sm"><a className="text-emerald-900" href="/registro">Solicitar alta</a><a className="text-stone-500" href="/recuperar-contrasena">Olvidé mi contraseña</a></div>
      </form>
    </div>
  )
}
