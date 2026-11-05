import Link from 'next/link'
import { signup } from '../../actions'
import { AuthForm } from '../AuthForm'

export const metadata = { title: 'Criar conta' }

export default function SignupPage() {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-bold">Crie sua conta grátis</h1>
      <p className="mt-1 text-sm text-muted">Em 1 minuto sua agenda está pronta para usar.</p>
      <div className="mt-6">
        <AuthForm action={signup} submitLabel="Criar conta">
          <label className="label">
            Nome do negócio
            <input name="businessName" required placeholder="Ex.: Studio Bella" className="input" />
          </label>
          <label className="label">
            Seu nome
            <input name="name" required autoComplete="name" className="input" />
          </label>
          <label className="label">
            E-mail
            <input name="email" type="email" required autoComplete="email" className="input" />
          </label>
          <label className="label">
            Senha
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="Mínimo de 8 caracteres" />
          </label>
        </AuthForm>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
