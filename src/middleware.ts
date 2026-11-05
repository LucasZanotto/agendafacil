import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if ((pathname === '/login' || pathname === '/cadastro') && session) {
    return NextResponse.redirect(new URL('/app', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/app/:path*', '/login', '/cadastro'] }
