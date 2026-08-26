import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
export default async function ResetPage({searchParams}:{searchParams:Promise<{token?:string}>}){const{token}=await searchParams;return <main className="grid min-h-screen place-items-center bg-[var(--apse-cream)] p-4"><ResetPasswordForm token={token??''}/></main>}
