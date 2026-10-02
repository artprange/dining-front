/**
 * Modo demonstração: a aplicação roda sem o back de pé, com um catálogo
 * semeado e as escritas guardadas no navegador de quem visita.
 *
 * É ligado por `VITE_DEMO`, uma variável explícita — e não pela ausência de
 * `VITE_API_URL`. Esta tem um padrão útil para desenvolvimento
 * (`localhost:3000`), então deduzir o modo da ausência dela faria um deploy
 * de produção mal configurado virar demonstração em silêncio.
 */
export const isDemo = import.meta.env.VITE_DEMO === 'true'

/** Teto para a subida do worker. Ver `startDemoMode`. */
const STARTUP_TIMEOUT_MS = 4000

/**
 * Fica `true` quando o modo demonstração está ligado mas o worker não subiu.
 * A tela usa isso para explicar por que nada carrega.
 */
export let demoFailed = false

/**
 * Nunca rejeita e nunca trava. A aplicação só renderiza depois desta promise,
 * então qualquer caminho que não termine deixaria a tela em branco.
 *
 * São dois modos de falha distintos, e os dois acontecem de verdade:
 *
 * - Registro recusado — navegador sem suporte, contexto não seguro, falha ao
 *   buscar o script. Vira rejeição, tratada no catch.
 * - Registro que não responde. Alguns navegadores deixam `register()`
 *   pendente em vez de rejeitar (o Chrome headless é um deles). Sem o timeout
 *   abaixo, o `await` nunca voltaria e o render não aconteceria.
 */
export async function startDemoMode(): Promise<void> {
  if (!isDemo) return

  try {
    const { worker } = await import('./browser')

    // Aguardado antes do primeiro render: sem isso a primeira requisição pode
    // sair antes de o service worker estar pronto e escapar para a rede.
    const timedOut = Symbol('timeout')

    const result = await Promise.race([
      worker.start({
        // O app só chama a própria API; qualquer outra segue normal.
        // (No MSW 3 a opção se chama onUnhandledFrame, não onUnhandledRequest.)
        onUnhandledFrame: 'bypass',
        quiet: true,
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      }),
      new Promise<typeof timedOut>((resolve) => {
        setTimeout(() => resolve(timedOut), STARTUP_TIMEOUT_MS)
      }),
    ])

    if (result === timedOut) {
      demoFailed = true
      console.error('[demo] O service worker nao respondeu a tempo.')
    }
  } catch (cause) {
    demoFailed = true
    console.error('[demo] Service worker nao registrado.', cause)
  }
}

export { resetDatabase } from './db'
