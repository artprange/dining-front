import type { components, operations } from './schema'

type Schemas = components['schemas']

/* ------------------------------------------------------------------ *
 * Entrada — gerado a partir do Swagger (`npm run api:types`).
 * Nada aqui é escrito à mão: se o back mudar um DTO, o `tsc` acusa.
 * ------------------------------------------------------------------ */

export type CreateCuisineTypeInput = Schemas['CreateCuisineTypeDto']
export type UpdateCuisineTypeInput = Schemas['UpdateCuisineTypeDto']
export type CreateTagInput = Schemas['CreateTagDto']
export type UpdateTagInput = Schemas['UpdateTagDto']
/**
 * `status` e `wishlistPriority` são `@IsOptional()` no back, mas têm `default`
 * no `@ApiPropertyOptional`, e o openapi-typescript transforma todo campo com
 * default em obrigatório. Sem este ajuste o TS exigiria mandar os dois em todo
 * PATCH — inclusive num que só quer virar o `wouldReturn`.
 */
type Optionalize<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type CreateRestaurantInput = Optionalize<
  Schemas['CreateRestaurantDto'],
  'status' | 'wishlistPriority'
>
export type UpdateRestaurantInput = Partial<Schemas['UpdateRestaurantDto']>
export type CreateVisitInput = Schemas['CreateVisitDto']
export type UpdateVisitInput = Schemas['UpdateVisitDto']

export type RestaurantFilters = NonNullable<
  operations['RestaurantController_findAll']['parameters']['query']
>

export type SuggestionFilters = NonNullable<
  operations['RestaurantController_suggest']['parameters']['query']
>

export type PriceRange = NonNullable<CreateRestaurantInput['priceRange']>
export type RestaurantStatus = NonNullable<CreateRestaurantInput['status']>
export type WishlistPriority = NonNullable<CreateRestaurantInput['wishlistPriority']>
export type SuggestionStrategy = NonNullable<SuggestionFilters['strategy']>

/* ------------------------------------------------------------------ *
 * Saida — ESCRITO A MAO, e nao deveria ser.
 *
 * O back não declara os tipos de resposta no Swagger: os controllers
 * devolvem o retorno do Prisma direto, então todo `responses.200` do
 * schema gerado vem como `content?: never`. Ou seja, o Swagger tipa o
 * que a gente MANDA, mas não o que a gente RECEBE — que é justamente a
 * metade que a tela usa para renderizar.
 *
 * O conserto certo é no back: DTOs de resposta + `@ApiOkResponse({ type })`
 * nos controllers. Enquanto isso não acontece, estes tipos espelham o
 * retorno do Prisma à mão e podem silenciosamente desatualizar.
 *
 * Datas chegam como string ISO (JSON), não como Date.
 * ------------------------------------------------------------------ */

export interface CuisineType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * As listagens (`GET`) trazem quantos restaurantes usam o registro; o retorno
 * do POST/PATCH não traz. Serve para avisar antes de remover algo em uso.
 */
export interface WithUsage {
  _count: { restaurants: number }
}

export interface Visit {
  id: string
  restaurantId: string
  visitedAt: string
  rating: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** O que `POST`/`PATCH /restaurants` devolvem: sem o resumo de visitas. */
export interface Restaurant {
  id: string
  name: string
  cuisineTypes: CuisineType[]
  tags: Tag[]
  priceRange: PriceRange | null
  status: RestaurantStatus
  wishlistPriority: WishlistPriority
  address: string | null
  neighborhood: string | null
  city: string | null
  notes: string | null
  wouldReturn: boolean | null
  createdAt: string
  updatedAt: string
}

/** O que `GET /restaurants` devolve: o restaurante mais os agregados de visita. */
export interface RestaurantWithSummary extends Restaurant {
  visited: boolean
  visitCount: number
  averageRating: number | null
  lastVisitedAt: string | null
}

/** `GET /restaurants/:id` — o mesmo, mais o histórico completo. */
export interface RestaurantDetail extends RestaurantWithSummary {
  visits: Visit[]
}

/** `GET /restaurants/suggestion` — o resumo mais o resultado da heurística. */
export interface Suggestion extends RestaurantWithSummary {
  score: number
  reasons: string[]
}
