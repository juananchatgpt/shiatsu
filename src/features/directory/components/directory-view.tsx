import type { PublicDirectoryRow } from '@/features/memberships/service'
import Image from 'next/image'
import Link from 'next/link'

export function DirectoryView({rows,compact=false}:{rows:PublicDirectoryRow[];compact?:boolean}){
  return <div className={`grid gap-5 ${compact?'sm:grid-cols-2':'md:grid-cols-2 xl:grid-cols-3'}`}>
    {rows.map(item=><article key={item.id} className="group overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_14px_45px_rgba(31,52,44,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#538a54]/40 hover:shadow-[0_22px_55px_rgba(31,52,44,.12)]">
      <Link href={`/directorio/${item.id}`} target={compact?'_blank':undefined} rel={compact?'noreferrer':undefined} className="block h-full p-6">
        <div className="flex items-center gap-5">
          {item.has_photo?<Image unoptimized src={`/api/profile-photos/${item.id}?v=${item.photo_version??'1'}`} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg border border-stone-200 bg-stone-50 object-cover"/>:<div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-100 to-stone-100 text-2xl font-semibold text-emerald-950">{item.name.slice(0,1).toUpperCase()}</div>}
          <div className="min-w-0 flex-1"><span className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--apse-clay)]">{item.member_type==='school'?(item.center_type||'Escuela'):'Profesional'}</span><h2 className="mt-1 text-xl font-semibold leading-tight text-emerald-950">{item.name}</h2>{(item.public_city||item.public_province)&&<p className="mt-2 text-sm text-stone-500">{[item.public_city,item.public_province].filter(Boolean).join(' · ')}</p>}</div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-semibold text-emerald-900"><span>Ver ficha completa</span><span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></div>
      </Link>
    </article>)}
    {!rows.length&&<div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-12 text-center text-stone-500 md:col-span-2 xl:col-span-3">No hay resultados con estos filtros.</div>}
  </div>
}
