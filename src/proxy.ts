import { NextResponse, type NextRequest } from 'next/server'

// SPLIT DE VALIDACIÓN DE SESIÓN:
// El proxy (antes "middleware") corre en edge runtime y NO puede consultar
// Postgres, así que aquí solo se comprueba la PRESENCIA de la cookie de sesión
// (check barato). La validación REAL del token (existe, no expirado, usuario
// activo) se hace server-side con getSessionUser() en layouts y route handlers.
const SESSION_COOKIE = 'apse_session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = [
    '/', '/login', '/registro', '/solicitud-recibida', '/directorio', '/eventos',
    '/api/auth', '/api/public', '/api/profile-photos', '/api/profile-covers', '/api/widgets.js', '/api/health', '/embed', '/recuperar-contrasena', '/restablecer-contrasena',
  ]
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(SESSION_COOKIE)
  if (hasSession) return NextResponse.next()

  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
