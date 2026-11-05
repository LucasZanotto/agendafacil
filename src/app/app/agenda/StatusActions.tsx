'use client'

import { useTransition } from 'react'
import { Check, CheckCheck, Loader2, UserX, X } from 'lucide-react'
import type { AppointmentStatus } from '@/db/schema'
import { setAppointmentStatus } from '../../actions'

const ACTIONS: { to: AppointmentStatus; label: string; icon: React.ElementType; from: AppointmentStatus[] }[] = [
  { to: 'confirmado', label: 'Confirmar', icon: Check, from: ['agendado'] },
  { to: 'concluido', label: 'Concluir', icon: CheckCheck, from: ['agendado', 'confirmado'] },
  { to: 'faltou', label: 'Faltou', icon: UserX, from: ['agendado', 'confirmado'] },
  { to: 'cancelado', label: 'Cancelar', icon: X, from: ['agendado', 'confirmado'] },
  { to: 'agendado', label: 'Reabrir', icon: Check, from: ['cancelado', 'faltou', 'concluido'] },
]

export function StatusActions({ id, status }: { id: number; status: AppointmentStatus }) {
  const [pending, start] = useTransition()
  const available = ACTIONS.filter((a) => a.from.includes(status))

  return (
    <div className="flex items-center gap-1">
      {pending && <Loader2 size={16} className="animate-spin text-muted" />}
      {available.map((a) => (
        <button
          key={a.to}
          disabled={pending}
          onClick={() => start(() => setAppointmentStatus(id, a.to))}
          title={a.label}
          className={`inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium transition hover:bg-canvas disabled:opacity-50 ${
            a.to === 'concluido' ? 'text-emerald-700' : a.to === 'cancelado' || a.to === 'faltou' ? 'text-rose-700' : 'text-ink'
          }`}
        >
          <a.icon size={14} />
          <span className="hidden sm:inline">{a.label}</span>
        </button>
      ))}
    </div>
  )
}
