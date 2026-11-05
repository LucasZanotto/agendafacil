import { Clock, Plus } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { listServices } from '@/lib/queries'
import { brl } from '@/lib/dates'
import { createService } from '../../actions'
import { ModalForm } from '@/components/ui'
import { ToggleService } from './ToggleService'

export const metadata = { title: 'Serviços' }

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#64748b']

export default async function ServicesPage() {
  const { businessId } = await requireSession()
  const list = await listServices(businessId)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted">O que você oferece, com duração e preço.</p>
        </div>
        <ModalForm
          title="Novo serviço"
          action={createService}
          submitLabel="Salvar"
          trigger={
            <>
              <Plus size={16} /> Novo serviço
            </>
          }
        >
          <label className="label">
            Nome
            <input name="name" required className="input" placeholder="Ex.: Hidratação" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">
              Duração (min)
              <input name="durationMin" type="number" min={5} step={5} defaultValue={30} required className="input" />
            </label>
            <label className="label">
              Preço (R$)
              <input name="price" inputMode="decimal" placeholder="50,00" required className="input" />
            </label>
          </div>
          <fieldset className="label">
            <legend className="mb-1.5">Cor na agenda</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c, i) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="block h-8 w-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2" style={{ background: c }} />
                </label>
              ))}
            </div>
          </fieldset>
        </ModalForm>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className={`card relative overflow-hidden p-5 ${s.active ? '' : 'opacity-60'}`}>
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: s.color }} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{s.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <Clock size={14} /> {s.durationMin} min
                </p>
              </div>
              <ToggleService id={s.id} active={s.active} />
            </div>
            <p className="mt-4 text-2xl font-bold">{brl(s.priceCents)}</p>
            {!s.active && <p className="mt-1 text-xs text-muted">Inativo: não aparece em novos agendamentos</p>}
          </article>
        ))}
      </div>
    </div>
  )
}
