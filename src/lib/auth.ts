import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { SESSION_COOKIE, verifySession } from './session'

/** Sessão do usuário logado (ou redireciona para o login). Cacheada por requisição. */
export const requireSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySession(token)
  if (!session) redirect('/login')
  return session
})
