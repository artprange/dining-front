import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '@/api/client'
import { cuisineTypesQuery, mutations, queryKeys, tagsQuery } from '@/api/queries'
import type { CreateRestaurantInput, PriceRange, WishlistPriority } from '@/api/types'
import { ChipSelect, Field, Input, Select, Textarea } from '@/components/form'
import { Button, Card, ErrorState, Screen } from '@/components/ui'
import {
  PRICE_RANGES,
  PRICE_RANGE_LABELS,
  WISHLIST_PRIORITIES,
  WISHLIST_PRIORITY_LABELS,
} from '@/lib/format'

export const Route = createFileRoute('/restaurants/new')({ component: NewRestaurantScreen })

function NewRestaurantScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const cuisineTypes = useQuery(cuisineTypesQuery())
  const tags = useQuery(tagsQuery())

  const [name, setName] = useState('')
  const [cuisineTypeIds, setCuisineTypeIds] = useState<string[]>([])
  const [tagIds, setTagIds] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<PriceRange | ''>('')
  const [wishlistPriority, setWishlistPriority] = useState<WishlistPriority>('NORMAL')
  const [address, setAddress] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  const create = useMutation({
    mutationFn: (body: CreateRestaurantInput) => mutations.createRestaurant(body),
    onSuccess: async (restaurant) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.restaurants })
      await navigate({ to: '/restaurants/$id', params: { id: restaurant.id } })
    },
  })

  const canSubmit = name.trim().length > 0 && cuisineTypeIds.length > 0

  function submit(event: FormEvent) {
    event.preventDefault()

    if (!canSubmit) return

    create.mutate({
      name: name.trim(),
      cuisineTypeIds,
      wishlistPriority,
      // Campo em branco não vira string vazia no banco.
      ...(tagIds.length > 0 && { tagIds }),
      ...(priceRange && { priceRange }),
      ...(address.trim() && { address: address.trim() }),
      ...(neighborhood.trim() && { neighborhood: neighborhood.trim() }),
      ...(city.trim() && { city: city.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    })
  }

  return (
    <Screen title="Novo lugar" subtitle="Só o nome e a culinária são obrigatórios.">
      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Nome">
            <Input
              value={name}
              autoFocus
              placeholder="Cantina do Bairro"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field label="Culinária" hint="Dá para marcar mais de uma.">
            <ChipSelect
              options={(cuisineTypes.data ?? []).map((cuisine) => ({
                value: cuisine.id,
                label: cuisine.name,
              }))}
              selected={cuisineTypeIds}
              onChange={setCuisineTypeIds}
              emptyLabel="Nenhuma culinária cadastrada ainda."
            />
            {cuisineTypes.data?.length === 0 && (
              <Link to="/settings" className="mt-2 inline-block text-sm text-brand underline">
                Cadastrar culinárias
              </Link>
            )}
          </Field>

          <Field label="Marcadores">
            <ChipSelect
              options={(tags.data ?? []).map((tag) => ({ value: tag.id, label: tag.name }))}
              selected={tagIds}
              onChange={setTagIds}
              emptyLabel="Nenhum marcador cadastrado ainda."
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <Field label="Faixa de preço">
            <Select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value as PriceRange | '')}
            >
              <option value="">Não sei ainda</option>
              {PRICE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {PRICE_RANGE_LABELS[range]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Vontade de ir" hint="Alimenta o desempate da sugestão.">
            <Select
              value={wishlistPriority}
              onChange={(event) => setWishlistPriority(event.target.value as WishlistPriority)}
            >
              {WISHLIST_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {WISHLIST_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bairro">
              <Input
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
          </div>

          <Field label="Endereço">
            <Input value={address} onChange={(event) => setAddress(event.target.value)} />
          </Field>

          <Field label="Observações">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </Card>

        {create.isError && <ErrorState message={errorMessage(create.error)} />}

        <Button type="submit" block disabled={!canSubmit || create.isPending}>
          {create.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Screen>
  )
}
