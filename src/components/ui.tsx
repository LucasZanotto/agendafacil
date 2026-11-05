'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import type { FormState } from '@/app/actions'

export function SubmitButton({ children, className = 'btn-primary' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

/**
 * Botão que abre um modal com um formulário ligado a uma Server Action.
 * Fecha sozinho quando a action devolve { ok: true }.
 */
export function ModalForm({
  trigger,
  title,
  action,
  submitLabel,
  children,
  triggerClassName = 'btn-primary',
}: {
  trigger: React.ReactNode
  title: string
  action: (state: FormState, form: FormData) => Promise<FormState>
  submitLabel: string
  children: React.ReactNode
  triggerClassName?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [key, setKey] = useState(0)
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await action(prev, fd)
    if (res?.ok) {
      ref.current?.close()
      setKey((k) => k + 1) // limpa o formulário
    }
    return res
  }, undefined)

  useEffect(() => {
    const d = ref.current
    const onClick = (e: MouseEvent) => e.target === d && d?.close()
    d?.addEventListener('click', onClick)
    return () => d?.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
      >
        <form key={key} ref={formRef} action={formAction} className="grid gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} className="rounded-lg p-1 text-muted hover:bg-canvas" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          {children}
          {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => ref.current?.close()}>
              Cancelar
            </button>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  )
}
