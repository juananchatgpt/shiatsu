import Image from 'next/image'

export const APSE_LOGO_URL = 'https://shiatsu.ochoesferas.com/wp-content/uploads/2026/08/cropped-logo.webp'

export function AppLogo({compact=false}:{compact?:boolean}){
  return <span className="flex items-center gap-3"><Image src={APSE_LOGO_URL} alt="APSE Profesionales de Shiatsu de España" width={compact?42:52} height={compact?42:52} unoptimized className="h-10 w-auto object-contain"/><span className={compact?'sr-only':'hidden text-sm font-semibold text-emerald-950 sm:block'}>APSE</span></span>
}
