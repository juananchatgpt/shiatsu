'use client'

import { useActionState } from 'react'
import { deleteProfilePhoto,uploadProfilePhoto } from '@/actions/profile-photo'
import type { MemberType } from '@/lib/domain'
import Image from 'next/image'

export function ProfilePhotoPanel({membershipId,memberType,hasPhoto}:{membershipId:string;memberType:MemberType;hasPhoto:boolean}){
  const[state,action,pending]=useActionState(uploadProfilePhoto,null);const canUpload=memberType!=='student'
  return <section className="apse-card p-6 sm:p-8"><h2 className="text-xl font-semibold text-emerald-950">Imagen de perfil</h2><div className="mt-5 flex flex-wrap items-start gap-5">{hasPhoto?<Image unoptimized src={`/api/profile-photos/${membershipId}`} alt="Imagen actual del perfil" width={112} height={112} className="h-28 w-28 rounded-2xl border border-stone-200 object-cover"/>:<div className="grid h-28 w-28 place-items-center rounded-2xl bg-stone-100 text-sm text-stone-500">Sin imagen</div>}<div className="min-w-64 flex-1">{canUpload?<><p className="text-sm text-stone-600">JPG, PNG o WebP, máximo 5 MB. Se mostrará públicamente solo si tu cuenta está activa y has elegido aparecer en el directorio.</p><form action={action} className="mt-4 flex flex-wrap items-end gap-3"><div><label className="apse-label" htmlFor="photo">Nueva imagen</label><input className="apse-input" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></div><button className="apse-button" disabled={pending}>{pending?'Guardando…':'Guardar imagen'}</button></form></>:<p className="text-sm text-stone-600">Esta imagen se conserva como dato privado y nunca aparece en el directorio de alumnos.</p>}{state?.error&&<p className="mt-3 text-sm text-red-700">{state.error}</p>}{state?.ok&&<p className="mt-3 text-sm text-emerald-700">Imagen actualizada.</p>}{hasPhoto&&<form action={deleteProfilePhoto} className="mt-4"><button className="text-sm font-semibold text-red-700">Eliminar imagen</button></form>}</div></div></section>
}
