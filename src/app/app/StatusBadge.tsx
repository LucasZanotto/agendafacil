import type { AppointmentStatus } from '@/db/schema'

export const STATUS_META: Record<AppointmentStatus, { label: string; cls: string }> = {
  agendado: { label: 'Agendado', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  confirmado: { label: 'Confirmado', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  concluido: { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  faltou: { label: 'Faltou', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const m = STATUS_META[status]
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${m.cls}`}>{m.label}</span>
}
