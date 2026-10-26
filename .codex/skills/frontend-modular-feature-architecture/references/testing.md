# Testing — precisely, per layer

> Reference for the `frontend-modular-feature-architecture` skill. Runner: **Vitest**
> (`jsdom`) + **React Testing Library** + **@testing-library/user-event** + **MSW** for
> HTTP. Real examples in `src/features/sign-up/**` and the shared infra in `src/tests/**`.
> This is the testing architecture the reference feature establishes; apply it to every
> new feature.

## 1. Setup and taxonomy

There is **one** Vitest project (no separate integration/e2e configs — the backend's
three-tier split doesn't apply on the client).

```ts
// vite.config.ts — test block
test: {
  environment: "jsdom",
  setupFiles: ["./vitest.setup.ts"],
  include: ["src/**/*.test.{ts,tsx}"],
}
```

```ts
// vitest.setup.ts — global lifecycle
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./src/tests/server";
import "./src/i18n";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
```

Consequences you rely on in every test:

- **MSW is always on.** `onUnhandledRequest: "error"` means a request with no handler
  **fails the test** — every HTTP call must be backed by a handler (a feature default in
  `@test-utils/handlers.ts` or a per-test `server.use(...)`).
- **Handlers reset between tests** (`resetHandlers`) and the DOM is cleaned
  (`cleanup`) after each test — suites are isolated.
- **i18n is initialized** for the whole run, so `t(...)` resolves real copy in `en` (the
  default) unless a test switches locale.
- **Co-location:** the test sits next to the file it tests (`sign-up-form.tsx` ↔
  `sign-up-form.test.tsx`).

**Test-type decision rule:** a **pure** module (schema, i18n, `toPayload`) → plain unit
test. A module that **talks to the backend** (`api/`, the hook's mutation) → unit test with
**MSW**. A **component/page** → RTL render + `user-event`. A **route/guard** → RTL render
through the router factory with a memory history.

## 1a. Structure of a test — AAA and scenario grouping

Every test in the suite follows the same shape; keep it.

- **One `it`, one behavior, in Arrange → Act → Assert order.** Separate the three phases
  with a blank line so the "act" reads at a glance. When the arrange is non-trivial (locale
  switch, session state, a deferred response), a one-line phase comment is welcome; for a
  two-line test it's noise. The `it` name reads `should <observable outcome>`.
- **Group by scenario, not by "the unit".** Each `describe` is a scenario or state of the
  SUT — `useSignUpForm — localized validation`, `useSignUpForm — mutation outputs`,
  `RequireRole — exact permission matching`, `httpClient — 401 refresh-and-retry` — never a
  single loose `describe("SignUpForm", …)` holding every case. This is the frontend analog
  of the backend's _when-success / when-fails_ split: happy path and failure/edge states
  live in their own blocks. A short comment above a `describe` explains _why the scenario
  matters_ when the intent isn't obvious (see the guard suites).
- **Table-drive the variants** with `it.each` (slug/email formats, non-matching roles,
  locales) instead of copy-pasting near-identical `it`s.

## 2. Shared test infrastructure — `src/tests/`

Cross-feature test plumbing lives at the root, mirroring how production plumbing lives at
`src/` root.

### `tests/factories/` — render + data factories

```ts
// query-client.factory.ts — a retry-free client for tests
export function makeQueryClient(override?: QueryClient): QueryClient {
  return override ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

// component.factory.tsx — render a component inside the QueryClientProvider
export function makeComponent(ui: ReactElement, options: MakeComponentOptions = {}) {
  const client = makeQueryClient(options.queryClient);
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

// hook.factory.tsx — renderHook inside the QueryClientProvider (the hook SUT renderer)
export function renderHookWithClient<Result, Props>(
  hook: (initialProps: Props) => Result,
  options: RenderHookWithClientOptions<Props> = {},
) {
  const { queryClient, ...renderHookOptions } = options;
  const client = makeQueryClient(queryClient);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper, ...renderHookOptions });
}

// router.factory.tsx — mount a route tree with an in-memory history
export function makeRouteTree(children: AnyRoute[]) { return rootRoute.addChildren(children); }
export function makeRouter(routeTree: AnyRoute, options: MakeRouterOptions = {}) {
  const { initialPath = "/", queryClient } = options;
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history });
  return render(
    <QueryClientProvider client={makeQueryClient(queryClient)}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

// auth.factory.ts — a valid SessionUser with overrides
export function makeSessionUser(override: Partial<SessionUser> = {}): SessionUser {
  return { userId: "usr-001", tenantId: "tenant-001", username: "janedoe", roles: [], ...override };
}
```

- **`makeComponent`** is the default renderer — it provides the `QueryClient` every hook
  needs. Use it for **every** component and page test, including hook-free presentational
  ones (`sign-up-hero`, `sign-up-skeleton`) — don't reach for a bare `render(...)`, so the
  renderer stays uniform and any future provider is added in one place.
- **`renderHookWithClient`** is the **hook SUT renderer** — it wraps `renderHook` in the
  `QueryClientProvider` a hook's `useQuery`/`useMutation` needs. Use it for every hook test;
  never hand-roll the wrapper per file.
- **`makeRouteTree` + `makeRouter`** mount a real router (with the app's `rootRoute`) at a
  chosen path — use them for route/guard tests.
- **`retry: false`** everywhere so a failing request surfaces immediately instead of
  retrying and timing out.

These are the frontend's render/SUT factories, one per layer (the analog of the backend's
`makeSut`): **`makeComponent`** for components/pages, **`renderHookWithClient`** for hooks,
**`makeRouteTree` + `makeRouter`** for routes/guards. A test that builds its own
`QueryClientProvider`/`render` wrapper is duplicating one of these — reach for the factory.

### `tests/msw.ts` — request helpers

```ts
// captureRequestBody — records what the client SENT (payload assertions)
export function captureRequestBody<T>(path, response = {}, status = 201) {
  const captured: { body: T | null } = { body: null };
  server.use(
    http.post(path, async ({ request }) => {
      captured.body = (await request.json()) as T;
      return HttpResponse.json(response, { status });
    }),
  );
  return captured;
}

// deferResponse — holds the response open until you call resolve() (observe in-flight state)
export function deferResponse(path, response = {}, status = 201) {
  let resolve!: () => void;
  const pending = new Promise<Response>((r) => {
    resolve = () => r(HttpResponse.json(response, { status }) as unknown as Response);
  });
  server.use(http.post(path, () => pending));
  return { resolve };
}
```

`captureRequestBody` answers _"what did we send?"_; `deferResponse` answers _"what does the
UI look like while the request is pending?"_ (loading label, disabled controls).

### `tests/server.ts` — the MSW node server

```ts
import { setupServer } from "msw/node";
import { signUpHandlers } from "../features/sign-up/@test-utils/handlers";
export const server = setupServer(...signUpHandlers);
```

The server aggregates each feature's **default (happy-path) handlers**. A new feature adds
its handlers here.

### `tests/i18n/i18n-utils.ts`

`flattenKeys(obj)` and `findEmptyValues(obj)` power the i18n structural tests (§4b).

## 3. Per-feature test doubles — `@test-utils/`

Each feature owns its test doubles, so the shared infra stays generic. This is the frontend
analog of the backend's module-level `@testing/` factories.

```
features/sign-up/@test-utils/
├── test-ids.ts           # the data-testid registry (single source of selectors)
├── handlers.ts           # default MSW handlers (happy path), registered in tests/server.ts
├── account.factory.ts    # make<DTO>(override) for request/response DTOs
├── sign-up-form.factory.ts # makeSignUpFormValues(override)
└── sign-up-i18n.ts       # SIGN_UP_TRANSLATIONS record + changeLocale/resetLocale helpers
```

**`test-ids.ts` — selectors are data, not strings.** A registry keyed by area, each id
prefixed with the feature name. Both the component **and** its tests import from here, so a
rename is one edit.

```ts
const FEATURE_ID = "sign-up";
const id = (suffix: string) => `${FEATURE_ID}-${suffix}`;
export const signUpFormIds = {
  form: id("form"),
  serverError: id("server-error"),
  successMessage: id("success-message"),
  accountNameInput: id("account-name-input"),
  submitButton: id("submit-button") /* … */,
};
```

**Data factories — the `make<Thing>(override = {})` pattern.** A valid default plus
spreading overrides at the end, identical in spirit to the backend factories. The test
declares only what the scenario cares about.

```ts
export function makeSignUpFormValues(override: Partial<SignUpFormValues> = {}): SignUpFormValues {
  return {
    accountName: "Acme Corp",
    accountSlug: "acme-corp",
    legalName: "",
    taxId: "",
    ownerName: "Jane Doe",
    ownerUsername: "janedoe",
    ownerEmail: "jane@acme.com",
    ...override,
  };
}
```

DTO factories build from the entity enums, keeping fixtures type-safe
(`makeCreateAccountResponse` uses `ACCOUNT_PLAN.TRIAL`, `USER_STATUS.PENDING`, …).

**`sign-up-i18n.ts`** exposes `SIGN_UP_TRANSLATIONS[locale]` (so a test can assert the exact
localized string) and `changeLocale(locale)` / `resetLocale()` (wrappers over
`i18n.changeLanguage`) for locale-reactivity tests.

## 4. Pattern per layer

### a) `schema/` — pure unit test with a key-echoing `t`

The SUT is the Zod object. Pass a stub `t` that **returns the key**, so assertions target
_which message key_ each rule carries — leaving localized copy to the i18n suite.

```ts
const t = ((key: string) => key) as unknown as Parameters<typeof makeSignUpSchema>[0];
const schema = makeSignUpSchema(t);

it("should reject a slug containing uppercase letters", () => {
  expect(firstErrorFor(makeSignUpFormValues({ accountSlug: "Acme-Corp" }), "accountSlug")).toBe(
    "errors.slug_format",
  );
});
```

**Assert:** valid input passes; each required field's key; format rules (`slug`, `email`)
with `it.each` for the variants; optional fields accepted empty **and** omitted.

### b) `i18n/` — structural integrity across locales

No React. Compare every locale to the English reference and forbid empty values.

```ts
const EN_KEYS = flattenKeys(signUpEn);
it("de: has exactly the same keys as the English reference", () => {
  expect(flattenKeys(signUpDe)).toEqual(EN_KEYS);
});
it("de: has no empty string values", () => {
  expect(findEmptyValues(signUpDe)).toEqual([]);
});
```

**Assert:** identical key sets across `en`/`de`/`da`; no empty strings; translations differ
from English (catches copy-paste); ellipsis-character rules for `submitting`/placeholders.

### c) `api/` — MSW, assert what was sent and what comes back

```ts
it("should POST the payload to the accounts endpoint", async () => {
  const captured = captureRequestBody(ENDPOINT, {
    error: false,
    data: makeCreateAccountResponse(),
  });
  await createAccount(makeCreateAccountRequest());
  expect(captured.body).toEqual(makeCreateAccountRequest());
});

it("should reject with an ApiError carrying the server message and status", async () => {
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json({ error: true, message: "This slug is already taken." }, { status: 409 }),
    ),
  );
  const error = await createAccount(makeCreateAccountRequest()).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(409);
});
```

**Assert:** the request body (`captureRequestBody`); the **unwrapped** data on success;
`ApiError` (message + status) on `{ error: true }`.

### d) `hooks/` — `renderHook` inside a `QueryClientProvider`

The hook is the richest unit. Render it through `renderHookWithClient` (the shared hook
renderer — never hand-roll the `QueryClientProvider` wrapper); drive it via
`form.reset(makeSignUpFormValues())` + `onSubmit()`; use MSW for the mutation.

```ts
function renderSignUpForm() {
  return renderHookWithClient(() => {
    const hook = useSignUpForm();
    void hook.form.formState.errors; // subscribe like the component does, so result stays in sync
    return hook;
  });
}
```

Cover these groups (the reference suite's `describe` blocks):

- **Initial contract:** empty defaults; `isPending/isSuccess` false, `serverError/data` null.
- **Localized validation:** messages in `en` by default; switch with `changeLocale(DE/DA)`
  and assert `SIGN_UP_TRANSLATIONS[locale]`; the slug **format** message localizes too;
  re-localizes when the locale changes **after** mount.
- **Submission:** no mutation when invalid; exactly one call when valid (count via a
  `server.use` handler).
- **Payload mapping (`toPayload`):** the authoritative body assertions live here — required
  fields mapped, `settings` defaulted to `{}`, owner nested, empty `legalName`/`taxId`
  **omitted**, provided ones included (`captureRequestBody`).
- **Mutation outputs:** `data` populated + `serverError` null on success; `isPending` true
  in-flight then false (`deferResponse`); API message surfaced via `serverError` on failure;
  `FALLBACK_ERROR_MESSAGE` when the error has no message.

### e) `components/` (form) — RTL + `user-event`

Render with `makeComponent`; interact like a user. **Query by `data-testid`** from the
registry.

```ts
function renderForm() { return makeComponent(<SignUpForm />); }

it("should show the API error message inside an aria-live container", async () => {
  server.use(http.post("/api/v1/accounts", () =>
    HttpResponse.json({ error: true, message: "This slug is already taken." }, { status: 409 })));
  const user = userEvent.setup();
  renderForm();
  await fillRequiredFields(user);
  await user.click(screen.getByTestId(signUpFormIds.submitButton));
  const banner = await screen.findByTestId(signUpFormIds.serverError);
  expect(banner.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
});
```

Cover: **rendering** (both fieldsets, all fields, submit label); **validation wiring**
(surfaces required/format errors — exhaustive rules stay in the schema suite) and
**accessibility** (label↔input via `htmlFor`/`id`; `aria-required` on required fields only);
**optional fields** submit empty; **loading** (submit + fieldsets disabled, submitting
label — `deferResponse`); **success** (message replaces the form); **server errors**
(message in `aria-live`, fallback, form stays, banner clears on next success); **edge
cases** (no double submit on `dblClick`; values preserved after failure).

> The split of duties: exhaustive rule coverage → schema suite; localized/mutation behavior
> → hook suite; DOM/interaction/a11y → component suite. Don't duplicate across them.

### f) `<feature>.page.tsx` — composition + session gate

Render with `makeComponent`; drive the gate by setting the session store directly.

```ts
beforeEach(() => {
  useSessionStore.setState({ status: SESSION_STATUS.UNAUTHENTICATED, user: null });
});

it.each([
  ["idle", SESSION_STATUS.IDLE],
  ["loading", SESSION_STATUS.LOADING],
])("should render the skeleton while the session is %s", (_label, status) => {
  useSessionStore.setState({ status, user: null });
  renderPage();
  expect(screen.getByTestId(signUpSkeletonIds.skeleton)).toBeInTheDocument();
  expect(screen.queryByTestId(signUpPageIds.page)).not.toBeInTheDocument();
});
```

**Assert:** composes hero + form when resolved (internals belong to their own suites); shows
the skeleton and hides the page while `IDLE`/`LOADING`.

### g) `<feature>.route.ts` — guard behavior via the router factory

Build a small tree with `makeRouteTree`, mount at the screen's path with `makeRouter`, and
flip the session store to prove the guard.

```ts
function renderSignUpRoute() {
  const routeTree = makeRouteTree([
    guestGuardRoute.addChildren([signUpRoute]),
    authGuardRoute.addChildren([homePlaceholderRoute]),
  ]);
  return makeRouter(routeTree, { initialPath: "/sign-up" });
}

it("should redirect an authenticated user to /home", async () => {
  useSessionStore.setState({ status: SESSION_STATUS.AUTHENTICATED, user: makeSessionUser() });
  renderSignUpRoute();
  expect(await screen.findByTestId("home-page")).toBeInTheDocument();
});
```

**Assert:** unauthenticated visitor sees the page; authenticated user is redirected; an
in-progress (`IDLE`) session shows the skeleton, not a redirect. Route internals (skeleton
vs content, form/hero) are covered by the page/component suites.

### h) cross-cutting layers — stores, guards, transport (`lib/`)

Not everything testable is a feature slice. The `src/` root layers carry the platform's
hardest guarantees — session/permissions/tenancy, and the single door to the backend — so
they are tested with the **same shared infra** (`server`, `captureRequestBody`,
`deferResponse`, `makeSessionUser`, `makeRouteTree`/`makeRouter`). Real examples:
`stores/*.store.test.ts`, `router/guards/*.test.tsx`, `router/public-routes.test.ts`,
`lib/http-client.test.ts`, `lib/token-refresh.test.ts`.

- **Stores (Zustand).** Drive the store through its own API (`store.getState().action()`)
  and reset it in `beforeEach` with `setState`. Back any HTTP the action makes with MSW
  (`session.store` hits `/auth/me`, `/auth/login`, `/auth/logout`). Cover the state machine
  (`hydrate`: `LOADING → AUTHENTICATED|UNAUTHENTICATED`), the security-relevant invariants
  (`logout` clears locally **even when the request fails**; `hasRole` matches **exactly** —
  no prefix/substring/case leakage), and side effects for white-label (`theme.store` toggles
  the `dark` class / `color-scheme` / `theme-color` meta and survives a missing meta tag).
- **Route guards (permission & session gate).** Mount the guard under a small route tree
  with `makeRouteTree`/`makeRouter` and flip `useSessionStore.setState`. The **minimum**
  matrix: authorized → outlet; unauthenticated → `/sign-in`; authenticated-but-missing-role
  → `redirectTo`; and the **hydration lifecycle** — while `IDLE`/`LOADING` the guard holds
  (renders nothing) instead of flashing a redirect during startup. For permission gates,
  prove **exact** role matching with `it.each` (a prefix, a broader scope, and a different
  casing are all denied) and document the **tenant boundary**: the client guard is a
  permission gate only, so a different `tenantId` with the right role is still granted —
  cross-tenant enforcement is server-side (see `require-role.test.tsx`).
- **Transport (`lib/http-client`, `lib/token-refresh`).** This is the only door to the
  backend; test it at its own boundary with MSW, not through a feature. Cover envelope
  unwrapping (caller gets `data`, never the envelope), error mapping (`ApiError` with
  message + status on `{ error: true }` or a non-2xx; `NetworkError` when `fetch` rejects),
  the **401 → refresh → retry-once** flow (a successful refresh retries transparently; a
  failed one surfaces the 401; `skipRefresh` opts out; `503` refresh does **not** log the
  user out), single-flight de-duplication of concurrent refreshes, and fire-and-forget
  `postEmpty` (reaches the endpoint, never throws). `setUnauthenticatedHandler` injects the
  logout signal so the refresh branches are observable.

## 5. Summary matrix

| Layer          | SUT / renderer                            | Test doubles / drivers                              | Assertion focus                                                              |
| -------------- | ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| schema         | Zod object                                | key-echoing `t` stub                                | which message key per rule; valid/optional inputs                            |
| i18n           | locale objects                            | `flattenKeys` / `findEmptyValues`                   | identical keys, no empties, translations differ                              |
| api            | `create…` function                        | MSW (`captureRequestBody`)                          | request body; unwrapped data; `ApiError`(msg+status)                         |
| hook           | `renderHookWithClient`                    | MSW (`server.use`, `deferResponse`), `changeLocale` | defaults, localized validation, `toPayload`, mutation states                 |
| component      | `makeComponent` + `user-event`            | MSW, `deferResponse`                                | render, validation wiring, a11y, loading, success, errors, edge cases        |
| page           | `makeComponent`                           | `useSessionStore.setState`                          | composition + skeleton gate                                                  |
| route/guard    | `makeRouteTree` + `makeRouter`            | `useSessionStore.setState`, `makeSessionUser`       | guard redirect vs render; exact-role matching; hydration hold                |
| store          | `useXStore.getState()` + `setState` reset | MSW, `captureRequestBody`                           | state machine; logout-always-clears; `hasRole` exact; theme side-effects     |
| transport(lib) | `httpClient` / `attemptRefresh`           | MSW, `setUnauthenticatedHandler`                    | envelope unwrap; `ApiError`/`NetworkError`; 401→refresh→retry; single-flight |

## 6. Common mistakes (what NOT to do)

- ❌ A real HTTP call (or an unhandled request) in a test. ✅ Back every call with MSW; the
  setup fails on unhandled requests by design.
- ❌ Querying by brittle text/CSS. ✅ Query by `data-testid` from the feature's `test-ids`
  registry; use RTL role/label queries for accessibility assertions.
- ❌ Duplicating fixtures inline. ✅ Use the `make<Thing>(override)` factories in
  `@test-utils/`.
- ❌ Re-testing the same behavior in every suite. ✅ Rules → schema; localized/mutation →
  hook; DOM/interaction/a11y → component; composition → page; guard → route.
- ❌ Asserting the raw envelope in an API test. ✅ Assert the unwrapped data / `ApiError`.
- ❌ Leaving `retry` on in tests. ✅ Use `makeQueryClient` (retry disabled) so failures
  surface immediately.
- ❌ Testing loading states with a resolved response. ✅ Use `deferResponse` to hold the
  request open and observe the in-flight UI.
- ❌ Forgetting to register a new feature's handlers in `tests/server.ts`. ✅ Add them, or
  requests error out under `onUnhandledRequest: "error"`.
- ❌ Hand-rolling a `QueryClientProvider` wrapper inside a hook test. ✅ Use
  `renderHookWithClient` — the hook SUT renderer — so the wrapper lives in one place.
- ❌ A bare `render(...)` for a component test because it "has no hooks". ✅ Use
  `makeComponent` for every component/page so the renderer stays uniform.
- ❌ One loose `describe("<Unit>")` bundling happy path and every failure together. ✅ Split
  into scenario `describe`s (success vs. failure/edge states), AAA inside each `it`.
- ❌ Leaving the cross-cutting layers (stores, guards, `lib/` transport) untested because
  "they aren't a feature". ✅ They hold the session/permission/tenancy and transport
  guarantees — test them with the same shared infra (§4h).
