import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const controlStyles =
  'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base outline-none transition placeholder:text-muted focus:border-brand'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={controlStyles} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={controlStyles} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={controlStyles} />
}

export interface Option {
  value: string
  label: string
}

/**
 * Lista de pílulas que liga e desliga. Num celular isso é muito mais rápido
 * que um `<select multiple>`, que praticamente não funciona no toque.
 */
export function ChipSelect({
  options,
  selected,
  onChange,
  emptyLabel = 'Nada cadastrado ainda.',
}: {
  options: Option[]
  selected: string[]
  onChange: (next: string[]) => void
  emptyLabel?: string
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>
  }

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isOn = selected.includes(option.value)

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            onClick={() => toggle(option.value)}
            className={
              'min-h-9 rounded-full border px-3 text-sm transition ' +
              (isOn
                ? 'border-transparent bg-brand text-white'
                : 'border-line bg-card text-ink hover:bg-brand-soft')
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-[var(--color-brand)]"
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}

/** Nota de 1 a 5. Botões de verdade, para funcionar com teclado e leitor de tela. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} de 5`}
          aria-pressed={value === star}
          onClick={() => onChange(star)}
          className={
            'size-11 rounded-xl border text-lg transition ' +
            (star <= value
              ? 'border-transparent bg-brand-soft text-brand'
              : 'border-line bg-card text-muted')
          }
        >
          ★
        </button>
      ))}
    </div>
  )
}
