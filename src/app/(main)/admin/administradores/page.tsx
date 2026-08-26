import { requireAdmin } from '@/lib/access'
import { query } from '@/lib/db'
import { AdminForm } from '@/features/admin/components/admin-form'
interface AdminRow{id:string;email:string;full_name:string|null;active:boolean;created_at:string}
export default async function AdminAccountsPage(){await requireAdmin();const admins=await query<AdminRow>(`SELECT id,email,full_name,active,created_at FROM users WHERE role='admin' ORDER BY created_at`);return <><div className="mb-7"><h1 className="text-3xl font-semibold text-emerald-950">Administradores</h1><p className="mt-2 text-stone-600">Todas las cuentas tienen el mismo perfil de permisos.</p></div><div className="grid gap-6 lg:grid-cols-[380px_1fr]"><AdminForm/><div className="apse-card divide-y">{admins.map(a=><div className="p-5" key={a.id}><p className="font-semibold text-emerald-950">{a.full_name||'Sin nombre'}</p><p className="text-sm text-stone-500">{a.email} · {a.active?'Activo':'Desactivado'}</p></div>)}</div></div></>}
