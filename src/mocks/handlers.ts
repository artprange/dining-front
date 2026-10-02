import { HttpResponse, http } from 'msw'

import { baseUrl } from '../api/client'
import type {
  CreateRestaurantInput,
  CreateVisitInput,
  CuisineType,
  Restaurant,
  Tag,
  UpdateRestaurantInput,
  UpdateVisitInput,
  Visit,
} from '../api/types'
import { db, newId, nowIso, persist } from './db'
import { applyFilters, rankSuggestions, visitsOf, withSummary } from './logic'

/** Atraso curto para os estados de carregamento aparecerem de verdade. */
const LATENCY_MS = 180

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

/** Mesmo formato de erro do Nest, para o client.ts montar o ApiError igual. */
function problem(status: number, message: string | string[]) {
  return HttpResponse.json({ statusCode: status, message }, { status })
}

const notFound = (what: string) => problem(404, `${what} não encontrado.`)

function readFilters(request: Request) {
  const params = new URL(request.url).searchParams
  const list = (key: string) => params.getAll(key)
  const flag = (key: string) => params.get(key) === 'true'

  return {
    search: params.get('search') ?? undefined,
    cuisineTypeIds: list('cuisineTypeIds'),
    tagIds: list('tagIds'),
    priceRanges: list('priceRanges') as never,
    city: params.get('city') ?? undefined,
    neighborhood: params.get('neighborhood') ?? undefined,
    status: (params.get('status') ?? undefined) as never,
    onlyWouldReturn: flag('onlyWouldReturn'),
    onlyNotVisited: flag('onlyNotVisited'),
  }
}

/** Resolve os ids que o formulário manda para os objetos completos. */
function resolveRelations(body: Partial<CreateRestaurantInput>) {
  const cuisineTypes = (body.cuisineTypeIds ?? [])
    .map((id) => db.cuisineTypes.find((item) => item.id === id))
    .filter((item): item is CuisineType => Boolean(item))

  const tags = (body.tagIds ?? [])
    .map((id) => db.tags.find((item) => item.id === id))
    .filter((item): item is Tag => Boolean(item))

  return { cuisineTypes, tags }
}

export const handlers = [
  /* ---------------------------------------------------------------- *
   * Tipos de cozinha e marcadores
   * ---------------------------------------------------------------- */

  http.get(`${baseUrl}/cuisine-types`, async () => {
    await delay()
    return HttpResponse.json(
      db.cuisineTypes.map((item) => ({
        ...item,
        _count: {
          restaurants: db.restaurants.filter((restaurant) =>
            restaurant.cuisineTypes.some((cuisine) => cuisine.id === item.id),
          ).length,
        },
      })),
    )
  }),

  http.post(`${baseUrl}/cuisine-types`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as { name?: string }
    const name = body.name?.trim()

    if (!name) return problem(400, ['name should not be empty'])
    if (db.cuisineTypes.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return problem(409, `Já existe um tipo chamado "${name}".`)
    }

    const created: CuisineType = {
      id: newId('cui'),
      name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    db.cuisineTypes.push(created)
    persist()
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${baseUrl}/cuisine-types/:id`, async ({ params, request }) => {
    await delay()
    const item = db.cuisineTypes.find((entry) => entry.id === params.id)
    if (!item) return notFound('Tipo de cozinha')

    const body = (await request.json()) as { name?: string }
    if (body.name !== undefined) {
      if (!body.name.trim()) return problem(400, ['name should not be empty'])
      item.name = body.name.trim()
    }
    item.updatedAt = nowIso()
    persist()
    return HttpResponse.json(item)
  }),

  http.delete(`${baseUrl}/cuisine-types/:id`, async ({ params }) => {
    await delay()
    const index = db.cuisineTypes.findIndex((entry) => entry.id === params.id)
    if (index < 0) return notFound('Tipo de cozinha')

    db.cuisineTypes.splice(index, 1)
    // Desvincula dos restaurantes: a tela avisa quantos usam antes de remover,
    // então remover é permitido e o vínculo é que some.
    for (const restaurant of db.restaurants) {
      restaurant.cuisineTypes = restaurant.cuisineTypes.filter(
        (cuisine) => cuisine.id !== params.id,
      )
    }
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${baseUrl}/tags`, async () => {
    await delay()
    return HttpResponse.json(
      db.tags.map((item) => ({
        ...item,
        _count: {
          restaurants: db.restaurants.filter((restaurant) =>
            restaurant.tags.some((tag) => tag.id === item.id),
          ).length,
        },
      })),
    )
  }),

  http.post(`${baseUrl}/tags`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as { name?: string }
    const name = body.name?.trim()

    if (!name) return problem(400, ['name should not be empty'])
    if (db.tags.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return problem(409, `Já existe um marcador chamado "${name}".`)
    }

    const created: Tag = { id: newId('tag'), name, createdAt: nowIso(), updatedAt: nowIso() }
    db.tags.push(created)
    persist()
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${baseUrl}/tags/:id`, async ({ params, request }) => {
    await delay()
    const item = db.tags.find((entry) => entry.id === params.id)
    if (!item) return notFound('Marcador')

    const body = (await request.json()) as { name?: string }
    if (body.name !== undefined) {
      if (!body.name.trim()) return problem(400, ['name should not be empty'])
      item.name = body.name.trim()
    }
    item.updatedAt = nowIso()
    persist()
    return HttpResponse.json(item)
  }),

  http.delete(`${baseUrl}/tags/:id`, async ({ params }) => {
    await delay()
    const index = db.tags.findIndex((entry) => entry.id === params.id)
    if (index < 0) return notFound('Marcador')

    db.tags.splice(index, 1)
    for (const restaurant of db.restaurants) {
      restaurant.tags = restaurant.tags.filter((tag) => tag.id !== params.id)
    }
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  /* ---------------------------------------------------------------- *
   * Restaurantes
   *
   * A rota de sugestão vem antes de `/:id`: registrada depois, o `:id`
   * casaria com "suggestion" e engoliria a chamada.
   * ---------------------------------------------------------------- */

  http.get(`${baseUrl}/restaurants/suggestion`, async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const strategy = (params.get('strategy') ?? 'RANKED') as 'RANKED' | 'RANDOM'
    const limit = Number(params.get('limit')) || 3

    const candidates = applyFilters(db.restaurants.map(withSummary), readFilters(request))
    return HttpResponse.json(rankSuggestions(candidates, strategy, limit))
  }),

  http.get(`${baseUrl}/restaurants`, async ({ request }) => {
    await delay()
    const list = applyFilters(db.restaurants.map(withSummary), readFilters(request))
    return HttpResponse.json(
      [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    )
  }),

  http.get(`${baseUrl}/restaurants/:id`, async ({ params }) => {
    await delay()
    const restaurant = db.restaurants.find((item) => item.id === params.id)
    if (!restaurant) return notFound('Restaurante')

    return HttpResponse.json({
      ...withSummary(restaurant),
      visits: visitsOf(restaurant.id),
    })
  }),

  http.post(`${baseUrl}/restaurants`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as CreateRestaurantInput
    const name = body.name?.trim()

    if (!name) return problem(400, ['name should not be empty'])

    const { cuisineTypes, tags } = resolveRelations(body)

    const created: Restaurant = {
      id: newId('res'),
      name,
      cuisineTypes,
      tags,
      priceRange: body.priceRange ?? null,
      status: body.status ?? 'ACTIVE',
      wishlistPriority: body.wishlistPriority ?? 'NORMAL',
      address: body.address ?? null,
      neighborhood: body.neighborhood ?? null,
      city: body.city ?? null,
      notes: body.notes ?? null,
      wouldReturn: body.wouldReturn ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    db.restaurants.push(created)
    persist()
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${baseUrl}/restaurants/:id`, async ({ params, request }) => {
    await delay()
    const restaurant = db.restaurants.find((item) => item.id === params.id)
    if (!restaurant) return notFound('Restaurante')

    const body = (await request.json()) as UpdateRestaurantInput

    if (body.name !== undefined) {
      if (!body.name.trim()) return problem(400, ['name should not be empty'])
      restaurant.name = body.name.trim()
    }

    if (body.cuisineTypeIds !== undefined || body.tagIds !== undefined) {
      const relations = resolveRelations(body)
      if (body.cuisineTypeIds !== undefined) restaurant.cuisineTypes = relations.cuisineTypes
      if (body.tagIds !== undefined) restaurant.tags = relations.tags
    }

    for (const key of [
      'priceRange',
      'status',
      'wishlistPriority',
      'address',
      'neighborhood',
      'city',
      'notes',
      'wouldReturn',
    ] as const) {
      if (body[key] !== undefined) {
        // A asserção é estreita de propósito: a lista acima só tem chaves que
        // existem nos dois tipos e com o mesmo formato.
        Object.assign(restaurant, { [key]: body[key] })
      }
    }

    restaurant.updatedAt = nowIso()
    persist()
    return HttpResponse.json(restaurant)
  }),

  http.delete(`${baseUrl}/restaurants/:id`, async ({ params }) => {
    await delay()
    const index = db.restaurants.findIndex((item) => item.id === params.id)
    if (index < 0) return notFound('Restaurante')

    db.restaurants.splice(index, 1)
    // A tela avisa que apaga "todo o histórico"; as visitas vão junto.
    db.visits = db.visits.filter((visit) => visit.restaurantId !== params.id)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  /* ---------------------------------------------------------------- *
   * Visitas
   * ---------------------------------------------------------------- */

  http.get(`${baseUrl}/restaurants/:id/visits`, async ({ params }) => {
    await delay()
    if (!db.restaurants.some((item) => item.id === params.id)) {
      return notFound('Restaurante')
    }
    return HttpResponse.json(visitsOf(String(params.id)))
  }),

  http.post(`${baseUrl}/restaurants/:id/visits`, async ({ params, request }) => {
    await delay()
    if (!db.restaurants.some((item) => item.id === params.id)) {
      return notFound('Restaurante')
    }

    const body = (await request.json()) as CreateVisitInput
    const problems: string[] = []

    if (!body.visitedAt) problems.push('visitedAt should not be empty')
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      problems.push('rating must not be less than 1 and not greater than 5')
    }
    if (problems.length) return problem(400, problems)

    const created: Visit = {
      id: newId('vis'),
      restaurantId: String(params.id),
      visitedAt: new Date(body.visitedAt).toISOString(),
      rating: body.rating,
      notes: body.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    db.visits.push(created)
    persist()
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${baseUrl}/restaurants/:id/visits/:visitId`, async ({ params, request }) => {
    await delay()
    const visit = db.visits.find(
      (item) => item.id === params.visitId && item.restaurantId === params.id,
    )
    if (!visit) return notFound('Visita')

    const body = (await request.json()) as UpdateVisitInput

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) {
        return problem(400, ['rating must not be less than 1 and not greater than 5'])
      }
      visit.rating = body.rating
    }
    if (body.visitedAt !== undefined) {
      visit.visitedAt = new Date(body.visitedAt).toISOString()
    }
    if (body.notes !== undefined) visit.notes = body.notes ?? null

    visit.updatedAt = nowIso()
    persist()
    return HttpResponse.json(visit)
  }),

  http.delete(`${baseUrl}/restaurants/:id/visits/:visitId`, async ({ params }) => {
    await delay()
    const index = db.visits.findIndex(
      (item) => item.id === params.visitId && item.restaurantId === params.id,
    )
    if (index < 0) return notFound('Visita')

    db.visits.splice(index, 1)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]
