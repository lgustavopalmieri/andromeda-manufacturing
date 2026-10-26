# State, transport, auth, routing & entity contracts

> Reference for the `frontend-modular-feature-architecture` skill. Covers the `src/` root
> plumbing every feature relies on: `stores/` (Zustand), TanStack Query, `lib/` (the HTTP
> transport), the router/guards, and `types/entities/`. Reference code lives in
> `src/lib/**`, `src/stores/**`, `src/router/**`, and `src/types/entities/**`.

## 1. Two kinds of state

Keep the split sharp:

- **Server state → TanStack Query.** Anything that comes from or goes to the backend
  (queries, mutations). Lives inside feature hooks (`useMutation` in `use-sign-up-form`).
  A single `QueryClient` is created in `main.tsx` and provided app-wide.
- **Client/global state → Zustand.** Session, theme, locale — state the whole app reads
  that isn't owned by the server. Lives in `src/stores/`.

> **Don't copy server data into a Zustand store.** The session store is the one place they
> meet: it _derives_ its user from a backend call (`/auth/me`) but exposes it as global
> client state because routing/guards need it synchronously.

## 2. `lib/http-client` — the only door to the backend

Every feature calls the backend through `httpClient`. It centralizes four things:
the base URL, the cookie credential, the response **envelope**, and the transparent
**401 → refresh → retry**.

```ts
// lib/http-client.ts — the envelope + retry core (trimmed)
export interface ApiResponse<T> {
  error: boolean;
  data?: T;
  message?: string;
}

async function request<T>(path: string, init: RequestOptions, isRetry = false): Promise<T> {
  const { skipRefresh, ...fetchInit } = init;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...fetchInit,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...fetchInit.headers },
    });
    const body = (await res.json()) as ApiResponse<T>;

    if (res.status === 401 && !isRetry && !skipRefresh) {
      const refreshed = await attemptRefresh();
      if (refreshed) return request<T>(path, init, true);
      throw new ApiError(body.message ?? FALLBACK_ERROR_MESSAGE, 401);
    }
    if (!res.ok || body.error) {
      throw new ApiError(body.message ?? FALLBACK_ERROR_MESSAGE, res.status);
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new NetworkError();
  }
}

export const httpClient = {
  get<T>(path, options?) {
    return request<T>(path, { method: "GET", ...options });
  },
  post<T>(path, data, options?) {
    return request<T>(path, { method: "POST", body: JSON.stringify(data), ...options });
  },
  postEmpty(path) {
    return requestEmpty(path, { method: "POST" });
  }, // fire-and-forget (e.g. logout)
};
```

Contract for callers (the `api/` layer):

- **Cookie auth.** `credentials: "include"` sends the auth cookie; the client never
  handles tokens (there is no `keycloak-js` on the client — auth is cookie-based via the
  backend).
- **Unwrapped result.** On success the client returns `body.data` (typed `T`), not the
  envelope. `api/` functions therefore return `Promise<Response>` of the unwrapped shape.
- **Errors are thrown, typed.** A non-2xx or `{ error: true }` throws an `ApiError(message,
status)`; a thrown/rejected `fetch` becomes a `NetworkError`. The message defaults to
  `FALLBACK_ERROR_MESSAGE` when the server sends none.

```ts
// lib/http-error.ts
export const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    /* … */
  }
}
export class NetworkError extends Error {
  /* "Unable to reach the server…" */
}
```

Because the hook does `serverError: mutation.error?.message ?? null`, whatever `ApiError`
carries is exactly the banner text the user sees — so the message is a UX contract.

### `lib/token-refresh` — single-flight refresh

`attemptRefresh()` calls `POST /api/v1/auth/refresh` and **deduplicates concurrent calls**
with a module-level `refreshPromise` (many 401s in parallel trigger one refresh). It also
holds an injected `onUnauthenticated` handler:

```ts
// lib/token-refresh.ts (trimmed)
let refreshPromise: Promise<boolean> | null = null;
export async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise; // single-flight
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 503) return false; // backend down → don't log the user out
      if (!res.ok) {
        onUnauthenticated?.();
        return false;
      } // truly unauthenticated → clear session
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler;
}
```

`main.tsx` wires the handler once: clear the session store and, unless the current path is
public, navigate to `/sign-in`.

## 3. `stores/session.store` — the session state machine

The session is a small explicit state machine plus the authenticated user (carrying
**tenancy** and **roles**). It's the source of truth for guards and permission-driven UI.

```ts
// stores/session.store.ts (trimmed)
export const SESSION_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
} as const;
export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export interface SessionUser {
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: SESSION_STATUS.IDLE,
  user: null,
  hydrate: async () => {
    set({ status: SESSION_STATUS.LOADING });
    try {
      const user = await httpClient.get<SessionUser>("/api/v1/auth/me");
      set({ status: SESSION_STATUS.AUTHENTICATED, user });
    } catch {
      set({ status: SESSION_STATUS.UNAUTHENTICATED, user: null });
    }
  },
  loginAndHydrate: async (identifier, password) => {
    await httpClient.post("/api/v1/auth/login", { identifier, password });
    await get().hydrate();
  },
  logout: async () => {
    await httpClient.postEmpty("/api/v1/auth/logout");
    get().clear();
  },
  clear: () => set({ status: SESSION_STATUS.UNAUTHENTICATED, user: null }),
  hasRole: (role) => get().user?.roles.includes(role) ?? false,
}));
```

Rules:

- **`main.tsx` hydrates before first render.** It calls `hydrate()` and only mounts the
  app in `.finally(...)`, so the very first paint already knows if the user is
  authenticated (no auth flicker). While `IDLE`/`LOADING`, screens render a skeleton
  (see the page gate in `references/feature-slice.md` §6).
- **Tenancy rides in `user.tenantId`.** Never hard-code or pass a tenant around; read it
  from the session.
- **Permissions:** `hasRole(role)` and the `RequireRole` guard check `user.roles[]`. Role
  literals come from `types/entities/*.roles.ts` (e.g. `ACCOUNT_ROLES.READ`).
- **Subscribe narrowly:** `useSessionStore((s) => s.status)` in components/pages to avoid
  re-rendering on unrelated changes.

`theme.store` and `locale.store` follow the same Zustand shape; `locale.store` uses the
`persist` middleware (key `andromeda-locale`) and syncs `i18n.changeLanguage` on set and
rehydrate (see `references/i18n.md`).

## 4. Routing & guards (code-based TanStack Router)

The route tree is **assembled by hand** — no file-based plugin, no generated tree.

- `router/routes/` holds **pathless layout/guard routes**: `root.route`,
  `guest-guard.route`, `auth-guard.route`, `app-layout.route`. A guard route's `component`
  is a guard that reads the session store and renders `<Outlet/>` or `<Navigate/>`.
- `router/guards/` holds the guard components: `RequireAuth`, `RequireGuest`, `RequireRole`.

```tsx
// router/guards/require-guest.tsx — reference example
export function RequireGuest() {
  const status = useSessionStore((s) => s.status);
  if (status === SESSION_STATUS.AUTHENTICATED) return <Navigate to="/home" />;
  return <Outlet />;
}
```

- `router.tsx` composes the whole tree and registers the router type:

```tsx
export const routeTree = rootRoute.addChildren([
  setPasswordRoute,
  guestGuardRoute.addChildren([landingRoute, signInRoute, signUpRoute]),
  authGuardRoute.addChildren([
    appLayoutRoute.addChildren([homeRoute, accountsGuardRoute.addChildren([accountRoute])]),
  ]),
]);
```

- **Where does a screen hang?** Guest-only (`sign-up`, `sign-in`, `landing`) → under
  `guestGuardRoute`. Authenticated → under `authGuardRoute` → `appLayoutRoute`. Role-gated
  (e.g. `account`) → under a dedicated role-guard route (`accountsGuardRoute`).
- `router/public-routes.ts` exports `isPublicRoute(path)`, used by the unauthenticated
  handler to decide whether to redirect to `/sign-in`.

To add a screen: create its `<feature>.route.ts` with `getParentRoute` pointing at the
right guard (see `references/feature-slice.md` §7), then add it to `router.tsx`.

## 5. `types/entities/` — contracts shared with the backend

Entity shapes the UI needs are declared once, mirroring the backend's entity contracts,
and reused by API DTOs, factories, and components.

```
types/entities/account/
├── account.entity.ts      # AccountEntityInterface (the aggregate shape)
├── account.interfaces.ts  # nested value objects: AccountBranding, AccountSettings
├── account.types.ts       # as-const enums: ACCOUNT_STATUS, ACCOUNT_PLAN
└── account.roles.ts       # permission literals: ACCOUNT_ROLES ("accounts:read", …)
```

```ts
// account.types.ts — enums are as-const objects + derived type (never native enum)
export const ACCOUNT_PLAN = {
  TRIAL: "trial",
  STARTER: "starter",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;
export type AccountPlan = (typeof ACCOUNT_PLAN)[keyof typeof ACCOUNT_PLAN];

// account.roles.ts — granular permission literals, resource:action
export const ACCOUNT_ROLES = { READ: "accounts:read", WRITE: "accounts:write" /* … */ } as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[keyof typeof ACCOUNT_ROLES];
```

Conventions:

- **Split by concern:** `.entity.ts` (shape) / `.interfaces.ts` (value objects) /
  `.types.ts` (enums) / `.roles.ts` (permissions). `UserPermission = AccountRole | UserRole`
  composes permission unions across entities.
- **API DTOs are built from these** with `Pick`/`Partial` (see the `sign-up` API in
  `references/feature-slice.md` §3), so a backend field change surfaces as a type error.
- **Enums** follow the same `as const` rule as the backend — never a native `enum`.

## 6. Common mistakes (what NOT to do)

- ❌ Calling `fetch` from a feature or handling tokens client-side. ✅ Go through
  `httpClient`; auth is cookie-based, refresh is transparent.
- ❌ An `api/` function returning the `{ error, data }` envelope. ✅ Return unwrapped data;
  the client throws `ApiError`/`NetworkError`.
- ❌ Storing server data in Zustand. ✅ TanStack Query owns server state; Zustand owns
  session/theme/locale.
- ❌ Hard-coding a tenant or duplicating a role string. ✅ `tenantId`/`roles` come from the
  session; role literals from `types/entities/*.roles.ts`.
- ❌ Rendering protected content before the session resolves. ✅ Gate on
  `SESSION_STATUS`; `main.tsx` hydrates before first paint.
- ❌ Reinventing route protection per screen. ✅ Hang the route off the right guard route;
  guards read the session store centrally.
- ❌ A native `enum` in an entity type. ✅ `as const` object + derived type.
