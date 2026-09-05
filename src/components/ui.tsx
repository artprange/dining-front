import type { ButtonHTMLAttributes, ReactNode } from 'react'

function cx(...values: (string | false | undefined | null)[]): string {
  return values.filter(Boolean).join(' ')
}

export function Screen({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  block?: boolean
}

export function Button({
  variant = 'primary',
  block = false,
  className,
  ...props
}: ButtonProps) {
  const styles = {
    primary: 'bg-brand text-white hover:opacity-90',
    secondary: 'border border-line bg-card text-ink hover:bg-brand-soft',
    ghost: 'text-muted hover:text-ink',
    danger: 'border border-line bg-card text-red-600 hover:bg-red-50',
  }[variant]

  return (
    <button
      className={cx(
        // 44px de altura mínima: alvo de toque confortável no celular.
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        block && 'w-full',
        className,
      )}
      {...props}
    />
  )
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'positive' | 'negative'
}) {
  const tones = {
    neutral: 'border-line bg-surface text-muted',
    brand: 'border-transparent bg-brand-soft text-brand',
    positive: 'border-transparent bg-emerald-50 text-emerald-700',
    negative: 'border-transparent bg-red-50 text-red-700',
  }[tone]

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        tones,
      )}
    >
      {children}
    </span>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="Carregando">
      <div className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="font-medium text-red-800">Não deu certo</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Tentar de novo
          </Button>
        </div>
      )}
    </div>
  )
}
