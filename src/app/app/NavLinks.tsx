'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutDashboard, Scissors, Users } from 'lucide-react'

const LINKS = [
  { href: '/app', label: 'Início', icon: LayoutDashboard },
  { href: '/app/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/servicos', label: 'Serviços', icon: Scissors },
]

export function NavLinks({ className, mobile = false }: { className?: string; mobile?: boolean }) {
  const path = usePathname()
  return (
    <nav className={className}>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === '/app' ? path === href : path.startsWith(href)
        return mobile ? (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? 'text-brand' : 'text-muted'}`}>
            <Icon size={20} />
            {label}
          </Link>
        ) : (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-brand/10 text-brand-dark' : 'text-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
