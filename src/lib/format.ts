import type { PriceRange, WishlistPriority } from '@/api/types'

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  CHEAP: 'Barato',
  MODERATE: 'Moderado',
  EXPENSIVE: 'Caro',
  FINE_DINING: 'Alta gastronomia',
}

export const PRICE_RANGE_SYMBOLS: Record<PriceRange, string> = {
  CHEAP: '$',
  MODERATE: '$$',
  EXPENSIVE: '$$$',
  FINE_DINING: '$$$$',
}

export const WISHLIST_PRIORITY_LABELS: Record<WishlistPriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
}

export const PRICE_RANGES = Object.keys(PRICE_RANGE_LABELS) as PriceRange[]
export const WISHLIST_PRIORITIES = Object.keys(
  WISHLIST_PRIORITY_LABELS,
) as WishlistPriority[]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string | null): string {
  if (!iso) return '—'

  return dateFormatter.format(new Date(iso))
}

export function formatRating(rating: number | null): string {
  if (rating === null) return '—'

  return rating.toFixed(1).replace('.', ',')
}

/** "há 12 dias", para dar a noção de "faz tempo que a gente não vai". */
export function formatSince(iso: string | null): string {
  if (!iso) return 'nunca'

  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  if (days < 365) return `há ${Math.floor(days / 30)} meses`

  return `há ${Math.floor(days / 365)} ano(s)`
}

/** `<input type="date">` fala 'YYYY-MM-DD'; a API fala ISO completo. */
export function todayAsInputDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000

  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/**
 * Sem hora informada, assume jantar — é o caso de uso do app. Mas registrar a
 * visita de hoje às 15h não pode virar 20h: o back valida `MaxDate(now)` e
 * recusaria a data no futuro. Nesse caso vale "agora".
 */
export function inputDateToIso(value: string): string {
  const assumedDinner = new Date(`${value}T20:00:00`)
  const now = new Date()

  return (assumedDinner > now ? now : assumedDinner).toISOString()
}
