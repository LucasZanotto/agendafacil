import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { DB } from './index'
import { appointments, businesses, clients, services, users, type AppointmentStatus } from './schema'
import { addDays, dayKey, zonedDate } from '@/lib/dates'

/** Conta de demonstração pública (exibida na tela de login). */
export const DEMO = { email: 'demo@agendafacil.app', password: 'demo1234' }

export const DEFAULT_SERVICES = [
  { name: 'Corte feminino', durationMin: 60, priceCents: 9000, color: '#8b5cf6' },
  { name: 'Escova', durationMin: 45, priceCents: 6000, color: '#06b6d4' },
  { name: 'Coloração', durationMin: 120, priceCents: 22000, color: '#f43f5e' },
  { name: 'Manicure', durationMin: 45, priceCents: 4000, color: '#f59e0b' },
  { name: 'Pedicure', durationMin: 45, priceCents: 4500, color: '#10b981' },
  { name: 'Design de sobrancelha', durationMin: 30, priceCents: 4500, color: '#6366f1' },
]

const FIRST = ['Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Sofia', 'Tatiane', 'Vanessa', 'Carla', 'Letícia', 'Bruna', 'Aline', 'Paula', 'Renata']
const LAST = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Lima', 'Carvalho', 'Ribeiro', 'Martins', 'Rocha', 'Gomes']

/** PRNG determinístico para os dados de exemplo serem sempre parecidos */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export async function createBusiness(db: DB, input: { businessName: string; name: string; email: string; password: string }) {
  const [biz] = await db.insert(businesses).values({ name: input.businessName }).returning()
  const passwordHash = await bcrypt.hash(input.password, 10)
  const [user] = await db.insert(users).values({ businessId: biz.id, name: input.name, email: input.email.toLowerCase(), passwordHash }).returning()
  await db.insert(services).values(DEFAULT_SERVICES.map((s) => ({ ...s, businessId: biz.id })))
  return { biz, user }
}

/** Popula a conta demo com ~60 dias de histórico e 2 semanas de agenda futura. */
export async function fillDemoData(db: DB, businessId: number) {
  const rand = rng(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

  const svc = await db.select().from(services).where(eq(services.businessId, businessId))
  const clientRows = Array.from({ length: 38 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5 + Math.floor(i / FIRST.length) * 3) % LAST.length]}`
    const phone = `(49) 9${String(8000 + Math.floor(rand() * 1999)).padStart(4, '0')}-${String(Math.floor(rand() * 9999)).padStart(4, '0')}`
    return { businessId, name, phone, email: `${name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}${i}@email.com` }
  })
  const cl = await db.insert(clients).values(clientRows).returning()

  const today = dayKey(new Date())
  const rows: (typeof appointments.$inferInsert)[] = []
  for (let offset = -60; offset <= 14; offset++) {
    const day = addDays(today, offset)
    const weekday = zonedDate(day, '12:00').getUTCDay()
    if (weekday === 0) continue // domingo fechado
    const perDay = weekday === 6 ? 7 : 4 + Math.floor(rand() * 5)
    const used = new Set<number>()
    for (let n = 0; n < perDay; n++) {
      let hour = 9 + Math.floor(rand() * 10)
      while (used.has(hour) && used.size < 10) hour = 9 + ((hour - 8) % 10)
      used.add(hour)
      const s = pick(svc)
      const start = zonedDate(day, `${String(hour).padStart(2, '0')}:${rand() < 0.5 ? '00' : '30'}`)
      const isPast = start.getTime() < Date.now()
      const r = rand()
      const status: AppointmentStatus = isPast
        ? r < 0.85 ? 'concluido' : r < 0.93 ? 'faltou' : 'cancelado'
        : r < 0.55 ? 'confirmado' : 'agendado'
      rows.push({
        businessId,
        clientId: pick(cl).id,
        serviceId: s.id,
        startsAt: start,
        endsAt: new Date(start.getTime() + s.durationMin * 60_000),
        priceCents: s.priceCents,
        status,
      })
    }
  }
  for (let i = 0; i < rows.length; i += 200) await db.insert(appointments).values(rows.slice(i, i + 200))
}

export async function seedDemo(db: DB) {
  const { biz } = await createBusiness(db, { businessName: 'Studio Bella', name: 'Bella Rocha', ...DEMO })
  await fillDemoData(db, biz.id)
}

/** Apaga os dados da conta demo e gera tudo de novo (botão "Restaurar demo"). */
export async function resetDemo(db: DB, businessId: number) {
  await db.delete(appointments).where(eq(appointments.businessId, businessId))
  await db.delete(clients).where(eq(clients.businessId, businessId))
  await db.delete(services).where(eq(services.businessId, businessId))
  await db.insert(services).values(DEFAULT_SERVICES.map((s) => ({ ...s, businessId })))
  await fillDemoData(db, businessId)
}
