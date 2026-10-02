import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { DemoBanner } from '@/components/DemoBanner'
import { Button, EmptyState, ErrorState } from '@/components/ui'
import { errorMessage } from '@/api/client'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  errorComponent: ({ error, reset }) => (
    <RootLayout>
      <div className="mx-auto w-full max-w-2xl px-4 pt-6">
        <ErrorState message={errorMessage(error)} onRetry={reset} />
      </div>
    </RootLayout>
  ),
  notFoundComponent: () => (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6">
      <EmptyState
        title="Essa página não existe"
        action={
          <Button onClick={() => window.history.back()} variant="secondary">
            Voltar
          </Button>
        }
      />
    </div>
  ),
})

function RootLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-full">
      <DemoBanner />
      {/* Espaco para a barra fixa nao cobrir o fim da lista. */}
      <main className="pb-24">{children ?? <Outlet />}</main>
      <BottomNav />
    </div>
  )
}
