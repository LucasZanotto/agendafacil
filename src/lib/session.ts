import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'af_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export type Session = { userId: number; businessId: number; name: string }

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s && process.env.NODE_ENV === 'production') throw new Error('Defina a variável AUTH_SECRET')
  return new TextEncoder().encode(s ?? 'dev-secret-somente-para-desenvolvimento-local')
}

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret())
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return { userId: Number(payload.userId), businessId: Number(payload.businessId), name: String(payload.name) }
  } catch {
    return null
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
}
