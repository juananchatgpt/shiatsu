import Link from 'next/link'
import {requireAdmin} from '@/lib/access'
import {AdminMemberCreateForm} from '@/features/admin/components/admin-member-create-form'

export default async function NewAdminMemberPage(){await requireAdmin();return <div className="mx-auto max-w-5xl"><div className="mb-7"><Link className="text-sm font-semibold text-stone-500" href="/admin/socios">← Volver a socios</Link><h1 className="mt-5 text-3xl font-semibold text-emerald-950">Alta manual de socio</h1><p className="mt-2 text-stone-600">Crea la cuenta sin enviar correos. Después podrás completar todos los datos, documentos e imágenes desde su ficha.</p></div><AdminMemberCreateForm/></div>}
