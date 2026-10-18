# Folder structure & conventions — andromeda-frontend

> Reference for the `frontend-modular-feature-architecture` skill. This is the map of
> **where a file lives** and the conventions in use. It describes the app as it exists
> today: still early-stage, with `sign-up` as the fully-evolved reference feature. Keep
> new code consistent with `sign-up`; older screens predate these conventions and will
> be brought up to them.

## 1. How the code is organized

**Feature-sliced.** Code is grouped by **screen/domain** under `src/features/`, with
cross-cutting technical concerns living at the `src/` root. Organize by feature first;
put something at the root **only when it is genuinely cross-feature** (used by more than
one slice, or part of the app shell/transport/state).

Two questions decide placement:

1. _Is it specific to one screen?_ → it belongs in that feature slice.
2. _Is it shared plumbing (transport, global state, routing, i18n init, entity contracts,
   test infra, app shell)?_ → it belongs in the matching `src/` root folder.

## 2. Full folder tree

```
src/
├── main.tsx                 # bootstrap: hydrates the session, then mounts QueryClientProvider + RouterProvider
├── router.tsx               # composes the route tree (rootRoute.addChildren([...])), createAppRouter(), registers the router type
├── i18n.ts                  # i18next init: registers every feature/layout namespace + LanguageDetector (localStorage "andromeda-locale")
├── vite-env.d.ts            # Vite/TS ambient types
├── router/
│   ├── public-routes.ts     # PUBLIC_ROUTES + isPublicRoute(path) — paths reachable while unauthenticated
│   ├── guards/              # RequireAuth, RequireGuest, RequireRole — read the session store, return <Outlet/> or <Navigate/>
│   └── routes/              # pathless layout/guard routes: root.route, guest-guard.route, auth-guard.route, app-layout.route
├── stores/                  # Zustand global stores: session.store, theme.store, locale.store
├── lib/                     # transport: http-client, http-error, token-refresh
├── types/entities/          # shared entity contracts (mirror the backend)
│   ├── account/             # account.entity.ts, account.interfaces.ts, account.types.ts, account.roles.ts
│   └── user/                # user.entity.ts, user.types.ts, user.roles.ts
├── ui/                      # shared composed UI
│   ├── layout/public/       # PublicLayout, PublicHeader
│   ├── layout/private/      # AppLayoutWrapper, drawer, header
│   ├── layout/components/   # locale-dropdown, sign-out-button, theme-toggle
│   ├── layout/i18n/         # layout translation namespace
│   └── components/          # confirm-modal
├── components/              # app-wide branded components (andromeda-logo)
├── hooks/                   # global cross-feature hooks
├── styles/                  # globals.css — @import "@andromeda/design-system/styles"
├── tests/                   # shared test infrastructure (see references/testing.md)
│   ├── factories/           # component.factory, query-client.factory, router.factory, auth.factory
│   ├── msw.ts               # captureRequestBody, deferResponse
│   ├── server.ts            # setupServer(...featureHandlers) — the MSW node server
│   └── i18n/                # i18n-utils (flattenKeys, findEmptyValues)
└── features/                # one folder per screen/domain
    └── <feature>/
        ├── schema/<feature>.schema.ts   # make<Feature>Schema(t) → Zod object + inferred <Feature>FormValues
        ├── api/<feature>.api.ts         # request/response DTOs + functions over lib/http-client
        ├── hooks/use-<feature>-form.ts  # the screen's brain (RHF + resolver + TanStack mutation/query)
        ├── components/                  # presentational components (<feature>-form, <feature>-hero, <feature>-skeleton, …)
        ├── i18n/                        # interface.ts + <feature>.<locale>.ts per language
        ├── @test-utils/                 # test-ids, MSW handlers, data factories, i18n helpers
        ├── <feature>.page.tsx           # the screen (session gate + composition)
        └── <feature>.route.ts(x)        # TanStack route wiring the page under a parent guard/layout route
```

**Features today:** `account`, `home`, `landing`, `logout`, `set-password`, `sign-in`,
`sign-up`. **`sign-up` is the reference** (full slice + tests). `home`/`landing` are
minimal (page + route only). `sign-in`/`set-password` predate the current conventions.

## 3. Conventions currently in use

- **Naming.** `<feature>.page.tsx`, `<feature>.route.ts(x)`, `use-<feature>-form.ts`,
  `<feature>.schema.ts` (exports the `make<Feature>Schema` factory **and** the inferred
  `<Feature>FormValues`), `<feature>.api.ts` (plain exported functions). Files are
  kebab-case; components PascalCase; hooks `useXxx`; test-id registries `<feature>XxxIds`.
- **Routing** is **code-based** TanStack Router (no file-based plugin, no generated route
  tree). The tree is assembled by hand in `src/router.tsx`. Guards are **pathless layout
  routes** whose component reads the session store and renders `<Outlet/>` or redirects.
- **State.** Zustand for global client state (`session`, `theme`, `locale`); TanStack
  Query for server state (a single `QueryClient` in `main.tsx`). Server data is not
  copied into a store.
- **Transport.** Features reach the backend through `lib/http-client` — cookie auth
  (`credentials: "include"`), the `{ error, data, message }` envelope, and a transparent
  401→refresh→retry. Never call `fetch` directly from a feature.
- **Permissions & tenancy.** The session (`stores/session.store`) carries `tenantId` and
  `roles[]`; `hasRole()` and `RequireRole` gate UI. Role literals live in
  `types/entities/<entity>/<entity>.roles.ts` (e.g. `ACCOUNT_ROLES.READ = "accounts:read"`).
  Nothing hard-codes a tenant.
- **Entity contracts.** Types shared with the backend live in `types/entities/<entity>/`,
  split into `.entity.ts` (the aggregate shape), `.interfaces.ts` (nested value objects
  like `AccountSettings`/`AccountBranding`), `.types.ts` (`as const` enums), and
  `.roles.ts` (permission literals). API DTOs are built from these with `Pick`/`Partial`.
- **Internationalization.** `react-i18next`; each feature owns an `i18n/` folder with a
  typed `interface.ts` contract and one file per locale, registered as a namespace in
  `src/i18n.ts`. See `references/i18n.md`.
- **Design system.** UI primitives/layouts/icons come from the external
  `@andromeda/design-system` workspace package — **compose** them, don't reinvent.
- **Imports** are relative; there are **no path aliases** configured
  (`moduleResolution: "Bundler"`, no `.js` extension on imports).

## 4. The `src/` root layers at a glance

| Folder                   | Owns                                                                                | Reference                                    |
| ------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| `lib/`                   | Transport: `http-client`, `http-error` (`ApiError`/`NetworkError`), `token-refresh` | `references/state-transport-auth.md`         |
| `stores/`                | Zustand global state: `session`, `theme`, `locale`                                  | `references/state-transport-auth.md`         |
| `router/` + `router.tsx` | Code-based route tree, guards, pathless layout/guard routes                         | `references/state-transport-auth.md`         |
| `types/entities/`        | Entity contracts shared with the backend (shape, value objects, enums, roles)       | `references/state-transport-auth.md`         |
| `i18n.ts`                | i18next init + namespace registration + language detection                          | `references/i18n.md`                         |
| `ui/`                    | Composed layouts (`public`/`private`) and shared composed components                | (compose the design system)                  |
| `components/`            | App-wide **branded** components (e.g. the logo)                                     | (compose the design system)                  |
| `hooks/`                 | Global cross-feature hooks                                                          | —                                            |
| `styles/`                | `globals.css` — imports the design-system stylesheet                                | `references/accessibility-ux-conventions.md` |
| `tests/`                 | Shared test infra: render factories, MSW helpers, MSW server, i18n utils            | `references/testing.md`                      |

## 5. Accessibility & UX conventions

Every screen follows a fixed set of a11y/UX patterns (async feedback via `aria-live`,
`FormField`-owned ARIA, decorative icons, Title Case copy, one `<h1>` per page, explicit
SVG `width`, landmark structure). These are enforced across the app — see
**[accessibility-ux-conventions.md](accessibility-ux-conventions.md)**.

## 6. Where to defer to the supporting skills

This skill answers **where code goes and how a slice is shaped**. For the rest, use the
matching specialist skill:

- **Component API/composition** (props vs. children, compound components, providers,
  React 19 APIs) → `frontend-composition-patterns`.
- **Performance** (data fetching strategy, bundle size, lazy loading, avoiding needless
  re-renders) → `frontend-react-best-practices`.
- **Accessibility & UX audits** of anything user-facing → `frontend-web-design-guidelines`
  (and the enforced conventions in `accessibility-ux-conventions.md`).

Don't invent structure or conventions that aren't here or already in the codebase. When
something genuinely isn't defined yet, raise it rather than fabricating a convention.
