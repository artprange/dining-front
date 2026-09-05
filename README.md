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

O dev server sobe em `http://localhost:5173` e escuta em toda a rede
(`server.host`), então dá para abrir do celular pelo IP da máquina.

| Script | O que faz |
|---|---|
| `npm run dev` | Dev server com HMR |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run typecheck` | Só o `tsc` |
| `npm run lint` | oxlint |
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
