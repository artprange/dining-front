import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/**
 * `activeProps` sozinho nao resolve aqui: "/restaurants" casaria também com
 * "/restaurants/new", acendendo duas abas ao mesmo tempo. Então cada item diz
 * explicitamente em que rotas ele está ativo.
 */
const items = [
  {
    to: '/',
    label: 'Vamos aonde?',
    isActive: (path: string) => path === '/',
    icon: (
      <Icon>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <circle cx="12" cy="12" r="4" />
      </Icon>
    ),
  },
  {
    to: '/restaurants',
    label: 'Lista',
    isActive: (path: string) =>
      path === '/restaurants' || (path.startsWith('/restaurants/') && path !== '/restaurants/new'),
    icon: (
      <Icon>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </Icon>
    ),
  },
  {
    to: '/restaurants/new',
    label: 'Novo',
    isActive: (path: string) => path === '/restaurants/new',
    icon: (
      <Icon>
        <path d="M12 5v14M5 12h14" />
      </Icon>
    ),
  },
  {
    to: '/settings',
    label: 'Ajustes',
    isActive: (path: string) => path.startsWith('/settings'),
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
      </Icon>
    ),
  },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur">
      <ul className="pb-safe mx-auto flex max-w-2xl">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to}
              aria-current={item.isActive(pathname) ? 'page' : undefined}
              className={
                'flex flex-col items-center gap-1 px-1 pt-2 pb-1 text-[11px] transition ' +
                (item.isActive(pathname) ? 'font-medium text-brand' : 'text-muted')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
