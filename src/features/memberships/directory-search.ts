const ACCENTED_CHARACTERS='áàäâãåéèëêíìïîóòöôõúùüûñç'
const PLAIN_CHARACTERS='aaaaaaeeeeiiiiooooouuuunc'

export function normalizeDirectorySearch(value:string){
  return value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('es-ES').trim()
}

export function normalizedDirectorySql(expression:string){
  return `translate(lower(${expression}), '${ACCENTED_CHARACTERS}', '${PLAIN_CHARACTERS}')`
}
