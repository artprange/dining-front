import type { CuisineType, Restaurant, Tag, Visit } from '../api/types'
import { seedCuisineTypes, seedRestaurants, seedTags, seedVisits } from './seed'

const STORAGE_KEY = 'dining-demo-db'

export interface Database {
  cuisineTypes: CuisineType[]
  tags: Tag[]
  restaurants: Restaurant[]
  visits: Visit[]
}

function seeded(): Database {
  // Cópia profunda: o seed é módulo compartilhado e não pode ser mutado,
  // senão "recomeçar" devolveria o estado já alterado.
  return structuredClone({
    cuisineTypes: seedCuisineTypes,
    tags: seedTags,
    restaurants: seedRestaurants,
    visits: seedVisits,
  })
}

function load(): Database {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return seeded()

    const parsed = JSON.parse(stored) as Partial<Database>

    // Validação rasa de propósito: o objetivo é só não quebrar a demo se o
    // formato mudar entre deploys. Qualquer coisa estranha, recomeça.
    if (!Array.isArray(parsed.restaurants) || !Array.isArray(parsed.visits)) {
      return seeded()
    }

    return {
      cuisineTypes: parsed.cuisineTypes ?? [],
      tags: parsed.tags ?? [],
      restaurants: parsed.restaurants,
      visits: parsed.visits,
    }
  } catch {
    // JSON corrompido, ou localStorage bloqueado (janela anônima).
    return seeded()
  }
}

export const db: Database = load()

export function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem persistência a demo ainda funciona, só não sobrevive ao reload.
  }
}

/** Devolve tudo ao catálogo inicial. Exposto na tela de ajustes. */
export function resetDatabase(): void {
  const fresh = seeded()
  db.cuisineTypes = fresh.cuisineTypes
  db.tags = fresh.tags
  db.restaurants = fresh.restaurants
  db.visits = fresh.visits
  persist()
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
