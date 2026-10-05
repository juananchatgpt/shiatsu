import Link from 'next/link'
import {notFound} from 'next/navigation'
import {requireAdmin} from '@/lib/access'
import {getAdminMembershipForEdit} from '@/features/memberships/service'
import {formatMoney,memberTypeLabels} from '@/lib/domain'
import {StatusBadge} from '@/components/status-badge'
import {listMembershipDocuments} from '@/features/memberships/documents'
import {documentKindLabels} from '@/features/memberships/document-types'
import {reviewMembershipDocument} from '@/actions/documents'
import {AdminMemberEditForm} from '@/features/admin/components/admin-member-edit-form'
import {AdminMemberMedia} from '@/features/admin/components/admin-member-media'
import {AdminMemberDeleteForm} from '@/features/admin/components/admin-member-delete-form'
import {AdminMembershipWorkflow} from '@/features/admin/components/admin-membership-workflow'

export default async function MemberDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{returnTo?:string}>}){
  await requireAdmin();const[{id},search]=await Promise.all([params,searchParams]);const member=await getAdminMembershipForEdit(id);if(!member)notFound();const documents=await listMembershipDocuments(member.id)
  const backHref=search.returnTo&&(search.returnTo==='/admin/socios'||search.returnTo.startsWith('/admin/socios?'))?search.returnTo:'/admin/socios'
  return <div className="mx-auto max-w-6xl"><div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><Link href={backHref} className="text-sm font-semibold text-stone-500">← Volver a socios</Link><p className="mt-5 text-sm text-stone-500">{memberTypeLabels[member.member_type]} · {member.member_number||'Sin número'}</p><h1 className="mt-1 text-3xl font-semibold text-emerald-950">{member.first_name} {member.last_name}</h1><p className="mt-1 text-stone-600">{member.email}</p></div><div className="flex items-center gap-3"><StatusBadge status={member.status}/>{member.status==='active'&&member.directory_opt_in&&member.member_type!=='student'&&<Link className="apse-button-secondary" href={`/directorio/${member.id}`} target="_blank">Ver ficha pública ↗</Link>}</div></div>
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-6"><AdminMemberMedia membershipId={member.id} hasPhoto={member.has_photo}/><AdminMemberEditForm member={member}/><Documents documents={documents}/></div><aside className="space-y-5 xl:sticky xl:top-6 xl:self-start"><section className="apse-card p-6"><h2 className="text-xl font-semibold">Estado y cuota</h2><dl className="mt-4 space-y-3"><Data label="Tipo" value={memberTypeLabels[member.member_type]}/><Data label="Cuota anual" value={formatMoney(member.base_fee_cents)}/>{member.member_type==='professional'&&<Data label="Seguro" value={member.insurance_selected?'Sí':'No'}/>}<Data label="¿Quieres aparecer en el directorio?" value={member.directory_opt_in?'Sí':'No'}/></dl></section><AdminMembershipWorkflow membershipId={member.id} status={member.status} rejectionReason={member.rejection_reason} approvedAt={member.approved_at} profileCompletedAt={member.profile_completed_at}/><AdminMemberDeleteForm membershipId={member.id} returnTo={backHref}/></aside></div>
  </div>
}

function Documents({documents}:{documents:Awaited<ReturnType<typeof listMembershipDocuments>>}){return <section className="apse-card p-6"><h2 className="text-xl font-semibold">Documentación</h2><div className="mt-4 space-y-3">{documents.map(doc=><div className="rounded-xl border border-stone-200 p-3" key={doc.id}><a className="font-semibold text-emerald-900" href={`/api/documents/${doc.id}`}>{doc.original_name}</a><p className="text-xs text-stone-500">{documentKindLabels[doc.kind]??doc.kind} · {doc.status}</p><form action={reviewMembershipDocument} className="mt-2 flex gap-2"><input type="hidden" name="documentId" value={doc.id}/><select className="rounded-lg border border-stone-300 px-2 py-1 text-sm" name="status" defaultValue={doc.status}><option value="pending">Pendiente</option><option value="valid">Válido</option><option value="rejected">Rechazado</option></select><button className="text-sm font-semibold text-emerald-900">Guardar</button></form></div>)}{documents.length===0&&<p className="text-sm text-stone-500">Sin documentos.</p>}</div></section>}
function Data({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3"><dt className="text-sm text-stone-500">{label}</dt><dd className="text-sm font-semibold text-stone-800">{value}</dd></div>}
