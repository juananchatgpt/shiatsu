'use client'

import { useActionState } from 'react'
import { deleteMembershipDocument,uploadMembershipDocument } from '@/actions/documents'
import { documentKindLabels,type MembershipDocument } from '../document-types'
import type { MemberType } from '@/lib/domain'

export function DocumentsPanel({memberType,documents}:{memberType:MemberType;documents:MembershipDocument[]}){
  const[state,action,pending]=useActionState(uploadMembershipDocument,null)
  if(memberType==='student')return null
  const kinds=memberType==='professional'?['professional_qualification','registration_document','other']:['school_program','school_teachers','school_direction','registration_document','other']
  return <section className="apse-card p-6 sm:p-8"><h2 className="text-xl font-semibold text-emerald-950">Documentación privada</h2><p className="mt-2 text-sm text-stone-600">PDF, imagen, ZIP o RAR, máximo 5 MB. Solo tú y los administradores de APSE podéis acceder.</p><form action={action} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div><label className="apse-label" htmlFor="kind">Tipo</label><select className="apse-input" id="kind" name="kind">{kinds.map(kind=><option value={kind} key={kind}>{documentKindLabels[kind]}</option>)}</select></div><div><label className="apse-label" htmlFor="document">Archivo</label><input className="apse-input" id="document" name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.zip,.rar" required/></div><button className="apse-button" disabled={pending}>{pending?'Subiendo…':'Subir'}</button></form>{state?.error&&<p className="mt-3 text-sm text-red-700">{state.error}</p>}{state?.ok&&<p className="mt-3 text-sm text-emerald-700">Documento guardado.</p>}<div className="mt-5 space-y-2">{documents.map(doc=><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3" key={doc.id}><div><a className="font-semibold text-emerald-900" href={`/api/documents/${doc.id}`}>{doc.original_name}</a><p className="text-xs text-stone-500">{documentKindLabels[doc.kind]??doc.kind} · {Math.ceil(doc.size_bytes/1024)} KB · {doc.status==='valid'?'Validado':doc.status==='rejected'?'Rechazado':'Pendiente'}</p></div><form action={deleteMembershipDocument}><input type="hidden" name="documentId" value={doc.id}/><button className="text-sm text-red-700">Eliminar</button></form></div>)}{documents.length===0&&<p className="text-sm text-stone-500">Todavía no hay documentos.</p>}</div></section>
}
