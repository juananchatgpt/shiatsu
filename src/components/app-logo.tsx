import Image from 'next/image'

export const APSE_LOGO_URL = 'https://shiatsu.ochoesferas.com/wp-content/uploads/2026/08/cropped-logo.webp'

export function AppLogo(){
  return <span className="flex items-center"><Image src={APSE_LOGO_URL} alt="APSE Profesionales de Shiatsu de España" width={150} height={60} unoptimized className="h-[60px] w-[150px] object-contain"/><span className="sr-only">APSE</span></span>
}
