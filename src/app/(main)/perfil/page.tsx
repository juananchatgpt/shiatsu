import { requireUser } from '@/lib/access'
import { getMembershipByUser } from '@/features/memberships/service'
import { ProfileForm } from '@/features/memberships/components/profile-form'
import { DocumentsPanel } from '@/features/memberships/components/documents-panel'
import { listMembershipDocuments } from '@/features/memberships/documents'
import { ProfilePhotoPanel } from '@/features/memberships/components/profile-photo-panel'
import { ProfileCoverPanel } from '@/features/memberships/components/profile-cover-panel'

export default async function ProfilePage(){const user=await requireUser();const member=await getMembershipByUser(user.id);if(!member)return null;const documents=await listMembershipDocuments(member.id);return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Área privada</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">Mi perfil</h1><p className="mt-2 text-stone-600">Los campos públicos solo se muestran si activas el directorio y tu cuenta está activa.</p></div><ProfileForm member={member}/><div className="mt-6"><ProfilePhotoPanel membershipId={member.id} memberType={member.member_type} hasPhoto={member.has_photo}/></div>{member.member_type==='school'&&<div className="mt-6"><ProfileCoverPanel membershipId={member.id} hasCover={member.has_cover}/></div>}<div className="mt-6"><DocumentsPanel memberType={member.member_type} documents={documents}/></div></div>}
