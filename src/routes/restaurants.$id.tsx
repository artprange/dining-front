import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '@/api/client'
import { mutations, queryKeys, restaurantQuery } from '@/api/queries'
import type { CreateVisitInput, RestaurantDetail } from '@/api/types'
import { Field, Input, RatingInput, Textarea } from '@/components/form'
import { Button, Card, Chip, ErrorState, Screen, Spinner } from '@/components/ui'
import {
  PRICE_RANGE_LABELS,
  WISHLIST_PRIORITY_LABELS,
  formatDate,
  formatRating,
  formatSince,
  inputDateToIso,
  todayAsInputDate,
} from '@/lib/format'

export const Route = createFileRoute('/restaurants/$id')({ component: RestaurantDetailScreen })

function RestaurantDetailScreen() {
  const { id } = Route.useParams()
  const restaurant = useQuery(restaurantQuery(id))

  if (restaurant.isError) {
    return (
      <Screen title="Lugar">
        <ErrorState
          message={errorMessage(restaurant.error)}
          onRetry={() => void restaurant.refetch()}
        />
      </Screen>
    )
  }

  if (restaurant.isPending) {
    return (
      <Screen title="Lugar">
        <Spinner />
      </Screen>
    )
  }

  return <Detail restaurant={restaurant.data} />
}

function Detail({ restaurant }: { restaurant: RestaurantDetail }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const place = [restaurant.neighborhood, restaurant.city].filter(Boolean).join(', ')

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.restaurants })
  }

  const setWouldReturn = useMutation({
    mutationFn: (wouldReturn: boolean) =>
      mutations.updateRestaurant(restaurant.id, { wouldReturn }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: () => mutations.removeRestaurant(restaurant.id),
    onSuccess: async () => {
      await refresh()
      await navigate({ to: '/restaurants' })
    },
  })

  return (
    <Screen title={restaurant.name} subtitle={place || undefined}>
      <Card className="mb-4">
        <div className="flex flex-wrap gap-1.5">
          {restaurant.cuisineTypes.map((cuisine) => (
            <Chip key={cuisine.id} tone="brand">
              {cuisine.name}
            </Chip>
          ))}
          {restaurant.tags.map((tag) => (
            <Chip key={tag.id}>{tag.name}</Chip>
          ))}
          {restaurant.priceRange && <Chip>{PRICE_RANGE_LABELS[restaurant.priceRange]}</Chip>}
          <Chip>vontade: {WISHLIST_PRIORITY_LABELS[restaurant.wishlistPriority]}</Chip>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
          <div>
            <dt className="text-xs text-muted">Nota média</dt>
            <dd className="text-lg font-semibold">{formatRating(restaurant.averageRating)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Visitas</dt>
            <dd className="text-lg font-semibold">{restaurant.visitCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Última</dt>
            <dd className="text-lg font-semibold">{formatSince(restaurant.lastVisitedAt)}</dd>
          </div>
        </dl>

        {restaurant.address && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{restaurant.address}</p>
        )}
        {restaurant.notes && <p className="mt-2 text-sm">{restaurant.notes}</p>}
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-sm font-medium">Vocês voltariam?</p>
        <div className="flex gap-2">
          <Button
            variant={restaurant.wouldReturn === true ? 'primary' : 'secondary'}
            disabled={setWouldReturn.isPending}
            onClick={() => setWouldReturn.mutate(true)}
          >
            Voltaria
          </Button>
          <Button
            variant={restaurant.wouldReturn === false ? 'primary' : 'secondary'}
            disabled={setWouldReturn.isPending}
            onClick={() => setWouldReturn.mutate(false)}
          >
            Não voltaria
          </Button>
        </div>
        {setWouldReturn.isError && (
          <p className="mt-2 text-sm text-red-700">{errorMessage(setWouldReturn.error)}</p>
        )}
      </Card>

      <NewVisitForm restaurantId={restaurant.id} onSaved={refresh} />

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium">Histórico</h2>
        {restaurant.visits.length === 0 ? (
          <p className="text-sm text-muted">Vocês ainda não registraram nenhuma visita.</p>
        ) : (
          <ul className="space-y-2">
            {restaurant.visits.map((visit) => (
              <li key={visit.id}>
                <Card>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{formatDate(visit.visitedAt)}</span>
                    <span className="text-sm">{'★'.repeat(visit.rating)}</span>
                  </div>
                  {visit.notes && <p className="mt-1 text-sm text-muted">{visit.notes}</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Button
          variant="danger"
          block
          disabled={remove.isPending}
          onClick={() => {
            if (confirm(`Apagar "${restaurant.name}" e todo o histórico?`)) remove.mutate()
          }}
        >
          Apagar este lugar
        </Button>
        {remove.isError && (
          <p className="mt-2 text-sm text-red-700">{errorMessage(remove.error)}</p>
        )}
      </div>
    </Screen>
  )
}

function NewVisitForm({
  restaurantId,
  onSaved,
}: {
  restaurantId: string
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [visitedAt, setVisitedAt] = useState(todayAsInputDate())
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')

  const create = useMutation({
    mutationFn: (body: CreateVisitInput) => mutations.createVisit(restaurantId, body),
    onSuccess: async () => {
      await onSaved()
      setOpen(false)
      setNotes('')
      setRating(4)
      setVisitedAt(todayAsInputDate())
    },
  })

  if (!open) {
    return (
      <Button block variant="secondary" onClick={() => setOpen(true)}>
        Registrar visita
      </Button>
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    create.mutate({
      visitedAt: inputDateToIso(visitedAt),
      rating,
      ...(notes.trim() && { notes: notes.trim() }),
    })
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Quando">
          <Input
            type="date"
            value={visitedAt}
            max={todayAsInputDate()}
            onChange={(event) => setVisitedAt(event.target.value)}
          />
        </Field>

        <Field label="Nota">
          <RatingInput value={rating} onChange={setRating} />
        </Field>

        <Field label="Observações">
          <Textarea
            value={notes}
            placeholder="O que valeu a pena pedir?"
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        {create.isError && <p className="text-sm text-red-700">{errorMessage(create.error)}</p>}

        <div className="flex gap-2">
          <Button type="submit" block disabled={create.isPending}>
            {create.isPending ? 'Salvando...' : 'Salvar visita'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
