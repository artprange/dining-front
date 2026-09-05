import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { errorMessage } from '@/api/client'
import { restaurantsQuery } from '@/api/queries'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Input } from '@/components/form'
import { Button, EmptyState, ErrorState, Screen, Spinner } from '@/components/ui'

export const Route = createFileRoute('/restaurants/')({ component: RestaurantListScreen })

function RestaurantListScreen() {
  const [term, setTerm] = useState('')
  const search = useDebounced(term, 300)

  const restaurants = useQuery(restaurantsQuery(search ? { search } : {}))

  return (
    <Screen
      title="Lugares"
      subtitle={
        restaurants.data ? `${restaurants.data.length} lugar(es) na lista` : 'Carregando...'
      }
      action={
        <Link to="/restaurants/new">
          <Button variant="secondary">Novo</Button>
        </Link>
      }
    >
      <div className="mb-4">
        <Input
          type="search"
          value={term}
          placeholder="Buscar pelo nome"
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>

      {restaurants.isError ? (
        <ErrorState
          message={errorMessage(restaurants.error)}
          onRetry={() => void restaurants.refetch()}
        />
      ) : restaurants.isPending ? (
        <Spinner />
      ) : restaurants.data.length === 0 ? (
        <EmptyState
          title={search ? 'Nada com esse nome' : 'A lista está vazia'}
          description={
            search
              ? 'Tenta outro pedaço do nome.'
              : 'Cadastra os lugares que vocês já conhecem e os que querem conhecer.'
          }
          action={
            search ? undefined : (
              <Link to="/restaurants/new">
                <Button>Cadastrar o primeiro</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {restaurants.data.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </Screen>
  )
}

/** Evita uma requisição por tecla digitada na busca. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
