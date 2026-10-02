/**
 * Exportado para os handlers do MSW montarem os mesmos caminhos que o cliente
 * chama. Deixar os dois derivarem daqui evita o mock casar com uma URL e a
 * aplicação pedir outra.
 */
export const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

/** Formato de erro do Nest: `message` vem como string ou lista (validação). */
interface NestErrorBody {
  statusCode?: number
  message?: string | string[]
  error?: string
}

export class ApiError extends Error {
  readonly status: number
  /** Uma linha por problema: a validação do back devolve várias de uma vez. */
  readonly problems: string[]

  constructor(status: number, problems: string[]) {
    super(problems.join(' ') || `Erro ${status}.`)
    this.name = 'ApiError'
    this.status = status
    this.problems = problems
  }
}

/** A API não respondeu (offline, back fora do ar, CORS). */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Nao foi possivel falar com a API.')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | string[] | undefined | null
>

/**
 * Arrays viram parâmetros repetidos (`?tagIds=a&tagIds=b`), que é o formato
 * que o `FindRestaurantsDto` do back entende. Vazio e undefined somem, para
 * um filtro não marcado não virar `?city=` na URL.
 */
function toSearchParams(params: QueryParams): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item)
      continue
    }

    search.append(key, String(value))
  }

  const query = search.toString()

  return query ? `?${query}` : ''
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  params?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', params, body, signal } = options

  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}${params ? toSearchParams(params) : ''}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    // Deixa o cancelamento do TanStack Query passar como cancelamento.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause

    throw new NetworkError(cause)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblems(response))
  }

  // 204 (DELETE) não tem corpo para desserializar.
  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

async function readProblems(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as NestErrorBody

    if (Array.isArray(body.message)) return body.message
    if (body.message) return [body.message]
    if (body.error) return [body.error]
  } catch {
    // Resposta sem JSON (proxy, HTML de erro): cai no texto padrão abaixo.
  }

  return [`A API respondeu ${response.status}.`]
}

export const api = {
  get: <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { params, signal }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}

/** Mensagem pronta para tela, sem o componente precisar saber o tipo do erro. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.problems.join(' ')
  if (error instanceof NetworkError) {
    return 'Nao foi possivel falar com a API. Ela esta rodando?'
  }

  return 'Algo deu errado.'
}
