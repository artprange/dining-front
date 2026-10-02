import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { baseUrl } from '../api/client'
import { api, ApiError } from '../api/client'
import type { RestaurantDetail, RestaurantWithSummary, Suggestion } from '../api/types'
import { resetDatabase } from './db'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Cada teste parte do catálogo semeado: as escritas de um não vazam no outro.
beforeEach(() => resetDatabase())

describe('GET /restaurants', () => {
  it('esconde arquivados por padrão', async () => {
    const list = await api.get<RestaurantWithSummary[]>('/restaurants')
    expect(list.every((item) => item.status === 'ACTIVE')).toBe(true)
    expect(list.some((item) => item.name === 'Cantina do Bairro')).toBe(false)
  })

  it('traz os arquivados quando pedidos', async () => {
    const list = await api.get<RestaurantWithSummary[]>('/restaurants', {
      status: 'ARCHIVED',
    })
    expect(list.map((item) => item.name)).toEqual(['Cantina do Bairro'])
  })

  it('calcula o resumo de visitas', async () => {
    const list = await api.get<RestaurantWithSummary[]>('/restaurants')
    const bracos = list.find((item) => item.name === 'Braço de Ferro')!

    // Duas visitas semeadas, notas 4 e 3.
    expect(bracos.visitCount).toBe(2)
    expect(bracos.visited).toBe(true)
    expect(bracos.averageRating).toBe(3.5)
  })

  it('zera o resumo de quem nunca foi visitado', async () => {
    const list = await api.get<RestaurantWithSummary[]>('/restaurants')
    const chimu = list.find((item) => item.name === 'Chimu')!

    expect(chimu.visited).toBe(false)
    expect(chimu.visitCount).toBe(0)
    expect(chimu.averageRating).toBeNull()
    expect(chimu.lastVisitedAt).toBeNull()
  })

  it('filtra por busca, cidade e "ainda não fomos"', async () => {
    const porNome = await api.get<RestaurantWithSummary[]>('/restaurants', {
      search: 'bra',
    })
    expect(porNome.map((item) => item.name)).toEqual(['Braço de Ferro'])

    const naoVisitados = await api.get<RestaurantWithSummary[]>('/restaurants', {
      onlyNotVisited: true,
    })
    expect(naoVisitados.every((item) => !item.visited)).toBe(true)
    expect(naoVisitados.length).toBeGreaterThan(0)
  })

  it('aceita ids repetidos no mesmo parâmetro', async () => {
    const list = await api.get<RestaurantWithSummary[]>('/restaurants', {
      cuisineTypeIds: ['cui-japonesa', 'cui-arabe'],
    })
    expect(list.map((item) => item.name).sort()).toEqual([
      'Aizomê',
      'Tantinho',
      "Za'atar",
    ])
  })
})

describe('GET /restaurants/suggestion', () => {
  it('não é engolida pela rota de :id', async () => {
    // A ordem de registro importa: `/restaurants/:id` casaria com
    // "suggestion" e devolveria 404.
    const list = await api.get<Suggestion[]>('/restaurants/suggestion')
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  it('devolve pontuação e motivos, em ordem decrescente', async () => {
    const list = await api.get<Suggestion[]>('/restaurants/suggestion', { limit: 5 })

    expect(list.length).toBeLessThanOrEqual(5)
    for (const item of list) {
      expect(item.reasons.length).toBeGreaterThan(0)
      expect(typeof item.score).toBe('number')
    }

    const scores = list.map((item) => item.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })

  it('respeita os filtros', async () => {
    const list = await api.get<Suggestion[]>('/restaurants/suggestion', {
      onlyNotVisited: true,
      limit: 10,
    })
    expect(list.every((item) => !item.visited)).toBe(true)
  })
})

describe('escrita de restaurante', () => {
  it('cria, lê de volta e resolve as relações pelos ids', async () => {
    const criado = await api.post<RestaurantWithSummary>('/restaurants', {
      name: 'Novo Lugar',
      cuisineTypeIds: ['cui-italiana'],
      tagIds: ['tag-delivery'],
      priceRange: 'CHEAP',
    })

    expect(criado.id).toBeTruthy()
    expect(criado.cuisineTypes.map((item) => item.name)).toEqual(['Italiana'])
    expect(criado.tags.map((item) => item.name)).toEqual(['Entrega boa'])
    // Campos não enviados recebem o padrão do back.
    expect(criado.status).toBe('ACTIVE')
    expect(criado.wishlistPriority).toBe('NORMAL')

    const lista = await api.get<RestaurantWithSummary[]>('/restaurants')
    expect(lista.some((item) => item.id === criado.id)).toBe(true)
  })

  it('recusa nome vazio com o formato de erro do Nest', async () => {
    await expect(api.post('/restaurants', { name: '  ' })).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 400 &&
        error.problems.includes('name should not be empty'),
    )
  })

  it('aplica PATCH parcial sem exigir os outros campos', async () => {
    const lista = await api.get<RestaurantWithSummary[]>('/restaurants')
    const alvo = lista[0]

    const atualizado = await api.patch<RestaurantWithSummary>(
      `/restaurants/${alvo.id}`,
      { wouldReturn: false },
    )

    expect(atualizado.wouldReturn).toBe(false)
    expect(atualizado.name).toBe(alvo.name)
  })

  it('apaga o restaurante junto do histórico de visitas', async () => {
    const antes = await api.get<RestaurantDetail>('/restaurants/res-bracos')
    expect(antes.visits.length).toBe(2)

    await api.delete('/restaurants/res-bracos')

    await expect(api.get('/restaurants/res-bracos')).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 404,
    )
    // As visitas não podem sobreviver ao dono.
    await expect(api.get('/restaurants/res-bracos/visits')).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 404,
    )
  })
})

describe('visitas', () => {
  it('registrar uma visita muda o resumo do restaurante', async () => {
    const antes = await api.get<RestaurantDetail>('/restaurants/res-chimu')
    expect(antes.visited).toBe(false)

    await api.post(`/restaurants/res-chimu/visits`, {
      visitedAt: new Date().toISOString(),
      rating: 5,
      notes: 'Finalmente fomos.',
    })

    const depois = await api.get<RestaurantDetail>('/restaurants/res-chimu')
    expect(depois.visited).toBe(true)
    expect(depois.visitCount).toBe(1)
    expect(depois.averageRating).toBe(5)
    expect(depois.visits[0].notes).toBe('Finalmente fomos.')
  })

  it('recusa nota fora de 1..5', async () => {
    await expect(
      api.post('/restaurants/res-chimu/visits', {
        visitedAt: new Date().toISOString(),
        rating: 9,
      }),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 400,
    )
  })

  it('lista em ordem da mais recente para a mais antiga', async () => {
    const detalhe = await api.get<RestaurantDetail>('/restaurants/res-zaatar')
    const datas = detalhe.visits.map((visit) => visit.visitedAt)
    expect([...datas].sort().reverse()).toEqual(datas)
  })
})

describe('tipos de cozinha', () => {
  it('conta quantos restaurantes usam cada um', async () => {
    const lista = await api.get<{ id: string; _count: { restaurants: number } }[]>(
      '/cuisine-types',
    )
    const japonesa = lista.find((item) => item.id === 'cui-japonesa')!
    expect(japonesa._count.restaurants).toBe(2)
  })

  it('recusa nome repetido', async () => {
    await expect(api.post('/cuisine-types', { name: 'japonesa' })).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 409,
    )
  })

  it('remover desvincula dos restaurantes em vez de quebrá-los', async () => {
    await api.delete('/cuisine-types/cui-japonesa')

    const detalhe = await api.get<RestaurantDetail>('/restaurants/res-aizomae')
    expect(detalhe.cuisineTypes).toEqual([])
  })
})

describe('baseUrl', () => {
  it('é o mesmo que os handlers registram', () => {
    // Se o cliente e o mock divergirem, nada é interceptado — e o sintoma
    // seria a demonstração tentar alcançar a rede de verdade.
    expect(baseUrl).toBe('http://localhost:3000')
  })
})
