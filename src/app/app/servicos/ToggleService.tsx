'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleService } from '../../actions'

export function ToggleService({ id, active }: { id: number; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active)
  const [, start] = useTransition()
  return (
    <button
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? 'Desativar serviço' : 'Ativar serviço'}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic)
          await toggleService(id, !optimistic)
        })
      }
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${optimistic ? 'bg-brand' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${optimistic ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
