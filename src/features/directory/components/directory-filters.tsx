type DirectoryFiltersProps = {
  p: Record<string,string|undefined>
  provinces: string[]
  compact?: boolean
}

export function DirectoryFilters({p,provinces,compact=false}:DirectoryFiltersProps){
  const fields=<>
    <select className="apse-input" name="type" defaultValue={p.type} aria-label="Tipo de perfil"><option value="">Profesionales y escuelas</option><option value="professional">Profesionales</option><option value="school">Escuelas</option></select>
    <input className="apse-input" name="q" placeholder="Nombre o escuela" aria-label="Nombre o escuela" defaultValue={p.q}/>
    <select className="apse-input" name="province" defaultValue={p.province} aria-label="Provincia"><option value="">Todas las provincias</option>{provinces.map(value=><option key={value} value={value}>{value}</option>)}</select>
    <button className="apse-button-directory">Buscar</button>
  </>
  const wrapperClass=compact?'sticky top-0 z-20 -mx-3 mb-4 border-b border-stone-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur':'my-8'
  const desktopClass=compact?'hidden gap-2 sm:grid sm:grid-cols-[180px_1fr_190px_auto]':'apse-card hidden gap-3 p-4 sm:grid sm:grid-cols-[220px_1fr_220px_auto]'
  const mobileClass=compact?'mt-2 grid gap-2 rounded-[3px] border border-stone-200 bg-white p-2 shadow-lg':'apse-card mt-2 grid gap-3 p-4'
  return <div className={wrapperClass}>
    <details className="group sm:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-[3px] border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-950 [&::-webkit-details-marker]:hidden"><span>Filtrar socios</span><span aria-hidden="true" className="text-lg leading-none transition group-open:rotate-180">⌄</span></summary>
      <form method="get" className={mobileClass}>{fields}</form>
    </details>
    <form method="get" className={desktopClass}>{fields}</form>
  </div>
}
