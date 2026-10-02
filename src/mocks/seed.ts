import type { CuisineType, Restaurant, Tag, Visit } from '../api/types'

/**
 * Catálogo inicial da demonstração. Serve para a tela não abrir vazia e,
 * principalmente, para o "vamos aonde?" ter o que pontuar — sem histórico de
 * visitas a sugestão não tem como ser interessante.
 */

const now = new Date()

/** Data ISO de `daysAgo` dias atrás, para o histórico parecer real. */
function daysAgo(days: number): string {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

const CREATED = daysAgo(120)

function cuisine(id: string, name: string): CuisineType {
  return { id, name, createdAt: CREATED, updatedAt: CREATED }
}

function tag(id: string, name: string): Tag {
  return { id, name, createdAt: CREATED, updatedAt: CREATED }
}

export const seedCuisineTypes: CuisineType[] = [
  cuisine('cui-japonesa', 'Japonesa'),
  cuisine('cui-italiana', 'Italiana'),
  cuisine('cui-brasileira', 'Brasileira'),
  cuisine('cui-arabe', 'Árabe'),
  cuisine('cui-peruana', 'Peruana'),
  cuisine('cui-hamburguer', 'Hambúrguer'),
]

export const seedTags: Tag[] = [
  tag('tag-rolezinho', 'Rolezinho'),
  tag('tag-ocasiao', 'Data especial'),
  tag('tag-delivery', 'Entrega boa'),
  tag('tag-vegetariano', 'Opção vegetariana'),
  tag('tag-barulhento', 'Barulhento'),
  tag('tag-ao-ar-livre', 'Mesa na calçada'),
]

type SeedRestaurant = Omit<Restaurant, 'createdAt' | 'updatedAt'> & {
  createdAt?: string
  updatedAt?: string
}

function restaurant(data: SeedRestaurant): Restaurant {
  return { createdAt: CREATED, updatedAt: CREATED, ...data }
}

const byId = (list: { id: string }[], ids: string[]) =>
  ids.map((id) => list.find((item) => item.id === id)!)

export const seedRestaurants: Restaurant[] = [
  restaurant({
    id: 'res-aizomae',
    name: 'Aizomê',
    cuisineTypes: byId(seedCuisineTypes, ['cui-japonesa']) as CuisineType[],
    tags: byId(seedTags, ['tag-ocasiao']) as Tag[],
    priceRange: 'EXPENSIVE',
    status: 'ACTIVE',
    wishlistPriority: 'NORMAL',
    address: 'Alameda Fernão Cardim, 39',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    notes: 'O omakase do balcão vale a espera.',
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-tantinho',
    name: 'Tantinho',
    cuisineTypes: byId(seedCuisineTypes, ['cui-japonesa']) as CuisineType[],
    tags: byId(seedTags, ['tag-rolezinho', 'tag-barulhento']) as Tag[],
    priceRange: 'MODERATE',
    status: 'ACTIVE',
    wishlistPriority: 'HIGH',
    address: 'Rua Fradique Coutinho, 1140',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    notes: 'Fila grande depois das 20h.',
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-bracos',
    name: 'Braço de Ferro',
    cuisineTypes: byId(seedCuisineTypes, ['cui-italiana']) as CuisineType[],
    tags: byId(seedTags, ['tag-ao-ar-livre', 'tag-vegetariano']) as Tag[],
    priceRange: 'MODERATE',
    status: 'ACTIVE',
    wishlistPriority: 'NORMAL',
    address: 'Rua Girassol, 88',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    notes: 'Cacio e pepe honesto.',
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-piraja',
    name: 'Pirajá',
    cuisineTypes: byId(seedCuisineTypes, ['cui-brasileira']) as CuisineType[],
    tags: byId(seedTags, ['tag-rolezinho', 'tag-barulhento']) as Tag[],
    priceRange: 'MODERATE',
    status: 'ACTIVE',
    wishlistPriority: 'LOW',
    address: 'Av. Brigadeiro Faria Lima, 64',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    notes: null,
    wouldReturn: false,
  }),
  restaurant({
    id: 'res-zaatar',
    name: "Za'atar",
    cuisineTypes: byId(seedCuisineTypes, ['cui-arabe']) as CuisineType[],
    tags: byId(seedTags, ['tag-vegetariano', 'tag-delivery']) as Tag[],
    priceRange: 'CHEAP',
    status: 'ACTIVE',
    wishlistPriority: 'NORMAL',
    address: 'Rua Augusta, 2120',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    notes: 'Entrega chega quente, o que já é raro.',
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-chimu',
    name: 'Chimu',
    cuisineTypes: byId(seedCuisineTypes, ['cui-peruana']) as CuisineType[],
    tags: byId(seedTags, ['tag-ocasiao']) as Tag[],
    priceRange: 'EXPENSIVE',
    status: 'ACTIVE',
    wishlistPriority: 'HIGH',
    address: 'Rua Oscar Freire, 540',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    notes: 'Indicação da Ana. Ainda não fomos.',
    wouldReturn: null,
  }),
  restaurant({
    id: 'res-bulls',
    name: 'Bullguer',
    cuisineTypes: byId(seedCuisineTypes, ['cui-hamburguer']) as CuisineType[],
    tags: byId(seedTags, ['tag-rolezinho', 'tag-delivery']) as Tag[],
    priceRange: 'CHEAP',
    status: 'ACTIVE',
    wishlistPriority: 'LOW',
    address: 'Rua Mourato Coelho, 1050',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    notes: null,
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-corrutela',
    name: 'Corrutela',
    cuisineTypes: byId(seedCuisineTypes, ['cui-brasileira']) as CuisineType[],
    tags: byId(seedTags, ['tag-vegetariano', 'tag-ocasiao']) as Tag[],
    priceRange: 'FINE_DINING',
    status: 'ACTIVE',
    wishlistPriority: 'HIGH',
    address: 'Rua Medeiros de Albuquerque, 256',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    notes: 'Menu degustação. Reservar com antecedência.',
    wouldReturn: null,
  }),
  restaurant({
    id: 'res-paribar',
    name: 'Paribar',
    cuisineTypes: byId(seedCuisineTypes, ['cui-brasileira']) as CuisineType[],
    tags: byId(seedTags, ['tag-ao-ar-livre']) as Tag[],
    priceRange: 'MODERATE',
    status: 'ACTIVE',
    wishlistPriority: 'LOW',
    address: 'Praça Dom José Gaspar, 42',
    neighborhood: 'República',
    city: 'São Paulo',
    notes: null,
    wouldReturn: true,
  }),
  restaurant({
    id: 'res-antigo',
    name: 'Cantina do Bairro',
    cuisineTypes: byId(seedCuisineTypes, ['cui-italiana']) as CuisineType[],
    tags: [],
    priceRange: 'CHEAP',
    status: 'ARCHIVED',
    wishlistPriority: 'LOW',
    address: null,
    neighborhood: 'Perdizes',
    city: 'São Paulo',
    notes: 'Fechou em 2024.',
    wouldReturn: false,
  }),
]

function visit(
  id: string,
  restaurantId: string,
  days: number,
  rating: number,
  notes: string | null,
): Visit {
  const visitedAt = daysAgo(days)
  return {
    id,
    restaurantId,
    visitedAt,
    rating,
    notes,
    createdAt: visitedAt,
    updatedAt: visitedAt,
  }
}

export const seedVisits: Visit[] = [
  visit('vis-1', 'res-aizomae', 95, 5, 'Melhor refeição do ano.'),
  visit('vis-2', 'res-tantinho', 60, 4, null),
  visit('vis-3', 'res-tantinho', 18, 5, 'Pedimos o lámen do dia.'),
  visit('vis-4', 'res-bracos', 40, 4, 'Massa no ponto.'),
  visit('vis-5', 'res-bracos', 8, 3, 'Demorou demais para sair.'),
  visit('vis-6', 'res-piraja', 150, 3, null),
  visit('vis-7', 'res-zaatar', 25, 5, 'Pedimos entrega duas vezes na semana.'),
  visit('vis-8', 'res-zaatar', 5, 4, null),
  visit('vis-9', 'res-bulls', 70, 4, null),
  visit('vis-10', 'res-paribar', 200, 3, 'Fomos só pelo chope.'),
]
