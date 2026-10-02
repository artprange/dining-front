import { useState } from 'react'

import { demoFailed, isDemo, resetDatabase } from '@/mocks'

/**
 * Deixa explícito que os dados são de demonstração. Sem isso o visitante não
 * tem como saber que está mexendo num catálogo fictício — e pode achar que
 * cadastrou algo de verdade.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (!isDemo) return null

  /**
   * Sem o worker nada é interceptado, e as telas mostram "a API esta
   * rodando?" — pergunta sem sentido numa demonstração, que não tem API.
   * Este aviso não fecha: é a explicação do que o visitante está vendo.
   */
  if (demoFailed) {
    return (
      <div className="bg-red-100 px-4 py-2 text-xs text-red-900">
        <p className="mx-auto w-full max-w-2xl">
          <strong>Demonstração indisponível.</strong> Este navegador não
          permitiu registrar o service worker que simula a API, então as listas
          vão aparecer vazias.
        </p>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="bg-amber-100 px-4 py-2 text-xs text-amber-900">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
        <p className="flex-1">
          <strong>Demonstração.</strong> Dados fictícios, guardados só no seu
          navegador. Pode cadastrar e apagar à vontade.
        </p>
        <button
          type="button"
          className="shrink-0 underline"
          onClick={() => {
            if (confirm('Voltar ao catálogo inicial? Suas alterações somem.')) {
              resetDatabase()
              window.location.reload()
            }
          }}
        >
          recomeçar
        </button>
        <button
          type="button"
          className="shrink-0 underline"
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso"
        >
          fechar
        </button>
      </div>
    </div>
  )
}
