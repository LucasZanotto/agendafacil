'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/ui'
import type { FormState } from '../actions'

export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>
  submitLabel: string
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState(action, undefined)
  return (
    <form action={formAction} className="grid gap-4">
      {children}
      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <SubmitButton className="btn-primary py-2.5">{submitLabel}</SubmitButton>
    </form>
  )
}
