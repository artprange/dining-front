import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type {
  CreateCuisineTypeInput,
  CreateRestaurantInput,
  CreateTagInput,
  CreateVisitInput,
  CuisineType,
  Restaurant,
  RestaurantDetail,
  RestaurantFilters,
  RestaurantWithSummary,
  Suggestion,
  SuggestionFilters,
  Tag,
  UpdateCuisineTypeInput,
  UpdateRestaurantInput,
  UpdateTagInput,
  UpdateVisitInput,
  Visit,
  WithUsage,
} from './types'

export const queryKeys = {
  cuisineTypes: ['cuisine-types'] as const,
  tags: ['tags'] as const,
  restaurants: ['restaurants'] as const,
  restaurantList: (filters: RestaurantFilters) =>
    ['restaurants', 'list', filters] as const,
  restaurant: (id: string) => ['restaurants', 'detail', id] as const,
  // O `nonce` existe para o RANDOM: sem ele, pedir "sorteia de novo" com o
  // mesmo filtro cairia no cache e devolveria a mesma sugestão.
  suggestion: (filters: SuggestionFilters, nonce: number) =>
    ['restaurants', 'suggestion', filters, nonce] as const,
  visits: (restaurantId: string) => ['restaurants', restaurantId, 'visits'] as const,
}

export const cuisineTypesQuery = () =>
  queryOptions({
    queryKey: queryKeys.cuisineTypes,
    queryFn: ({ signal }) =>
      api.get<(CuisineType & WithUsage)[]>('/cuisine-types', undefined, signal),
  })

export const tagsQuery = () =>
  queryOptions({
    queryKey: queryKeys.tags,
    queryFn: ({ signal }) => api.get<(Tag & WithUsage)[]>('/tags', undefined, signal),
  })

export const restaurantsQuery = (filters: RestaurantFilters = {}) =>
  queryOptions({
    queryKey: queryKeys.restaurantList(filters),
    queryFn: ({ signal }) =>
      api.get<RestaurantWithSummary[]>('/restaurants', filters, signal),
  })

export const restaurantQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.restaurant(id),
    queryFn: ({ signal }) => api.get<RestaurantDetail>(`/restaurants/${id}`, undefined, signal),
  })

export const suggestionQuery = (filters: SuggestionFilters, nonce = 0) =>
  queryOptions({
    queryKey: queryKeys.suggestion(filters, nonce),
    queryFn: ({ signal }) =>
      api.get<Suggestion[]>('/restaurants/suggestion', filters, signal),
    // Sortear de novo ao voltar para a aba tiraria a sugestão da tela.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

export const visitsQuery = (restaurantId: string) =>
  queryOptions({
    queryKey: queryKeys.visits(restaurantId),
    queryFn: ({ signal }) =>
      api.get<Visit[]>(`/restaurants/${restaurantId}/visits`, undefined, signal),
  })

export const mutations = {
  createCuisineType: (body: CreateCuisineTypeInput) =>
    api.post<CuisineType>('/cuisine-types', body),
  updateCuisineType: (id: string, body: UpdateCuisineTypeInput) =>
    api.patch<CuisineType>(`/cuisine-types/${id}`, body),
  removeCuisineType: (id: string) => api.delete(`/cuisine-types/${id}`),

  createTag: (body: CreateTagInput) => api.post<Tag>('/tags', body),
  updateTag: (id: string, body: UpdateTagInput) => api.patch<Tag>(`/tags/${id}`, body),
  removeTag: (id: string) => api.delete(`/tags/${id}`),

  createRestaurant: (body: CreateRestaurantInput) =>
    api.post<Restaurant>('/restaurants', body),
  updateRestaurant: (id: string, body: UpdateRestaurantInput) =>
    api.patch<Restaurant>(`/restaurants/${id}`, body),
  removeRestaurant: (id: string) => api.delete(`/restaurants/${id}`),

  createVisit: (restaurantId: string, body: CreateVisitInput) =>
    api.post<Visit>(`/restaurants/${restaurantId}/visits`, body),
  updateVisit: (restaurantId: string, id: string, body: UpdateVisitInput) =>
    api.patch<Visit>(`/restaurants/${restaurantId}/visits/${id}`, body),
  removeVisit: (restaurantId: string, id: string) =>
    api.delete(`/restaurants/${restaurantId}/visits/${id}`),
}
