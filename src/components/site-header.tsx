import { AppLogo } from './app-logo'

export function SiteHeader() {
  return <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
    <div className="apse-container flex h-20 items-center">
      <a href="https://shiatsu.ochoesferas.com/" aria-label="APSE Profesionales de Shiatsu de España"><AppLogo/></a>
    </div>
  </header>
}
