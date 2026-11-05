import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, CalendarDays, CheckCircle2, Users } from 'lucide-react'
import { loginDemo } from './actions'

const FEATURES = [
  { icon: CalendarDays, title: 'Agenda do dia e da semana', text: 'Veja quem vem hoje, marque horários em segundos e acompanhe confirmações e faltas.' },
  { icon: Users, title: 'Cadastro de clientes', text: 'Histórico de visitas, quanto cada cliente já gastou e quando volta.' },
  { icon: BarChart3, title: 'Faturamento e relatórios', text: 'Receita do mês, serviços que mais vendem e taxa de comparecimento.' },
]

export default function Home() {
  return (
    <div className="min-h-svh bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src="/logo.svg" alt="" width={36} height={36} className="h-8 w-8" /> AgendaFácil
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn text-muted hover:text-ink">
            Entrar
          </Link>
          <Link href="/cadastro" className="btn-primary">
            Criar conta
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-40 h-[500px] bg-[radial-gradient(600px_300px_at_50%_30%,rgba(99,102,241,.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:pt-24">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">Para salões, barbearias, clínicas e estúdios</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
              Sua agenda organizada.
              <br />
              <span className="bg-gradient-to-r from-brand to-violet-500 bg-clip-text text-transparent">Seus clientes de volta.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Agenda, clientes, serviços e faturamento em um painel simples, que funciona no computador e no celular.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <form action={loginDemo}>
                <button className="btn-primary w-full px-6 py-3 text-base sm:w-auto">Testar com conta demo</button>
              </form>
              <Link href="/cadastro" className="btn-ghost px-6 py-3 text-base">
                Criar minha conta grátis
              </Link>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
              <CheckCircle2 size={16} className="text-emerald-500" /> Sem cartão de crédito
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <f.icon size={22} />
              </div>
              <h2 className="mt-4 font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Projeto demonstrativo · desenvolvido por{' '}
        <a href="https://github.com/LucasZanotto" target="_blank" rel="noopener" className="font-medium text-brand hover:underline">
          Lucas Zanotto
        </a>
      </footer>
    </div>
  )
}
