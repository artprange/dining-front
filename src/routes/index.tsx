import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { cuisineTypesQuery, suggestionQuery } from '@/api/queries'
import type { PriceRange, Suggestion, SuggestionFilters } from '@/api/types'
import { errorMessage } from '@/api/client'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Button, Card, EmptyState, ErrorState, Screen, Spinner } from '@/components/ui'
import { ChipSelect, Field, Toggle } from '@/components/form'
import { PRICE_RANGES, PRICE_RANGE_LABELS } from '@/lib/format'

export const Route = createFileRoute('/')({ component: SuggestionScreen })

interface Draft {
  cuisineTypeIds: string[]
  priceRanges: PriceRange[]
  onlyNotVisited: boolean
  onlyWouldReturn: boolean
}

const EMPTY_DRAFT: Draft = {
  cuisineTypeIds: [],
  priceRanges: [],
  onlyNotVisited: false,
  onlyWouldReturn: false,
}

function SuggestionScreen() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [asked, setAsked] = useState<{ filters: SuggestionFilters; nonce: number } | null>(null)

  const cuisineTypes = useQuery(cuisineTypesQuery())

  const suggestions = useQuery({
    ...suggestionQuery(asked?.filters ?? {}, asked?.nonce ?? 0),
    enabled: asked !== null,
  })

  function ask(strategy: 'RANKED' | 'RANDOM') {
    setAsked({
      filters: {
        strategy,
        limit: 3,
        // Filtro vazio não vira parâmetro: o back trata ausência como "tudo".
        ...(draft.cuisineTypeIds.length > 0 && { cuisineTypeIds: draft.cuisineTypeIds }),
        ...(draft.priceRanges.length > 0 && { priceRanges: draft.priceRanges }),
        ...(draft.onlyNotVisited && { onlyNotVisited: true }),
        ...(draft.onlyWouldReturn && { onlyWouldReturn: true }),
      },
      // Data como nonce: dois cliques seguidos nunca caem na mesma chave.
      nonce: Date.now(),
    })
  }

  return (
    <Screen title="Vamos aonde?" subtitle="Filtra o que der na telha e deixa o app decidir.">
      <Card className="mb-4 space-y-4">
        <Field label="Culinária">
          <ChipSelect
            options={(cuisineTypes.data ?? []).map((cuisine) => ({
              value: cuisine.id,
              label: cuisine.name,
            }))}
            selected={draft.cuisineTypeIds}
            onChange={(cuisineTypeIds) => setDraft({ ...draft, cuisineTypeIds })}
            emptyLabel="Nenhuma culinária cadastrada — dá para criar em Ajustes."
          />
        </Field>

        <Field label="Faixa de preço">
          <ChipSelect
            options={PRICE_RANGES.map((range) => ({
              value: range,
              label: PRICE_RANGE_LABELS[range],
            }))}
            selected={draft.priceRanges}
            onChange={(priceRanges) =>
              setDraft({ ...draft, priceRanges: priceRanges as PriceRange[] })
            }
          />
        </Field>

        <div>
          <Toggle
            label="Só lugares onde a gente nunca foi"
            checked={draft.onlyNotVisited}
            onChange={(onlyNotVisited) => setDraft({ ...draft, onlyNotVisited })}
          />
          <Toggle
            label="Só lugares onde a gente voltaria"
            checked={draft.onlyWouldReturn}
            onChange={(onlyWouldReturn) => setDraft({ ...draft, onlyWouldReturn })}
          />
        </div>

        <div className="flex gap-2">
          <Button block onClick={() => ask('RANKED')}>
            Me dá 3 opções
          </Button>
          <Button variant="secondary" onClick={() => ask('RANDOM')}>
            Sortear
          </Button>
        </div>
      </Card>

      <Results
        asked={asked !== null}
        isPending={suggestions.isPending}
        error={suggestions.error}
        data={suggestions.data}
        onRetry={() => void suggestions.refetch()}
      />
    </Screen>
  )
}

function Results({
  asked,
  isPending,
  error,
  data,
  onRetry,
}: {
  asked: boolean
  isPending: boolean
  error: unknown
  data: Suggestion[] | undefined
  onRetry: () => void
}) {
  if (!asked) {
    return (
      <EmptyState
        title="Nada decidido ainda"
        description="Escolhe os filtros ali em cima e pede uma sugestão."
      />
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={onRetry} />

  if (isPending || !data) return <Spinner />

  if (data.length === 0) {
    return (
      <EmptyState
        title="Nenhum lugar passou no filtro"
        description="Ou o filtro está apertado demais, ou falta cadastrar lugares."
        action={
          <Link to="/restaurants/new">
            <Button variant="secondary">Cadastrar um lugar</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((suggestion) => (
        <RestaurantCard key={suggestion.id} restaurant={suggestion} />
      ))}
    </div>
  )
}
