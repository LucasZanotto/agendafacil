'use server'

import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getDb, schema } from '@/db'
import { createBusiness, DEMO, resetDemo } from '@/db/seed'
import { requireSession } from '@/lib/auth'
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session'
import { zonedDate } from '@/lib/dates'
import { APPOINTMENT_STATUS } from '@/db/schema'

export type FormState = { error?: string; ok?: boolean } | undefined

const { users, services, clients, appointments } = schema

async function startSession(user: { id: number; businessId: number; name: string }) {
  const token = await signSession({ userId: user.id, businessId: user.businessId, name: user.name })
  ;(await cookies()).set(SESSION_COOKIE, token, cookieOptions)
}

// ---------------- autenticação ----------------
export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')
  const db = await getDb()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: 'E-mail ou senha incorretos.' }
  await startSession(user)
  redirect('/app')
}

export async function loginDemo() {
  const db = await getDb()
  const [user] = await db.select().from(users).where(eq(users.email, DEMO.email)).limit(1)
  if (!user) throw new Error('Conta demo não encontrada')
  await startSession(user)
  redirect('/app')
}

const signupSchema = z.object({
  businessName: z.string().trim().min(2, 'Informe o nome do seu negócio.'),
  name: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.email('E-mail inválido.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
})

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const db = await getDb()
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1)
  if (exists) return { error: 'Já existe uma conta com esse e-mail.' }
  const { user } = await createBusiness(db, parsed.data)
  await startSession(user)
  redirect('/app')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/login')
}

// ---------------- agendamentos ----------------
const apptSchema = z.object({
  clientId: z.coerce.number().int().positive('Escolha um cliente.'),
  serviceId: z.coerce.number().int().positive('Escolha um serviço.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  notes: z.string().max(300).optional().default(''),
})

export async function createAppointment(_: FormState, form: FormData): Promise<FormState> {
  const { businessId } = await requireSession()
  const parsed = apptSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { clientId, serviceId, date, time, notes } = parsed.data
  const db = await getDb()

  const [svc] = await db.select().from(services).where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
  const [cli] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
  if (!svc || !cli) return { error: 'Cliente ou serviço inválido.' }

  const startsAt = zonedDate(date, time)
  const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60_000)
  await db.insert(appointments).values({ businessId, clientId, serviceId, startsAt, endsAt, priceCents: svc.priceCents, notes })
  revalidatePath('/app', 'layout')
  return { ok: true }
}

export async function setAppointmentStatus(id: number, status: string) {
  const { businessId } = await requireSession()
  const s = z.enum(APPOINTMENT_STATUS).parse(status)
  const db = await getDb()
  await db.update(appointments).set({ status: s }).where(and(eq(appointments.id, id), eq(appointments.businessId, businessId)))
  revalidatePath('/app', 'layout')
}

// ---------------- clientes ----------------
const clientSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente.'),
  phone: z.string().trim().max(30).optional().default(''),
  email: z.union([z.literal(''), z.email('E-mail inválido.')]).optional().default(''),
  notes: z.string().max(500).optional().default(''),
})

export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  const { businessId } = await requireSession()
  const parsed = clientSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const db = await getDb()
  await db.insert(clients).values({ ...parsed.data, businessId })
  revalidatePath('/app', 'layout')
  return { ok: true }
}

// ---------------- serviços ----------------
const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do serviço.'),
  durationMin: z.coerce.number().int().min(5, 'Duração mínima de 5 min.').max(600),
  price: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, 'Preço inválido.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional().default('#6366f1'),
})

export async function createService(_: FormState, form: FormData): Promise<FormState> {
  const { businessId } = await requireSession()
  const parsed = serviceSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { name, durationMin, price, color } = parsed.data
  const db = await getDb()
  await db.insert(services).values({ businessId, name, durationMin, color, priceCents: Math.round(Number(price.replace(',', '.')) * 100) })
  revalidatePath('/app', 'layout')
  return { ok: true }
}

export async function toggleService(id: number, active: boolean) {
  const { businessId } = await requireSession()
  const db = await getDb()
  await db.update(services).set({ active }).where(and(eq(services.id, id), eq(services.businessId, businessId)))
  revalidatePath('/app', 'layout')
}

// ---------------- demo ----------------
export async function restoreDemo() {
  const { businessId } = await requireSession()
  const db = await getDb()
  const [demoUser] = await db.select().from(users).where(eq(users.email, DEMO.email)).limit(1)
  if (demoUser?.businessId !== businessId) return
  await resetDemo(db, businessId)
  revalidatePath('/app', 'layout')
}
