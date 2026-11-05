import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { login, loginDemo } from '../../actions'
import { AuthForm } from '../AuthForm'

export const metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-bold">Entrar na sua conta</h1>
      <p className="mt-1 text-sm text-muted">Bem-vindo de volta!</p>

      <form action={loginDemo} className="mt-6">
        <button className="btn w-full border border-brand/30 bg-brand/5 py-2.5 text-brand-dark hover:bg-brand/10">
          <Sparkles size={16} /> Entrar com a conta demo
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>

      <AuthForm action={login} submitLabel="Entrar">
        <label className="label">
          E-mail
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="label">
          Senha
          <input name="password" type="password" required autoComplete="current-password" className="input" />
        </label>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-brand hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
