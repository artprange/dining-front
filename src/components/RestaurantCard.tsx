import { Link } from '@tanstack/react-router'
import type { RestaurantWithSummary, Suggestion } from '@/api/types'
import { Card, Chip } from './ui'
import { PRICE_RANGE_SYMBOLS, formatRating, formatSince } from '@/lib/format'

function isSuggestion(item: RestaurantWithSummary): item is Suggestion {
  return 'reasons' in item
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantWithSummary }) {
  const place = [restaurant.neighborhood, restaurant.city].filter(Boolean).join(', ')

  return (
    <Card>
      <Link
        to="/restaurants/$id"
        params={{ id: restaurant.id }}
        className="block active:opacity-70"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{restaurant.name}</h2>
            <p className="mt-0.5 truncate text-sm text-muted">
              {restaurant.cuisineTypes.map((cuisine) => cuisine.name).join(' · ') ||
                'Sem culinária'}
              {place && ` — ${place}`}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg leading-none font-semibold">
              {formatRating(restaurant.averageRating)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {restaurant.visitCount === 0
                ? 'sem nota'
                : `${restaurant.visitCount} visita(s)`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {!restaurant.visited && <Chip tone="brand">nunca fomos</Chip>}
          {restaurant.wouldReturn === true && <Chip tone="positive">voltaria</Chip>}
          {restaurant.wouldReturn === false && <Chip tone="negative">não voltaria</Chip>}
          {restaurant.priceRange && <Chip>{PRICE_RANGE_SYMBOLS[restaurant.priceRange]}</Chip>}
          {restaurant.visited && <Chip>última: {formatSince(restaurant.lastVisitedAt)}</Chip>}
          {restaurant.tags.map((tag) => (
            <Chip key={tag.id}>{tag.name}</Chip>
          ))}
        </div>

        {isSuggestion(restaurant) && restaurant.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
            {restaurant.reasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        )}
      </Link>
    </Card>
  )
}
