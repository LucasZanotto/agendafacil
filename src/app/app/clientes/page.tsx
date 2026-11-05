import { Plus, Search } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { listClients } from '@/lib/queries'
import { brl, fmtDate } from '@/lib/dates'
import { createClient } from '../../actions'
import { ModalForm } from '@/components/ui'

export const metadata = { title: 'Clientes' }

const toDate = (v: Date | string | null) => (v ? new Date(v) : null)

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { businessId } = await requireSession()
  const q = (await searchParams).q ?? ''
  const list = await listClients(businessId, q)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted">{list.length} {q ? (list.length === 1 ? 'encontrado' : 'encontrados') : list.length === 1 ? 'cadastrado' : 'cadastrados'}</p>
        </div>
        <ModalForm
          title="Novo cliente"
          action={createClient}
          submitLabel="Salvar"
          trigger={
            <>
              <Plus size={16} /> Novo cliente
            </>
          }
        >
          <label className="label">
            Nome
            <input name="name" required className="input" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">
              WhatsApp
              <input name="phone" inputMode="tel" placeholder="(49) 99999-9999" className="input" />
            </label>
            <label className="label">
              E-mail
              <input name="email" type="email" className="input" />
            </label>
          </div>
          <label className="label">
            Observações
            <textarea name="notes" rows={2} className="input resize-none" placeholder="Alergias, preferências…" />
          </label>
        </ModalForm>
      </div>

      <form className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou telefone" className="input pl-10" aria-label="Buscar clientes" />
      </form>

      {/* Tabela (desktop) */}
      <div className={`card hidden overflow-hidden ${list.length ? 'md:block' : ''}`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">Contato</th>
              <th className="px-5 py-3 text-right font-semibold">Visitas</th>
              <th className="px-5 py-3 text-right font-semibold">Total gasto</th>
              <th className="px-5 py-3 font-semibold">Última visita</th>
              <th className="px-5 py-3 font-semibold">Próxima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">
                  {c.phone}
                  {c.email && <span className="block text-xs">{c.email}</span>}
                </td>
                <td className="px-5 py-3 text-right">{c.visits}</td>
                <td className="px-5 py-3 text-right font-medium">{brl(c.spent)}</td>
                <td className="px-5 py-3 text-muted">{toDate(c.lastVisit) ? fmtDate(toDate(c.lastVisit)!) : '—'}</td>
                <td className="px-5 py-3">
                  {toDate(c.nextVisit) ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">{fmtDate(toDate(c.nextVisit)!)}</span> : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (celular) */}
      <ul className="grid gap-2 md:hidden">
        {list.map((c) => (
          <li key={c.id} className="card flex items-center gap-3 p-4">
            <Avatar name={c.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <p className="text-sm text-muted">
                {c.visits} visitas · {brl(c.spent)}
              </p>
            </div>
            {toDate(c.nextVisit) && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">{fmtDate(toDate(c.nextVisit)!).slice(0, 5)}</span>}
          </li>
        ))}
      </ul>

      {list.length === 0 && (
        <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
          <p className="text-4xl">👥</p>
          <p className="font-medium">{q ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</p>
          <p className="text-sm text-muted">{q ? 'Tente outro nome ou telefone.' : 'Use “Novo cliente” para cadastrar o primeiro.'}</p>
        </div>
      )}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  const hue = [...name].reduce((h, ch) => h + ch.charCodeAt(0), 0) % 360
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ background: `hsl(${hue} 80% 94%)`, color: `hsl(${hue} 55% 35%)` }}>
      {initials}
    </span>
  )
}
