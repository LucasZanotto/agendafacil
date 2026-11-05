import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { appointmentsBetween, countsByDay, listClientOptions, listServices } from '@/lib/queries'
import { addDays, brl, dayKey, dayRange, fmtDay, fmtTime, weekStart } from '@/lib/dates'
import { createAppointment } from '../../actions'
import { ModalForm } from '@/components/ui'
import { StatusBadge } from '../StatusBadge'
import { StatusActions } from './StatusActions'

export const metadata = { title: 'Agenda' }

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { businessId } = await requireSession()
  const today = dayKey(new Date())
  const sp = await searchParams
  const day = /^\d{4}-\d{2}-\d{2}$/.test(sp.dia ?? '') ? sp.dia! : today
  const monday = weekStart(day)

  const [list, counts, svc, cli] = await Promise.all([
    appointmentsBetween(businessId, dayRange(day).start, dayRange(day).end),
    countsByDay(businessId, monday, 7),
    listServices(businessId, true),
    listClientOptions(businessId),
  ])
  const active = list.filter((a) => a.status !== 'cancelado')
  const expected = active.reduce((s, a) => s + a.priceCents, 0)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted">{fmtDay(day)}</p>
        </div>
        <ModalForm
          title="Novo agendamento"
          action={createAppointment}
          submitLabel="Agendar"
          trigger={
            <>
              <Plus size={16} /> Novo agendamento
            </>
          }
        >
          <label className="label">
            Cliente
            <select name="clientId" required className="input" defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {cli.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Serviço
            <select name="serviceId" required className="input" defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {svc.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMin} min · {brl(s.priceCents)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              Data
              <input name="date" type="date" required defaultValue={day} className="input" />
            </label>
            <label className="label">
              Horário
              <input name="time" type="time" required step={900} defaultValue="09:00" className="input" />
            </label>
          </div>
          <label className="label">
            Observações
            <textarea name="notes" rows={2} maxLength={300} className="input resize-none" />
          </label>
        </ModalForm>
      </div>

      {/* Semana */}
      <div className="card flex items-center gap-1 p-2">
        <Link href={`?dia=${addDays(day, -7)}`} className="rounded-lg p-2 text-muted hover:bg-canvas" aria-label="Semana anterior">
          <ChevronLeft size={18} />
        </Link>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => {
            const selected = d === day
            return (
              <Link
                key={d}
                href={`?dia=${d}`}
                className={`flex flex-col items-center rounded-xl py-2 text-center transition ${selected ? 'bg-brand text-white' : 'hover:bg-canvas'}`}
              >
                <span className={`text-[11px] uppercase ${selected ? 'text-white/80' : 'text-muted'}`}>{fmtDay(d, { weekday: 'short' }).replace('.', '')}</span>
                <span className={`text-lg font-semibold ${d === today && !selected ? 'text-brand' : ''}`}>{Number(d.slice(8))}</span>
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${counts[d] ? (selected ? 'bg-white' : 'bg-brand/60') : 'bg-transparent'}`} />
              </Link>
            )
          })}
        </div>
        <Link href={`?dia=${addDays(day, 7)}`} className="rounded-lg p-2 text-muted hover:bg-canvas" aria-label="Próxima semana">
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
        <span>
          <b className="text-ink">{active.length}</b> atendimentos
        </span>
        <span>
          <b className="text-ink">{brl(expected)}</b> previstos
        </span>
        {day !== today && (
          <Link href="/app/agenda" className="font-medium text-brand hover:underline">
            Voltar para hoje
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
          <p className="text-4xl">🗓️</p>
          <p className="font-medium">Nenhum atendimento neste dia</p>
          <p className="text-sm text-muted">Use “Novo agendamento” para marcar um horário.</p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {list.map((a) => (
            <li key={a.id} className={`card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 ${a.status === 'cancelado' ? 'opacity-60' : ''}`}>
              <div className="w-16 shrink-0">
                <p className="font-semibold">{fmtTime(a.startsAt)}</p>
                <p className="text-xs text-muted">até {fmtTime(a.endsAt)}</p>
              </div>
              <span className="hidden h-10 w-1 shrink-0 rounded-full sm:block" style={{ background: a.serviceColor }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.clientName}</p>
                <p className="truncate text-sm text-muted">
                  {a.serviceName} · {brl(a.priceCents)}
                  {a.clientPhone && <> · {a.clientPhone}</>}
                </p>
                {a.notes && <p className="mt-1 text-sm italic text-muted">“{a.notes}”</p>}
              </div>
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
                <StatusBadge status={a.status} />
                <StatusActions id={a.id} status={a.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
