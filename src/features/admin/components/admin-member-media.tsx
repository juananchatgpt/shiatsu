'use client'

import {useActionState} from 'react'
import Image from 'next/image'
import {adminDeleteProfileCover,adminDeleteProfilePhoto,adminUploadProfileCover,adminUploadProfilePhoto} from '@/actions/profile-photo'
import type {MemberType} from '@/lib/domain'

export function AdminMemberMedia({membershipId,memberType,hasPhoto,hasCover}:{membershipId:string;memberType:MemberType;hasPhoto:boolean;hasCover:boolean}){
  const[photoState,photoAction,photoPending]=useActionState(adminUploadProfilePhoto,null)
  const[coverState,coverAction,coverPending]=useActionState(adminUploadProfileCover,null)
  return <section className="apse-card p-6"><h2 className="text-xl font-semibold text-emerald-950">Imágenes</h2><div className="mt-5 grid gap-6 lg:grid-cols-2">
    <div><p className="apse-label">Foto o logotipo</p>{hasPhoto?<Image unoptimized src={`/api/profile-photos/${membershipId}`} alt="Foto actual" width={180} height={180} className="h-40 w-40 rounded-3xl border border-stone-200 object-cover"/>:<div className="grid h-40 w-40 place-items-center rounded-3xl bg-stone-100 text-sm text-stone-500">Sin foto</div>}<form action={photoAction} className="mt-4 space-y-3"><input type="hidden" name="membershipId" value={membershipId}/><input className="apse-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/><button className="apse-button" disabled={photoPending}>Cambiar foto</button></form>{photoState?.error&&<p className="mt-2 text-sm text-red-700">{photoState.error}</p>}{hasPhoto&&<form action={adminDeleteProfilePhoto} className="mt-3"><input type="hidden" name="membershipId" value={membershipId}/><button className="text-sm font-semibold text-red-700">Eliminar foto</button></form>}</div>
    {memberType==='school'&&<div><p className="apse-label">Portada horizontal</p>{hasCover?<Image unoptimized src={`/api/profile-covers/${membershipId}`} alt="Portada actual" width={600} height={240} className="aspect-[5/2] w-full rounded-3xl border border-stone-200 object-cover"/>:<div className="grid aspect-[5/2] w-full place-items-center rounded-3xl bg-stone-100 text-sm text-stone-500">Sin portada</div>}<form action={coverAction} className="mt-4 space-y-3"><input type="hidden" name="membershipId" value={membershipId}/><input className="apse-input" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required/><button className="apse-button" disabled={coverPending}>Cambiar portada</button></form>{coverState?.error&&<p className="mt-2 text-sm text-red-700">{coverState.error}</p>}{hasCover&&<form action={adminDeleteProfileCover} className="mt-3"><input type="hidden" name="membershipId" value={membershipId}/><button className="text-sm font-semibold text-red-700">Eliminar portada</button></form>}</div>}
  </div><p className="mt-5 text-xs text-stone-500">JPG, PNG o WebP. Máximo 5 MB por imagen. Las fotos de alumnos permanecen privadas.</p></section>
}
