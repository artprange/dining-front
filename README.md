# Dining — front

Front-end do [dining](https://github.com/artprange/dining): cadastrar os lugares
onde vocês comem, registrar as visitas e, quando ninguém quiser decidir,
perguntar ao app **"vamos aonde?"**.

Mobile-first por escolha, não por acaso: a cena real é vocês dois no celular às
19h. Desktop é o caso secundário.

## Stack

| | |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| Rotas | TanStack Router (baseado em arquivos, em `src/routes/`) |
| Dados | TanStack Query |
| Estilo | Tailwind CSS 4 |
| Lint | oxlint |

## Rodando

O back precisa estar de pé antes — veja o README de
[artprange/dining](https://github.com/artprange/dining).

```bash
cp .env.example .env   # aponte VITE_API_URL para o back
npm install
npm run dev
```

### Sem o back: modo demonstração

```bash
VITE_DEMO=true npm run dev
```

Sobe com um catálogo semeado e **sem back nenhum**. O MSW intercepta o fetch
com um service worker, então `src/api/client.ts` roda exatamente como em
produção: tratamento de `ApiError` e `NetworkError`, cancelamento do TanStack
Query e serialização de query params, tudo exercitado de verdade.

As escritas são reais contra um banco em memória e ficam no `localStorage` de
quem visita — cadastrar um lugar e registrar uma visita funcionam, e
sobrevivem ao reload. Cada visitante tem a própria cópia. O aviso no topo da
tela deixa claro que os dados são fictícios e permite recomeçar.

É ligado por `VITE_DEMO`, uma variável explícita, e não pela ausência de
`VITE_API_URL` — esta tem um padrão útil em desenvolvimento, e deduzir o modo
da ausência dela faria um deploy de produção mal configurado virar
demonstração em silêncio.

Fora do modo demonstração o MSW é **eliminado do bundle**: o `dist` sai de
832 KB para 436 KB. O mock não custa nada em produção.

O dev server sobe em `http://localhost:5173` e escuta em toda a rede
(`server.host`), então dá para abrir do celular pelo IP da máquina.

| Script | O que faz |
|---|---|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run typecheck` | Só o `tsc` |
| `npm run lint` | oxlint |
| `npm test` | Testes dos handlers do mock (Vitest + msw/node) |
| `npm run api:types` | Regera `src/api/schema.d.ts` a partir do Swagger do back |

## Tipos da API

`src/api/schema.d.ts` é **gerado**, não editado: sai do `GET /api-json` do back
via `openapi-typescript`. Sempre que um DTO mudar lá, rode:

```bash
npm run api:types
```

com o back rodando. O `src/api/types.ts` é a camada fina por cima, com nomes
mais curtos e dois ajustes documentados no próprio arquivo.

**Limitação conhecida:** o back anota os DTOs de entrada, mas não declara os
tipos de resposta no Swagger — os controllers devolvem o retorno do Prisma
direto. Resultado: o schema gerado tipa o que mandamos e não o que recebemos,
e os tipos de resposta em `src/api/types.ts` estão escritos à mão. O conserto
é no back (DTOs de resposta + `@ApiOkResponse({ type })`), e está no backlog.

## Estrutura

```
src/
  api/        Cliente HTTP, tipos e as query options do TanStack Query
  components/ Peças de UI reaproveitadas entre telas
  lib/        Formatação (datas, notas, rótulos dos enums)
  routes/     Uma tela por arquivo; o TanStack Router monta a árvore
  styles.css  Tailwind + tokens de cor
```

`src/routeTree.gen.ts` também é gerado (pelo plugin do router), mas fica
versionado: o `npm run build` roda o `tsc` antes do Vite, e sem o arquivo em
disco a checagem de tipos quebraria num clone novo.

## Telas

- **Vamos aonde?** (`/`) — filtra e pede sugestão, ranqueada ou sorteada; cada
  cartão mostra por que aquele lugar apareceu
- **Lista** (`/restaurants`) — busca por nome, nota média, selo "nunca fomos"
- **Novo** (`/restaurants/new`) — cadastro
- **Detalhe** (`/restaurants/:id`) — histórico, registrar visita, veredito
  "voltaria?"
- **Ajustes** (`/settings`) — culinárias e marcadores

## Deploy

Hospedado na Vercel com `VITE_DEMO=true`, o que publica a versão
demonstrativa — navegável por qualquer pessoa, sem back e sem credencial.

O `vercel.json` declara o rewrite de SPA: sem ele, recarregar `/restaurants`
direto no navegador devolve 404, porque esse caminho não existe como arquivo.
A versão do Node vem de `engines.node`.

O `.npmrc` com `legacy-peer-deps` existe porque `openapi-typescript` declara
peer `typescript@^5.x` e o projeto está no 6. Sem ele `npm ci` falha com
ERESOLVE — inclusive no build da Vercel, que é exatamente esse comando.

## Testes

```bash
npm test
```

Cobrem os handlers do mock por `msw/node`, que intercepta sem service worker.
As requisições passam pelo `client.ts` de verdade, então os testes verificam
de uma vez os handlers, a montagem de query params e o tratamento de erro.
