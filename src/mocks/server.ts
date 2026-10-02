import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/**
 * Versão Node dos mesmos handlers, para os testes. Usa interceptação em vez
 * de service worker, então exercita os handlers sem depender do navegador.
 */
export const server = setupServer(...handlers)
