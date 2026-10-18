---
name: frontend-modular-feature-architecture
description: Folder structure and feature-oriented organization of the andromeda-frontend SPA (React 19 + TypeScript + Vite + TanStack Router/Query + Zustand + react-i18next + Zod/React Hook Form). Use when creating, placing, or navigating files in the frontend, when building a screen (form/data, list, detail), and when writing frontend tests. Explains the feature-slice anatomy, the flow inside a slice (route → page → component → hook → schema/api), the cross-cutting layers at the src/ root (transport, stores, router, i18n, entity types, testing infra), and the conventions actually in use. Code examples come from the applied reference feature `sign-up` (account + owner registration), from the Zod schema to the TanStack route.
---

# Frontend Modular Feature Architecture (andromeda-frontend)

This is the skill's **orchestrator**. It describes how `apps/andromeda-frontend`
is organized — the **feature-slice** convention, the flow inside a slice, and the
cross-cutting layers at the `src/` root — and points to the reference file for each
topic. Read this whole page first; then open **only** the `references/` files for the
topics you're about to touch (loaded on demand — don't read everything at once).

## Reference feature (the source of the examples)

To make every concept concrete, this skill uses one **applied reference feature**:
**`sign-up`** — the screen that registers a new **account** and its **owner user**.
It is the frontend's fully-evolved vertical slice (localized Zod schema, TanStack
Query mutation, design-system form, i18n, and a complete test suite), the same role
`register` plays in the backend skill. Every block marked as a _"reference example"_
is real code from `src/features/sign-up/**`.

> **Not every feature is at this bar yet.** The app is early-stage; older screens
> (`sign-in`, `set-password`) predate these conventions (static schema, hard-coded
> copy, no tests). **`sign-up` is the target pattern** — when you touch an older
> feature or create a new one, bring it up to the `sign-up` standard rather than
> copying the older style.

---

## 1. When to use this skill

- **Placing or navigating files**: deciding where a piece of code lives (the most
  common question) — a feature slice vs. a root-level cross-cutting folder.
- **Building a screen**: a form/data screen (like `sign-up`), a list, or a detail view.
- **Working on a slice layer**: `schema`, `api`, `hooks`, `components`, `page`, `route`,
  or the feature's `i18n` and `@test-utils`.
- **Touching a cross-cutting layer**: transport (`lib/`), global state (`stores/`),
  routing/guards (`router/`), internationalization (`i18n.ts`), shared entity contracts
  (`types/entities/`), or the shared test infrastructure (`tests/`).
- **Writing or reviewing tests** (schema, i18n, api, hook, component, page, route).

This skill decides **where code goes and how a slice is shaped**. It defers the
_component API_, _performance_, and _accessibility_ decisions to the three specialist
skills (see the table below).

---

## 2. Philosophy in one sentence

> **Feature-slicing** (code organized by screen/domain, not by technical type) +
> **presentational components over custom hooks** (the hook is the screen's brain, the
> component is its face) + **typed contracts at the edges** (Zod for the form, DTOs for
> the API, entity types shared with the backend).

Practical consequences that hold for every screen:

1. **Each feature is a vertical slice** under `src/features/<feature>/`. Adding a
   screen means adding a folder, not editing shared ones (additive). Only genuinely
   **cross-feature** code lives at the `src/` root.
2. **Components are presentational; logic lives in a hook.** A component renders and
   wires events; the `use-<feature>-form` hook owns form state, validation, the
   mutation/query, and payload mapping. This is what makes both testable.
3. **Features never touch the network or i18n init directly.** They call the backend
   through `lib/http-client` and read copy through `react-i18next` — never `fetch`,
   never a hard-coded string.
4. **The design system is the UI vocabulary.** UI primitives, layouts, and icons come
   from the external `@andromeda/design-system` package — **compose** them, don't
   reinvent.

---

## 3. The flow inside a feature slice (memorize this)

A screen is a small pipeline. The arrows mean "**renders / calls**"; data and events
flow down-and-back-up this chain. Nothing skips a step (a component never calls the
API directly; the page never owns form state).

```
        <feature>.route.ts        (mount + guard: which parent guard/layout owns it)
                │
                ▼
        <feature>.page.tsx        (session/loading gate + composition + layout)
                │
                ▼
        components/*.tsx           (presentational: design-system + a11y + data-testid)
                │
                ▼
        hooks/use-<feature>-form   (the brain: RHF + zodResolver + TanStack mutation/query + payload mapping)
              ╱        ╲
             ▼          ▼
    schema/*.schema.ts    api/*.api.ts
    (Zod, localized       (DTOs + httpClient calls;
     via TFunction)        DTOs built from types/entities/*)
```

Cross-cutting layers feed this pipeline from the `src/` root:

- `i18n.ts` + the feature's `i18n/` folder supply **copy and localized validation**.
- `stores/` (Zustand) supply **client/session state** (the page reads session status;
  the API relies on the session cookie).
- `lib/http-client` is the **only** door to the backend (envelope, auth, refresh).
- `types/entities/` supply the **shared entity contracts** the API DTOs are built from.

If you know the backend skill: the **hook** is the frontend's _usecase_ (orchestration),
the **schema** is its _domain rule_, the **api** is its _outbound port_, and the
**route/page/component** are the _inbound adapter_.

---

## 4. Folder anatomy

```
src/
├── main.tsx                 # bootstrap: hydrate session → QueryClientProvider + RouterProvider
├── router.tsx               # code-based route tree (rootRoute.addChildren) + createAppRouter + register
├── i18n.ts                  # i18next init: registers each feature/layout namespace + LanguageDetector
├── router/
│   ├── public-routes.ts     # paths reachable while unauthenticated (isPublicRoute)
│   ├── guards/              # RequireAuth, RequireGuest, RequireRole — read session store, return <Outlet/>/<Navigate/>
│   └── routes/              # pathless layout/guard routes (root, guest-guard, auth-guard, app-layout)
├── stores/                  # Zustand global state: session.store, theme.store, locale.store
├── lib/                     # transport: http-client, http-error, token-refresh
├── types/entities/<entity>/ # shared entity contracts: .entity.ts, .interfaces.ts, .types.ts (enums), .roles.ts
├── ui/                      # shared composed UI: layout/{public,private}/, components/ (confirm-modal)
├── components/              # app-wide branded components (andromeda-logo)
├── hooks/                   # global cross-feature hooks
├── styles/                  # globals.css (imports the design-system stylesheet)
├── tests/                   # shared test infra: factories/, msw.ts, server.ts, i18n/
└── features/<feature>/      # one vertical slice per screen/domain
    ├── schema/<feature>.schema.ts   # make<Feature>Schema(t) → Zod object; inferred <Feature>FormValues
    ├── api/<feature>.api.ts         # request/response DTOs + functions over lib/http-client
    ├── hooks/use-<feature>-form.ts  # the screen's brain (RHF + resolver + mutation/query)
    ├── components/                  # presentational components (form, hero, skeleton, …)
    ├── i18n/                        # interface.ts (contract) + <feature>.<locale>.ts per language
    ├── @test-utils/                 # test-ids, MSW handlers, data factories, i18n helpers
    ├── <feature>.page.tsx           # the screen (session gate + composition)
    └── <feature>.route.ts(x)        # TanStack route under a parent guard/layout route
```

**Features today:** `account`, `home`, `landing`, `logout`, `set-password`, `sign-in`,
`sign-up` (the reference).

**Depth scales with the screen.** A minimal screen (`home`, `landing`) is just
`<feature>.page.tsx` + `<feature>.route.ts`. A form/data screen (`sign-up`) has the
full set above. **Add a subfolder only when it has real content** — don't scaffold
empty `schema/` or `api/` folders for a static page.

---

## 5. Reference index (read on demand)

Open the file for the topic you're going to touch. Each covers: concept, role, when
to use it, a reference example from `sign-up`, how to start from scratch, and common
mistakes.

| Topic                       | File                                                                                     | Open it when...                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Folder structure**        | [references/architecture.md](references/architecture.md)                                 | deciding **where a file lives**; the full tree, naming, and conventions in use                                      |
| **Feature slice**           | [references/feature-slice.md](references/feature-slice.md)                               | **building a screen** — schema, api, hook, components, page, route (the `sign-up` walkthrough)                      |
| **State, transport & auth** | [references/state-transport-auth.md](references/state-transport-auth.md)                 | touching **Zustand stores, TanStack Query, `lib/http-client`, session/permissions/tenancy**                         |
| **Internationalization**    | [references/i18n.md](references/i18n.md)                                                 | adding or changing **copy, locales, or localized validation**                                                       |
| **Testing**                 | [references/testing.md](references/testing.md)                                           | writing **any test** (schema, i18n, api, hook, component, page, route, **stores/guards/transport**) + factories/MSW |
| **Accessibility & UX**      | [references/accessibility-ux-conventions.md](references/accessibility-ux-conventions.md) | building **any user-facing UI** — the enforced a11y/UX patterns                                                     |

### Supporting skills (use alongside this one)

This skill decides **where code goes and how a slice is shaped**. The three specialist
skills own the rest; reach for the matching one whenever the work touches its concern:

| Concern                                                                    | Skill                              |
| -------------------------------------------------------------------------- | ---------------------------------- |
| Component API design & composition (props, compound components, providers) | **frontend-composition-patterns**  |
| Performance (data fetching, bundle size, lazy loading, re-renders)         | **frontend-react-best-practices**  |
| Accessibility & UX review of any user-facing UI                            | **frontend-web-design-guidelines** |

---

## 6. Workflow — building a new feature (slice)

Follow the flow of §3, from the inside out. Each step has detail in its reference file.

1. **Entity types (only if new)** — if the screen speaks about an entity not yet in
   `types/entities/`, add the `.entity.ts` / `.interfaces.ts` / `.types.ts` / `.roles.ts`
   contract, mirroring the backend's shape. → `references/state-transport-auth.md`
2. **Schema** — `schema/<feature>.schema.ts`: a `make<Feature>Schema(t)` factory
   returning a Zod object, plus the inferred `<Feature>FormValues`. Messages come from
   `t` so they localize. → `references/feature-slice.md` + `references/i18n.md`
3. **API** — `api/<feature>.api.ts`: request/response DTO interfaces (built from
   `types/entities/*`) and plain functions over `lib/http-client`. → `references/feature-slice.md`
4. **i18n** — `i18n/interface.ts` (the translation contract) + one `<feature>.<locale>.ts`
   per locale; register the namespace in `src/i18n.ts`. → `references/i18n.md`
5. **Hook** — `hooks/use-<feature>-form.ts`: build the localized schema with `useMemo`,
   wire React Hook Form + `zodResolver`, the TanStack `useMutation`/`useQuery`, and the
   `toPayload` mapping. Expose a small, flat API. → `references/feature-slice.md`
6. **Components** — `components/`: presentational only. Consume the hook, compose
   design-system primitives, wire ARIA via `FormField`, and tag every element with a
   `data-testid` from the feature's registry. → `references/feature-slice.md` + `references/accessibility-ux-conventions.md`
7. **Page** — `<feature>.page.tsx`: gate on session status (skeleton while resolving),
   pick the layout (`PublicLayout` / `AppLayout`), and compose the components. → `references/feature-slice.md`
8. **Route** — `<feature>.route.ts(x)`: `createRoute` under the right parent guard
   (`guestGuardRoute` / `authGuardRoute` / a role guard), then register it in
   `src/router.tsx`. → `references/state-transport-auth.md`
9. **Tests** — colocate a test per layer as you go (schema, i18n, api, hook, component,
   page, route), using the shared factories and MSW. → `references/testing.md`

> When creating a new **feature**, replicate the `sign-up` slice. Add only the layers
> the screen actually needs.

---

## 7. Global conventions (apply to every layer)

- **Naming:** `<feature>.page.tsx`, `<feature>.route.ts(x)`, `use-<feature>-form.ts`,
  `<feature>.schema.ts` (exports the `make<Feature>Schema` factory **and** the inferred
  `<Feature>FormValues`), `<feature>.api.ts` (plain exported functions). Files are
  kebab-case; React components are PascalCase; hooks are `useXxx`.
- **Imports are relative.** There are **no path aliases** configured (`moduleResolution:
"Bundler"`, no `.js` extension on imports). Cross-slice imports reach up to the `src/`
  root (`../../lib/...`, `../../types/entities/...`).
- **Enums = `as const` object + derived type** (never a native `enum`), matching the
  backend and the entity contracts:
  ```ts
  export const SESSION_STATUS = { IDLE: "idle", LOADING: "loading" /* … */ } as const;
  export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
  ```
- **Contract interfaces** carry the `Interface` suffix when they mirror an entity
  (`AccountEntityInterface`, `UserEntityInterface`); form value types end in `FormValues`;
  API DTOs end in `Request`/`Response`.
- **Server state vs. client state:** TanStack Query owns server state (queries/mutations);
  Zustand owns global client/session/UI state. Don't duplicate server data into a store.
- **All user-facing copy is a translation key.** No literal strings in components/schemas;
  the reference feature routes everything through `react-i18next`.
- **Everything testable is tagged.** Elements a test needs to find carry a `data-testid`
  from the feature's `@test-utils/test-ids.ts` registry.
- **Self-explanatory code:** prefer clear names over comments. Comment only a non-obvious
  _why_ (see the `use-sign-up-form` note explaining a React Hook Form subscription).

---

## 8. Golden rules / common mistakes (overview)

Each reference file details the mistakes for its own topic. The cross-cutting ones:

- ❌ **Organizing by technical type** (global `components/`, `hooks/`, `services/`). ✅
  Organize by **feature**; a technical concern is a subfolder of the slice. Root-level
  folders are only for genuinely cross-feature code.
- ❌ **Business/validation logic or a `fetch` inside a component.** ✅ The component is
  presentational; logic lives in the hook, validation in the schema, transport in `api/`
  over `lib/http-client`.
- ❌ **Calling `fetch` directly from a feature.** ✅ Always through `lib/http-client`
  (envelope unwrap, `credentials: "include"`, transparent 401→refresh→retry).
- ❌ **Hard-coding copy or validation messages.** ✅ Route everything through
  `react-i18next`; build the Zod schema from a `t` function so messages localize.
- ❌ **Reinventing UI primitives.** ✅ Compose `@andromeda/design-system`; let `FormField`
  own the input's ARIA.
- ❌ **Duplicating a tenant or role literal.** ✅ Tenancy rides in the session
  (`tenantId`); roles come from `types/entities/*.roles.ts` and are checked via the
  session store / `RequireRole`.
- ❌ **Scaffolding empty slice folders.** ✅ Add `schema/`, `api/`, `i18n/`, `@test-utils/`
  only when the screen has real content for them.

---

## 9. Commands

```bash
pnpm --filter andromeda-frontend dev        # Vite dev server (proxies /api → :3000)
pnpm --filter andromeda-frontend build      # tsc --noEmit + vite build
pnpm --filter andromeda-frontend test       # Vitest (jsdom), single run
pnpm --filter andromeda-frontend typecheck  # tsc --noEmit
```

There is a single Vitest project (`vite.config.ts`, `environment: "jsdom"`,
`setupFiles: ["./vitest.setup.ts"]`); tests are colocated (`src/**/*.test.{ts,tsx}`).
Details in `references/testing.md`.
