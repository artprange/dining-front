import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * O render da aplicação acontece depois de `startDemoMode()`. Se ela não
 * terminar, a tela fica em branco — foi exatamente o que aconteceu num
 * navegador que deixa `register()` pendente em vez de rejeitar.
 *
 * Estes testes fixam o contrato: a promise sempre termina, aconteça o que
 * acontecer com o service worker.
 */

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function loadWithWorker(start: () => Promise<unknown>) {
  vi.stubEnv('VITE_DEMO', 'true')
  vi.doMock('./browser', () => ({ worker: { start } }))
  return import('./index')
}

describe('startDemoMode', () => {
  it('termina quando o worker sobe normalmente', async () => {
    const mod = await loadWithWorker(() => Promise.resolve())

    await expect(mod.startDemoMode()).resolves.toBeUndefined()
    expect(mod.demoFailed).toBe(false)
  })

  it('termina quando o registro é recusado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = await loadWithWorker(() => Promise.reject(new Error('sem suporte')))

    await expect(mod.startDemoMode()).resolves.toBeUndefined()
    expect(mod.demoFailed).toBe(true)
  })

  it('termina mesmo se o registro nunca responder', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()

    // Promise que nunca resolve: é o caso que deixava a tela em branco.
    const mod = await loadWithWorker(() => new Promise(() => {}))

    const pending = mod.startDemoMode()
    await vi.advanceTimersByTimeAsync(5000)

    await expect(pending).resolves.toBeUndefined()
    expect(mod.demoFailed).toBe(true)
  })

  it('não toca no worker quando o modo demonstração está desligado', async () => {
    vi.stubEnv('VITE_DEMO', '')
    const start = vi.fn()
    vi.doMock('./browser', () => ({ worker: { start } }))

    const mod = await import('./index')

    await expect(mod.startDemoMode()).resolves.toBeUndefined()
    expect(start).not.toHaveBeenCalled()
  })
})
