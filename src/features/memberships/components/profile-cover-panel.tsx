'use client'

import {useActionState} from 'react'
import Image from 'next/image'
import {deleteProfileCover,uploadProfileCover} from '@/actions/profile-photo'

export function ProfileCoverPanel({membershipId,hasCover}:{membershipId:string;hasCover:boolean}){
  const[state,action,pending]=useActionState(uploadProfileCover,null)
  return <section className="apse-card p-6 sm:p-8"><h2 className="text-xl font-semibold text-emerald-950">Portada de la escuela</h2><p className="mt-2 text-sm text-stone-600">Imagen horizontal para la cabecera de la ficha pública. JPG, PNG o WebP, máximo 5 MB.</p>
    <div className="mt-5">{hasCover?<Image unoptimized src={`/api/profile-covers/${membershipId}`} alt="Portada actual" width={960} height={320} className="aspect-[3/1] w-full rounded-2xl border border-stone-200 object-cover"/>:<div className="grid aspect-[3/1] w-full place-items-center rounded-2xl bg-stone-100 text-sm text-stone-500">Sin portada</div>}</div>
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3"><div className="min-w-64 flex-1"><label className="apse-label" htmlFor="cover">Nueva portada</label><input className="apse-input" id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/></div><button className="apse-button" disabled={pending}>{pending?'Guardando…':'Guardar portada'}</button></form>
    {state?.error&&<p className="mt-3 text-sm text-red-700">{state.error}</p>}{state?.ok&&<p className="mt-3 text-sm text-emerald-700">Portada actualizada.</p>}{hasCover&&<form action={deleteProfileCover} className="mt-4"><button className="text-sm font-semibold text-red-700">Eliminar portada</button></form>}
  </section>
}
