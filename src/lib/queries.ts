import 'server-only'
import { and, asc, count, desc, eq, gte, ilike, lt, or, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { addDays, dayKey, dayRange, zonedDate } from './dates'

const { appointments, clients, services, businesses, users } = schema

export async function getBusiness(businessId: number) {
  const db = await getDb()
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId))
  const [demo] = await db.select({ id: users.id }).from(users).where(and(eq(users.businessId, businessId), eq(users.email, 'demo@agendafacil.app')))
  return { ...biz, isDemo: Boolean(demo) }
}

export async function listServices(businessId: number, onlyActive = false) {
  const db = await getDb()
  return db
    .select()
    .from(services)
    .where(onlyActive ? and(eq(services.businessId, businessId), eq(services.active, true)) : eq(services.businessId, businessId))
    .orderBy(desc(services.active), asc(services.name))
}

export async function listClientOptions(businessId: number) {
  const db = await getDb()
  return db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.businessId, businessId)).orderBy(asc(clients.name))
}

export async function appointmentsBetween(businessId: number, start: Date, end: Date) {
  const db = await getDb()
  return db
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      priceCents: appointments.priceCents,
      notes: appointments.notes,
      clientName: clients.name,
      clientPhone: clients.phone,
      serviceName: services.name,
      serviceColor: services.color,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(eq(appointments.businessId, businessId), gte(appointments.startsAt, start), lt(appointments.startsAt, end)))
    .orderBy(asc(appointments.startsAt))
}

export type AppointmentRow = Awaited<ReturnType<typeof appointmentsBetween>>[number]

/** Quantidade de agendamentos ativos por dia, para a faixa da semana */
export async function countsByDay(businessId: number, fromDay: string, days: number) {
  const db = await getDb()
  const rows = await db
    .select({ startsAt: appointments.startsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.startsAt, zonedDate(fromDay)),
        lt(appointments.startsAt, zonedDate(addDays(fromDay, days))),
        sql`${appointments.status} <> 'cancelado'`,
      ),
    )
  const map: Record<string, number> = {}
  for (const r of rows) map[dayKey(r.startsAt)] = (map[dayKey(r.startsAt)] ?? 0) + 1
  return map
}

export async function dashboard(businessId: number) {
  const db = await getDb()
  const today = dayKey(new Date())
  const { start: todayStart, end: todayEnd } = dayRange(today)
  const monthStart = zonedDate(`${today.slice(0, 7)}-01`)
  const prevMonthStart = zonedDate(`${dayKey(new Date(monthStart.getTime() - 86_400_000)).slice(0, 7)}-01`)
  const last30 = zonedDate(addDays(today, -29))

  const todayList = await appointmentsBetween(businessId, todayStart, todayEnd)

  const revenue = async (from: Date, to: Date) => {
    const [r] = await db
      .select({ total: sql<number>`coalesce(sum(${appointments.priceCents}), 0)::int`, n: count() })
      .from(appointments)
      .where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'concluido'), gte(appointments.startsAt, from), lt(appointments.startsAt, to)))
    return r
  }
  const month = await revenue(monthStart, todayEnd)
  // mesmo período do mês anterior, para comparar
  const elapsed = todayEnd.getTime() - monthStart.getTime()
  const prev = await revenue(prevMonthStart, new Date(prevMonthStart.getTime() + elapsed))

  const [{ clientsTotal }] = await db.select({ clientsTotal: count() }).from(clients).where(eq(clients.businessId, businessId))

  const statusRows = await db
    .select({ status: appointments.status, n: count() })
    .from(appointments)
    .where(and(eq(appointments.businessId, businessId), gte(appointments.startsAt, last30), lt(appointments.startsAt, todayEnd)))
    .groupBy(appointments.status)
  const st = Object.fromEntries(statusRows.map((r) => [r.status, r.n])) as Record<string, number>
  const done = st.concluido ?? 0
  const noShow = st.faltou ?? 0
  const attendance = done + noShow > 0 ? Math.round((done / (done + noShow)) * 100) : 100

  const daily = await db
    .select({ startsAt: appointments.startsAt, priceCents: appointments.priceCents })
    .from(appointments)
    .where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'concluido'), gte(appointments.startsAt, last30), lt(appointments.startsAt, todayEnd)))
  const byDay: { day: string; cents: number }[] = Array.from({ length: 30 }, (_, i) => ({ day: addDays(today, i - 29), cents: 0 }))
  for (const r of daily) {
    const slot = byDay.find((d) => d.day === dayKey(r.startsAt))
    if (slot) slot.cents += r.priceCents
  }

  const topServices = await db
    .select({ name: services.name, color: services.color, n: count(), cents: sql<number>`sum(${appointments.priceCents})::int` })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'concluido'), gte(appointments.startsAt, last30)))
    .groupBy(services.name, services.color)
    .orderBy(desc(sql`sum(${appointments.priceCents})`))
    .limit(5)

  const upcoming = (await appointmentsBetween(businessId, new Date(), zonedDate(addDays(today, 7)))).filter((a) => a.status !== 'cancelado').slice(0, 6)

  return {
    today,
    todayCount: todayList.filter((a) => a.status !== 'cancelado').length,
    todayPending: todayList.filter((a) => a.status === 'agendado').length,
    monthRevenue: month.total,
    monthCount: month.n,
    prevRevenue: prev.total,
    clientsTotal,
    attendance,
    noShow,
    byDay,
    topServices,
    upcoming,
  }
}

export async function listClients(businessId: number, q: string) {
  const db = await getDb()
  const term = q.trim()
  return db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      visits: sql<number>`count(${appointments.id}) filter (where ${appointments.status} = 'concluido')::int`,
      spent: sql<number>`coalesce(sum(${appointments.priceCents}) filter (where ${appointments.status} = 'concluido'), 0)::int`,
      lastVisit: sql<Date | null>`max(${appointments.startsAt}) filter (where ${appointments.status} = 'concluido')`,
      nextVisit: sql<Date | null>`min(${appointments.startsAt}) filter (where ${appointments.startsAt} > now() and ${appointments.status} in ('agendado','confirmado'))`,
    })
    .from(clients)
    .leftJoin(appointments, eq(appointments.clientId, clients.id))
    .where(and(eq(clients.businessId, businessId), term ? or(ilike(clients.name, `%${term}%`), ilike(clients.phone, `%${term}%`)) : undefined))
    .groupBy(clients.id)
    .orderBy(asc(clients.name))
}
