import { requireUser } from '@/lib/access'
import { getMembershipByUser } from '@/features/memberships/service'
import { ProfileForm } from '@/features/memberships/components/profile-form'

export default async function ProfilePage(){const user=await requireUser();const member=await getMembershipByUser(user.id);if(!member)return null;return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[var(--apse-clay)]">Área privada</p><h1 className="mt-2 text-3xl font-semibold text-emerald-950">Mi perfil</h1><p className="mt-2 text-stone-600">Los campos públicos solo se muestran si activas el directorio y tu cuenta está activa.</p></div><ProfileForm member={member}/></div>}
