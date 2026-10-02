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

/**
 * Nunca rejeita. Se o service worker não puder ser registrado — navegador sem
 * suporte, contexto não seguro, falha no fetch do script — a aplicação ainda
 * precisa renderizar: ela cai nos estados de erro de rede que as telas já
 * sabem mostrar, o que é muito melhor que uma página em branco.
 */
export async function startDemoMode(): Promise<void> {
  if (!isDemo) return

  try {
    const { worker } = await import('./browser')

    // Aguardado antes do primeiro render: sem isso a primeira requisição pode
    // sair antes de o service worker estar pronto e escapar para a rede.
    await worker.start({
      // O app só chama a própria API; qualquer outra requisição segue normal.
      // (No MSW 3 a opção se chama onUnhandledFrame, não onUnhandledRequest.)
      onUnhandledFrame: 'bypass',
      quiet: true,
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    })
  } catch (cause) {
    console.error('[demo] Service worker não registrado; a API não será simulada.', cause)
  }
}

export { resetDatabase } from './db'
