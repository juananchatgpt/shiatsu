export function SiteHeader() {
  return <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
    <div className="apse-container flex h-20 items-center">
      <a href="https://shiatsu.ochoesferas.com/" className="flex items-center gap-3 text-emerald-950">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-950 text-sm font-bold text-white">AP</span>
        <span><strong className="block leading-tight">APSE</strong><span className="hidden text-xs text-stone-500 sm:block">Profesionales de Shiatsu de España</span></span>
      </a>
    </div>
  </header>
}
