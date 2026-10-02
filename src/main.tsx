import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'
import { startDemoMode } from './mocks'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Numa rede ruim, insistir três vezes só atrasa a mensagem de erro.
      retry: 1,
      staleTime: 30_000,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('Elemento #root nao encontrado no index.html.')

// O modo demonstração precisa estar de pé antes do primeiro render: é ele que
// intercepta as requisições. Fora dele, resolve na hora e segue direto.
// `startDemoMode` nunca rejeita, então o render sempre acontece.
startDemoMode().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
