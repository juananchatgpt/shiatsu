import { listPublicDirectory, listPublicDirectoryProvinces } from '@/features/memberships/service'
import { DirectoryView } from '@/features/directory/components/directory-view'
import { DirectoryFilters } from '@/features/directory/components/directory-filters'
export const dynamic='force-dynamic'
export default async function DirectoryEmbed({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;const provinces=await listPublicDirectoryProvinces(p.type);const province=p.province&&provinces.includes(p.province)?p.province:undefined;const rows=await listPublicDirectory({type:p.type,province,search:p.q});return <main className="bg-white p-3"><DirectoryFilters p={{...p,province}} provinces={provinces} compact/><DirectoryView rows={rows} compact/></main>}
