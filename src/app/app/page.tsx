import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, CalendarDays, DollarSign, UserCheck, Users } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { dashboard } from '@/lib/queries'
import { brl, dayKey, fmtDay, fmtTime } from '@/lib/dates'
import { StatusBadge } from './StatusBadge'

export const metadata = { title: 'Início' }

export default async function DashboardPage() {
  const { businessId, name } = await requireSession()
  const d = await dashboard(businessId)
  const delta = d.prevRevenue > 0 ? Math.round(((d.monthRevenue - d.prevRevenue) / d.prevRevenue) * 100) : null
  const max = Math.max(...d.byDay.map((x) => x.cents), 1)
  const total30 = d.byDay.reduce((s, x) => s + x.cents, 0)
  const topMax = Math.max(...d.topServices.map((s) => s.cents), 1)

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {name.split(' ')[0]} 👋</h1>
        <p className="text-muted">{fmtDay(d.today)}</p>
      </div>

      {d.clientsTotal === 0 && (
        <section className="card border-brand/30 bg-gradient-to-br from-brand/5 to-violet-500/5 p-6">
          <h2 className="text-lg font-semibold">Vamos começar? 🚀</h2>
          <p className="mt-1 text-sm text-muted">Em 3 passos sua agenda está pronta:</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Revise seus serviços', '/app/servicos'],
              ['2', 'Cadastre seus clientes', '/app/clientes'],
              ['3', 'Marque o primeiro horário', '/app/agenda'],
            ].map(([n, t, href]) => (
              <li key={n}>
                <Link href={href} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-sm font-medium transition hover:border-brand/40">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{n}</span>
                  {t}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={CalendarDays} label="Atendimentos hoje" value={String(d.todayCount)} hint={d.todayCount === 0 ? 'nenhum hoje' : d.todayPending ? `${d.todayPending} a confirmar` : 'todos confirmados'} />
        <Kpi
          icon={DollarSign}
          label="Faturamento no mês"
          value={brl(d.monthRevenue)}
          hint={
            delta === null ? `${d.monthCount} atendimentos` : (
              <span className={`inline-flex items-center gap-0.5 font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(delta)}% vs. mês passado
              </span>
            )
          }
        />
        <Kpi icon={Users} label="Clientes" value={String(d.clientsTotal)} hint="cadastrados" />
        <Kpi icon={UserCheck} label="Comparecimento" value={`${d.attendance}%`} hint={`${d.noShow} faltas em 30 dias`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Gráfico de faturamento */}
        <section className="card p-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-semibold">Faturamento — últimos 30 dias</h2>
              <p className="text-2xl font-bold">{brl(total30)}</p>
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-[3px]" role="img" aria-label="Gráfico de faturamento diário dos últimos 30 dias">
            {d.byDay.map((x) => (
              <div key={x.day} className="group relative flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-[3px] transition ${x.day === dayKey(new Date()) ? 'bg-brand' : 'bg-brand/30 group-hover:bg-brand/60'}`}
                  style={{ height: `${Math.max(2, (x.cents / max) * 100)}%` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {fmtDay(x.day, { day: '2-digit', month: 'short' })}: {brl(x.cents)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{fmtDay(d.byDay[0].day, { day: '2-digit', month: 'short' })}</span>
            <span>hoje</span>
          </div>

          <h3 className="mt-8 font-semibold">Serviços que mais faturam</h3>
          {d.topServices.length === 0 && <p className="mt-3 text-sm text-muted">Os serviços aparecem aqui conforme os atendimentos são concluídos.</p>}
          <ul className="mt-3 grid gap-3">
            {d.topServices.map((s) => (
              <li key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
                  <span className="text-muted">· {s.n}x</span>
                </span>
                <span className="font-medium">{brl(s.cents)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <span className="block h-full rounded-full" style={{ width: `${(s.cents / topMax) * 100}%`, background: s.color }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Próximos */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Próximos atendimentos</h2>
            <Link href="/app/agenda" className="text-sm font-medium text-brand hover:underline">
              Ver agenda
            </Link>
          </div>
          {d.upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Nenhum atendimento nos próximos dias.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {d.upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-sm font-semibold">{fmtTime(a.startsAt)}</p>
                    <p className="text-[11px] text-muted">{fmtDay(dayKey(a.startsAt), { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: a.serviceColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.clientName}</p>
                    <p className="truncate text-xs text-muted">{a.serviceName}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        <Icon size={18} className="hidden text-brand sm:block" />
      </div>
      <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  )
}
