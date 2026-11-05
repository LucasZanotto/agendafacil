import Image from 'next/image'
import { LogOut, RotateCcw } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getBusiness } from '@/lib/queries'
import { logout, restoreDemo } from '../actions'
import { NavLinks } from './NavLinks'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const biz = await getBusiness(session.businessId)

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-line bg-white p-4 lg:flex">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <Image src="/logo.svg" alt="" width={36} height={36} className="h-8 w-8" />
          <span className="font-bold">AgendaFácil</span>
        </div>
        <div className="mt-6 rounded-xl bg-canvas px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{biz.name}</p>
          <p className="truncate text-xs text-muted">{session.name}</p>
        </div>
        <NavLinks className="mt-6 grid gap-1" />
        <div className="mt-auto grid gap-1">
          {biz.isDemo && (
            <form action={restoreDemo}>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink">
                <RotateCcw size={16} /> Restaurar dados demo
              </button>
            </form>
          )}
          <form action={logout}>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink">
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={36} height={36} className="h-7 w-7" />
          <span className="font-semibold">{biz.name}</span>
        </div>
        <form action={logout}>
          <button className="rounded-lg p-2 text-muted hover:bg-canvas" aria-label="Sair">
            <LogOut size={18} />
          </button>
        </form>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
        {biz.isDemo && (
          <p className="mb-6 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm text-brand-dark">
            Você está na <b>conta demo</b>. Fique à vontade para criar, editar e testar tudo.
          </p>
        )}
        {children}
      </main>

      {/* Navegação inferior (celular) */}
      <NavLinks mobile className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" />
    </div>
  )
}
