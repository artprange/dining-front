import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '@/api/client'
import { cuisineTypesQuery, mutations, queryKeys, tagsQuery } from '@/api/queries'
import type { CuisineType, Tag, WithUsage } from '@/api/types'
import { Input } from '@/components/form'
import { Button, Card, ErrorState, Screen, Spinner } from '@/components/ui'

export const Route = createFileRoute('/settings')({ component: SettingsScreen })

function SettingsScreen() {
  return (
    <Screen
      title="Ajustes"
      subtitle="As culinárias e os marcadores que aparecem nos filtros e no cadastro."
    >
      <div className="space-y-6">
        <CuisineTypesSection />
        <TagsSection />
      </div>
    </Screen>
  )
}

function CuisineTypesSection() {
  const queryClient = useQueryClient()
  const query = useQuery(cuisineTypesQuery())

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.cuisineTypes })

  const create = useMutation({
    mutationFn: (name: string) => mutations.createCuisineType({ name }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => mutations.removeCuisineType(id),
    onSuccess: invalidate,
  })

  return (
    <NameListSection
      title="Culinárias"
      placeholder="Japonesa"
      items={query.data}
      isPending={query.isPending}
      loadError={query.error}
      onRetry={() => void query.refetch()}
      writeError={create.error ?? remove.error}
      isWriting={create.isPending || remove.isPending}
      onCreate={(name) => create.mutate(name)}
      onRemove={(id) => remove.mutate(id)}
    />
  )
}

function TagsSection() {
  const queryClient = useQueryClient()
  const query = useQuery(tagsQuery())

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.tags })

  const create = useMutation({
    mutationFn: (name: string) => mutations.createTag({ name }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => mutations.removeTag(id),
    onSuccess: invalidate,
  })

  return (
    <NameListSection
      title="Marcadores"
      placeholder="romântico"
      items={query.data}
      isPending={query.isPending}
      loadError={query.error}
      onRetry={() => void query.refetch()}
      writeError={create.error ?? remove.error}
      isWriting={create.isPending || remove.isPending}
      onCreate={(name) => create.mutate(name)}
      onRemove={(id) => remove.mutate(id)}
    />
  )
}

/** Culinária e marcador são a mesma coisa na tela: uma lista de nomes. */
function NameListSection({
  title,
  placeholder,
  items,
  isPending,
  loadError,
  onRetry,
  writeError,
  isWriting,
  onCreate,
  onRemove,
}: {
  title: string
  placeholder: string
  items: ((CuisineType | Tag) & WithUsage)[] | undefined
  isPending: boolean
  loadError: unknown
  onRetry: () => void
  writeError: unknown
  isWriting: boolean
  onCreate: (name: string) => void
  onRemove: (id: string) => void
}) {
  const [name, setName] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()

    const trimmed = name.trim()

    if (!trimmed) return

    onCreate(trimmed)
    setName('')
  }

  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>

      <Card>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={name}
            placeholder={placeholder}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" disabled={isWriting || !name.trim()}>
            Add
          </Button>
        </form>

        {writeError != null && (
          <p className="mt-2 text-sm text-red-700">{errorMessage(writeError)}</p>
        )}

        {loadError != null ? (
          <div className="mt-3">
            <ErrorState message={errorMessage(loadError)} onRetry={onRetry} />
          </div>
        ) : isPending ? (
          <Spinner />
        ) : items && items.length > 0 ? (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">
                  {item.name}
                  {item._count.restaurants > 0 && (
                    <span className="ml-2 text-xs text-muted">
                      {item._count.restaurants} lugar(es)
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={isWriting}
                  onClick={() => {
                    const inUse = item._count.restaurants
                    const warning = inUse
                      ? ` Ele está em ${inUse} lugar(es) e vai sair de todos.`
                      : ''

                    if (confirm(`Remover "${item.name}"?${warning}`)) onRemove(item.id)
                  }}
                  className="text-sm text-muted transition hover:text-red-600 disabled:opacity-50"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Nada cadastrado ainda.</p>
        )}
      </Card>
    </section>
  )
}
