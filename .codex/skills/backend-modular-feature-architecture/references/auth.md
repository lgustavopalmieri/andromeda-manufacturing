# Authentication and authorization (cross-cutting concern)

> Reference for the `modular-feature-architecture` skill. Like testing and events,
> auth **crosses every layer**. Reference example: the protected route
> `POST /api/v1/devices` (`register` feature). The token stack (JWT via `jose`) is
> swappable — what matters is **where** each responsibility lives.

## 0. The core principle: separate authentication from authorization

Two different questions, two different places:

| Concern            | Question           | Where it lives                                                                                                | Why there                                                                                                                                 |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication** | _who are you?_     | **edge**: HTTP middleware in `platform/http/middlewares/auth/`                                                | the token is a detail of the **HTTP protocol** (the `Authorization: Bearer` header). It's the only part of auth that's protocol-specific. |
| **Authorization**  | _can you do this?_ | **each feature's application layer**, via the `AuthorizedUsecase` base class + the roles the feature declares | it's an access rule **of the use case**; it stays reusable, per-feature, and ready to scale (granular / multi-tenant).                    |

Consequences that must stay clear:

1. **The middleware only authenticates.** It resolves the identity
   (`{ userId, roles }`) and attaches it to the request. It **does not** decide
   whether the operation is allowed.
2. **Authorization is per-feature, in the application layer.** Each feature
   declares **which roles** it requires and its usecase **extends** `AuthorizedUsecase`.
   The identity **crosses the boundary** into the application — that's what lets it
   evolve toward granular (per-resource/attribute) and multi-tenant authorization
   **without** touching the edge.
3. **Authorization is protocol-agnostic.** If `inbound/mqtt/` shows up tomorrow, it
   will have **its own** authentication, but it reuses the same `AuthorizedUsecase`
   base and the same feature roles. Because the gate lives **inside** the usecase,
   every protocol that calls `execute` is covered by the same check.

## 1. The propagation: from the edge to the deepest layer

```
HTTP  Authorization: Bearer <jwt>
  │
  ▼  platform/http/middlewares/auth  (AUTHENTICATION — edge)
AuthenticationMiddleware.handle
  ├── extractToken (missing/malformed → MissingTokenError → 401)
  ├── tokenVerifier.verify(token) → AuthenticatedIdentity   (failure → InvalidTokenError → 401)
  └── req.identity = identity ; next()
  │
  ▼  platform/http/routes  (router.use(auth.authenticate) protects every route in the module)
  │
  ▼  inbound/http/http-handler  (feature)
RegisterDeviceHandler.handle
  ├── resolveIdentity(req)  (missing req.identity → MissingTokenError → 401, extra defense)
  └── usecase.execute(input, identity)
        │
        ▼  application (usecase extends AuthorizedUsecase, from @shared)  (AUTHORIZATION)
      RegisterDeviceUsecase.execute(input, identity)   (inherited from the base)
        ├── AccessControl.hasRequiredRoles(identity.roles, this.allowedRoles)
        │      └── insufficient → InsufficientRolesError → 403
        └── this.handle(input)               (the feature's business step, WITHOUT identity)
              │
              ▼ domain → outbound → DB   (know nothing about auth)
```

## 2. Layer by layer (with the reference code)

### `@shared/auth/` — contracts, policy, and the base usecase

The identity contract and the authentication _port_ (protocol-agnostic):

```ts
// identity.ts
export type Role = string;

export interface AuthenticatedIdentity {
  userId: string;
  roles: readonly Role[];
}

export interface TokenVerifierInterface {
  verify(token: string): Promise<AuthenticatedIdentity>;
}
```

The **access policy** is pure and static (easy to test, no dependencies):

```ts
// access-control.ts
export class AccessControl {
  public static hasRequiredRoles(
    grantedRoles: readonly Role[],
    allowedRoles: readonly Role[],
  ): boolean {
    if (allowedRoles.length === 0) return true; // "public" route for authz
    return allowedRoles.some((role) => grantedRoles.includes(role)); // OR: one is enough
  }
}
```

The **authorized port** and the **base usecase** are the pattern's core:

```ts
// @shared/auth/authorized-usecase.ts
export interface AuthorizedUsecaseInterface<TInput, TOutput> {
  execute(input: TInput, identity: AuthenticatedIdentity): Promise<TOutput>;
}

export abstract class AuthorizedUsecase<TInput, TOutput> implements AuthorizedUsecaseInterface<
  TInput,
  TOutput
> {
  protected abstract readonly allowedRoles: readonly Role[];

  public async execute(input: TInput, identity: AuthenticatedIdentity): Promise<TOutput> {
    if (!AccessControl.hasRequiredRoles(identity.roles, this.allowedRoles)) {
      throw new InsufficientRolesError();
    }
    return this.handle(input);
  }

  protected abstract handle(input: TInput): Promise<TOutput>;
}
```

`AuthorizedUsecase` is a **template method**. It owns `execute`, runs the role gate
**first**, and only then calls the abstract `handle` — the feature's business step.
A feature **cannot** run its logic without passing the gate, because the base owns
`execute` and the feature only fills in `handle`: the check isn't a step you can
forget to call, it's structural. Reuse comes from inheritance — every feature
declares its own `allowedRoles` and implements `handle`; the gate is shared. The
inner `handle` receives only the `input`; it knows **nothing** about identity or
auth (until a resource-scoped rule genuinely needs it — see §6).

Auth errors (their own family, with a business message) and the mock:

```ts
// errors.ts
export abstract class AuthError extends Error {}
export class MissingTokenError extends AuthError {
  /* "Authentication token was not provided." */
}
export class InvalidTokenError extends AuthError {
  /* "...invalid or expired." (customizable message) */
}
export class InsufficientRolesError extends AuthError {
  /* "You do not have the required roles..." */
}

// token-verifier.mock.ts
export const makeTokenVerifierMock = (identity: AuthenticatedIdentity): TokenVerifierInterface => ({
  verify: vi.fn(async () => identity),
});
```

### `entity/` — roles are module vocabulary

```ts
// modules/device/entity/device.roles.ts
export const DEVICE_ROLES = {
  READ: "devices:read",
  WRITE: "devices:write",
  UPDATE: "devices:update",
  DECOMMISSION: "devices:decommission",
} as const;
export type DeviceRole = (typeof DEVICE_ROLES)[keyof typeof DEVICE_ROLES];
```

Roles live in the **entity** because they're stable module vocabulary (just like
the status enums). They're **scoped to the resource** (`devices:*`), which already
prepares for granular per-resource authorization in the future. Same const-object +
derived-type pattern.

### `application/` — the feature declares its roles and extends the base

```ts
// features/register/application/authorization.ts
export const REGISTER_DEVICE_ALLOWED_ROLES: readonly DeviceRole[] = [DEVICE_ROLES.WRITE];

// features/register/application/interfaces.ts
export type AuthorizedRegisterDeviceUsecaseInterface = AuthorizedUsecaseInterface<
  RegisterDeviceInputProps,
  DeviceEntityInterface
>;

// features/register/application/usecase.ts
export class RegisterDeviceUsecase extends AuthorizedUsecase<
  RegisterDeviceInputProps,
  DeviceEntityInterface
> {
  protected readonly allowedRoles: readonly DeviceRole[] = REGISTER_DEVICE_ALLOWED_ROLES;

  constructor(
    private readonly deviceRepository: RegisterDeviceRepositoryInterface,
    private readonly eventPublisher: RegisterDeviceEventPublisherInterface,
  ) {
    super();
  }

  protected async handle(input: RegisterDeviceInputProps): Promise<DeviceEntityInterface> {
    const device = DeviceRegister.create(input);
    const registeredDevice = await this.deviceRepository.save(device);
    await this.eventPublisher.publish(new DeviceRegisteredEvent(registeredDevice));
    return registeredDevice;
  }
}
```

- `authorization.ts` is where the **feature declares what it requires**
  (`devices:write` to register). It's a constant placed **right next to the
  feature's application layer** — the operation's access policy lives close to the
  operation.
- `interfaces.ts` exposes **one** usecase port: the `AuthorizedUsecaseInterface`
  (what `inbound` consumes). There's no separate "pure" port anymore.
- `usecase.ts` **extends `AuthorizedUsecase`**, declares its `allowedRoles`, and puts
  the business orchestration in `handle`. The inherited `execute` runs the role gate
  before `handle`, so the roles the feature requires are covered by the **feature's
  own unit test**, not only end-to-end.

### `platform/auth/` — the concrete token verifier

```ts
// jwt-token-verifier.ts  (implements TokenVerifierInterface with jose / RS256)
export class JwtTokenVerifier implements TokenVerifierInterface {
  public async verify(token: string): Promise<AuthenticatedIdentity> {
    try {
      const { payload } = await jwtVerify(token, await this.resolveKey(), {
        algorithms: this.options.algorithms,
      });
      return this.toIdentity(payload); // sub → userId ; roles[] (strings only)
    } catch (error) {
      if (error instanceof InvalidTokenError) throw error;
      throw new InvalidTokenError(); // any failure becomes an auth domain error
    }
  }
}
```

Translates the JWT world into the `AuthenticatedIdentity` contract: it requires the
`sub` claim (otherwise `InvalidTokenError` with a specific message) and extracts
`roles`, filtering out non-strings. Key/algorithms come from `configs/auth.ts`
(`AUTH_JWT_PUBLIC_KEY`, `AUTH_JWT_ALGORITHMS`). Swapping JWT for another technology
= a new implementation behind the same interface.

### `platform/http/middlewares/auth/` — authentication at the edge

```ts
// authenticated-request.ts  (augments Express's type)
declare module "express-serve-static-core" {
  interface Request {
    identity?: AuthenticatedIdentity;
  }
}

// authentication.middleware.ts
export class AuthenticationMiddleware {
  constructor(
    private readonly tokenVerifier: TokenVerifierInterface,
    private readonly observability: ObservabilityInterface,
  ) {}

  public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const response = new AuthHttpResponse(res);
    try {
      const token = this.extractToken(req); // missing/malformed → MissingTokenError
      req.identity = await this.tokenVerifier.verify(token);
      next();
    } catch (error) {
      this.observability.capture(error);
      response.mapError(error); // 401 (token) / 500
    }
  }
}
```

```ts
// auth-http-response.ts  (the EDGE's error mapper, extends @shared's HttpResponse)
export class AuthHttpResponse extends HttpResponse {
  public mapError(error: unknown): void {
    if (error instanceof MissingTokenError || error instanceof InvalidTokenError)
      return this.fail(401, error.message);
    return this.fail(500, "Internal server error");
  }
}

// build-auth-middlewares.ts  (the middleware's composition root — the edge's "wire")
export const buildAuthMiddlewares = (): AuthMiddlewares => {
  const observability = new PinoObservability();
  const tokenVerifier = new JwtTokenVerifier({
    publicKey: AUTH_CONFIG.publicKey,
    algorithms: [...AUTH_CONFIG.algorithms],
  });
  const authentication = new AuthenticationMiddleware(tokenVerifier, observability);
  return { authenticate: authentication.handle.bind(authentication) };
};
```

The middleware mirrors the feature handler: it depends on **interfaces**
(`TokenVerifierInterface`, `ObservabilityInterface`), captures observability, and
delegates error mapping to an `HttpResponse`. `build-auth-middlewares.ts` is its
composition root (the edge's equivalent of `wire`).

### `platform/http/routes/` — where authentication is applied

```ts
// device.routes.ts
export class DeviceRouter {
  public static build(auth: AuthMiddlewares): Router {
    const router = Router();
    router.use(auth.authenticate); // protects EVERY route in the module
    router.post("/", RegisterDeviceWire.provideHandler());
    return router;
  }
}

// api-routes.ts
export const buildApiRoutes = () => {
  const auth = buildAuthMiddlewares(); // built once
  return [
    { prefix: `${API_VERSIONS.v1}/liveness`, router: LivenessRouter.build() }, // no auth
    { prefix: `${API_VERSIONS.v1}/devices`, router: DeviceRouter.build(auth) },
  ];
};
```

Authentication is applied at the **module's router** level (`router.use`), not
route by route; liveness stays outside it. `auth` is built once and injected.

### `inbound/http/` handler — receives the identity and passes it along

```ts
export class RegisterDeviceHandler {
  constructor(
    private readonly usecase: AuthorizedRegisterDeviceUsecaseInterface, // the AUTHORIZED port
    private readonly observability: ObservabilityInterface,
  ) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const response = new RegisterDeviceHttpResponse(res);
    try {
      const input = req.body as RegisterDeviceInputProps;
      const identity = this.resolveIdentity(req); // defense: 401 if missing
      const result = await this.usecase.execute(input, identity); // passes the identity along
      response.success(result);
    } catch (error) {
      this.observability.capture(error);
      response.mapError(error);
    }
  }

  private resolveIdentity(req: Request): AuthenticatedIdentity {
    if (!req.identity) throw new MissingTokenError();
    return req.identity;
  }
}
```

The handler depends on the **authorized usecase port** and just **passes along** the
identity the middleware set on `req.identity`. `resolveIdentity` is defense in
depth: if the route weren't protected, the handler would still block with `401`.
The handler is unchanged whether the usecase is a decorator or the base class — it
only knows the `execute(input, identity)` port.

### `wire` — no authorization step

```ts
const usecase = new RegisterDeviceUsecase(repository, eventPublisher);
const handler = new RegisterDeviceHandler(usecase, observability);
```

Authorization needs **no wiring**: it's baked into the usecase, which extends
`AuthorizedUsecase` and declares its own `allowedRoles`. The wire just builds the
usecase and hands it to the handler. (Authentication does **not** appear in the
feature's wire either — it belongs to the edge, assembled in
`build-auth-middlewares`.)

### `http-response-mapper` — maps auth errors to statuses

```ts
public mapError(error: unknown): void {
    if (error instanceof MissingTokenError || error instanceof InvalidTokenError)
        return this.fail(401, error.message)
    if (error instanceof InsufficientRolesError) return this.fail(403, error.message)
    if (error instanceof DeviceAlreadyExistsError) return this.fail(409, error.message)
    if (error instanceof DeviceRegisterError) return this.fail(422, error.message)
    if (error instanceof RepositoryError) return this.fail(500, "Internal server error")
    return this.fail(500, "Internal server error")
}
```

Since authorization happens **inside** the usecase, `InsufficientRolesError`
bubbles up to the handler and is mapped here (`403`). The
**specific → generic** order still holds; auth errors come first.

## 3. Status map (auth)

| Situation                                         | Error                    | Status                |
| ------------------------------------------------- | ------------------------ | --------------------- |
| No token / non-Bearer header                      | `MissingTokenError`      | `401`                 |
| Invalid/expired token, bad signature, missing sub | `InvalidTokenError`      | `401`                 |
| Authenticated, but missing the required role      | `InsufficientRolesError` | `403`                 |
| (others)                                          | domain / repository      | `409` / `422` / `500` |

## 4. How to add auth to a new feature

1. **Roles** (entity): make sure the required role exists in `<module>.roles.ts`.
2. **application**: create `authorization.ts` with `<FEAT>_ALLOWED_ROLES` and expose
   `Authorized<Feat>UsecaseInterface = AuthorizedUsecaseInterface<In, Out>` in
   `interfaces.ts`. `usecase.ts` **extends `AuthorizedUsecase`**, sets
   `allowedRoles = <FEAT>_ALLOWED_ROLES`, and implements `handle(input)`.
3. **inbound handler**: depend on the **authorized** usecase port, call
   `resolveIdentity(req)`, and pass the identity to `execute(input, identity)`.
4. **wire**: just `new <Feat>Usecase(...)` → handler. There's **no** authorization
   step to wire — the gate is in the usecase.
5. **response-mapper**: map `MissingTokenError`/`InvalidTokenError` → 401 and
   `InsufficientRolesError` → 403 (before the domain errors).
6. **route**: make sure the module's router applies `auth.authenticate`.
7. Authentication (the middleware) **already exists** and is reused — you **don't**
   recreate it per feature.

## 5. Testing — unit, integration, and e2e

General pattern detail in `references/testing.md`. Per auth piece:

### Unit

- **`AccessControl`** (`@shared`, pure): grants with a matching role present; grants
  when `allowedRoles` is empty; denies with no overlap; denies with empty roles.
  `sut` = the class itself.
- **`AuthorizedUsecase`** (`@shared`): a small `StubAuthorizedUsecase` subclass with a
  known `allowedRoles` and a `handle` that records its input; authorized → `handle`
  runs with the input and its output is resolved; unauthorized (and empty roles) →
  `rejects InsufficientRolesError` **and** `handle` did **not** run. This proves the
  gate-before-business ordering generically, once.
- **Feature usecase** (`application`): each feature's `usecase.test.ts` goes through
  `execute(input, identity)` and covers its **own** role binding as a
  `describe("when fails")` case (**not** a separate `authorization` describe) —
  denies without the required role and asserts the repository/collaborators were
  **not** touched, which proves the gate runs before the business step. This is the
  per-feature role coverage that used to exist only in e2e.
- **`JwtTokenVerifier`** (`platform`, unit with real crypto): generates a key pair
  with `jose` in the test; a valid token → `{ userId, roles }`; no `roles` claim →
  `[]`; filters out non-string roles; malformed / wrong signature / missing `sub` →
  `InvalidTokenError`. It's a unit test (no external system), but uses real
  cryptography.
- **`AuthenticationMiddleware`** (`platform`): `express` + `supertest`, with
  `makeTokenVerifierMock` (or a rejecting verifier) + an observability mock. Valid →
  `200` + `req.identity` set + `verify` called with the token; no header /
  non-Bearer → `401`; verifier rejects → `401`; and `observability.capture` is
  called.
- **`AuthHttpResponse`** (`platform`): `makeHttpResponseMock` — `401` for token
  errors, `500` for unknown ones.
- **Feature handler** (`inbound`): the test app injects the identity through a short
  middleware (`req.identity = identity`); `UsecaseStub implements
AuthorizedRegisterDeviceUsecaseInterface` (`execute` receives input **and**
  identity). Covers `201`, `401` when there **is no** identity (`identity: null` →
  `resolveIdentity` throws), and the `422/409/500` mapping + `capture`.

### Integration

- There's no auth repository; auth's "integration" happens at the **e2e** level
  (real app + real JWT). `JwtTokenVerifier` already exercises real cryptography in
  its unit test.

### E2E — `test/e2e/device/register.e2e.test.ts`

Exercises the **entire** propagation: middleware (authn) → route → handler →
usecase (authz gate via `AuthorizedUsecase`) → domain → outbound → real Postgres.

The support code (`test/e2e/app.support.ts`) assembles the real environment:

```ts
export const startE2EApp = async (): Promise<E2EContext> => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });

  process.env.DATABASE_HOST = container.getHost(); // ...remaining DB vars
  process.env.AUTH_JWT_PUBLIC_KEY = await exportSPKI(publicKey);
  process.env.AUTH_JWT_ALGORITHMS = "RS256";

  // DYNAMIC import only AFTER setting env, so configs/* read the correct values
  const { AppDataSource, initializeDatabase } =
    await import("platform/database/postgres/data-source.js");
  const { HttpServer } = await import("platform/http/server.js");
  const { buildApiRoutes } = await import("platform/http/routes/api-routes.js");

  await initializeDatabase(AppDataSource, { runMigrations: true });
  const app = new HttpServer({ port: 0, routes: buildApiRoutes() }).createServer();

  const issueToken = (roles = [], userId = "user-e2e") =>
    new SignJWT({ roles })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(userId)
      .setExpirationTime("5m")
      .sign(privateKey); // signs with the private key

  const teardown = async () => {
    await AppDataSource.destroy();
    await container.stop();
  };
  return { app, dataSource: AppDataSource, container, issueToken, teardown };
};
```

Crucial e2e points:

- **Real keys**: the test generates an RS256 pair, publishes the public one to
  `AUTH_JWT_PUBLIC_KEY`, and signs tokens with the private one via
  `issueToken(roles)`. The service validates for real — nothing is mocked.
- **Dynamic import after setting env**: `configs/*` reads `process.env` at import
  time; that's why the modules are imported **after** the variables are set
  (otherwise they'd pick up the wrong config). An essential e2e pattern.
- **`createServer()` with no `listen`**: `supertest` runs the app in memory
  (`port: 0`).
- **Covered cases (register)**: `201` with `devices:write` (+ persistence checked in
  the database); `401` with no token; `401` malformed token; `403` with
  `devices:read` (authenticated, missing the write role); `422` for an unsupported
  type (domain rule, already authorized).
- **Parallel e2e (get-one)**: `test/e2e/device/get-one.e2e.test.ts` seeds a device
  through the repository and covers `200` with `devices:read`, `401` with no token,
  `403` with a non-read token (proving the `devices:read` binding), and `404` for a
  missing id. Each feature carries its own role-mapping e2e.

Execution: `npm run test:e2e` (config `vitest.e2e.config.ts`:
`include **/*.e2e.test.ts`, same aliases, 120s/180s timeouts; the unit config
**excludes** `*.e2e.test.ts`).

## 6. Future: granular and multi-tenant authorization (additive)

The design already leaves the door open — the **identity crosses the boundary**
into the application (`execute(input, identity)`). To evolve:

- **Granular by resource/attribute**: swap/extend the policy in `AccessControl`
  (or a `PolicyInterface`) to consider the resource and the `input`'s attributes;
  the `AuthorizedUsecaseInterface` signature already delivers `identity` + `input`.
  When the business step itself needs the identity (e.g., checking tenant ownership
  on the **loaded** resource), widen the base's `handle(input)` to
  `handle(input, identity)` — a one-line change to `AuthorizedUsecase`, then each
  feature that needs it reads the identity in `handle`.
- **Multi-tenant**: add `tenantId` to `AuthenticatedIdentity` (the `TokenVerifier`
  extracts it from the token) and have the policy/usecase validate ownership
  (`identity.tenantId === resource.tenantId`). The edge doesn't change.
- **New protocol**: a new `inbound/<proto>/` brings its own authentication (another
  verifier/middleware), but **reuses** the same `AuthorizedUsecase` gate + the
  feature's roles — the check is in the usecase, so it covers every protocol.

None of this breaks the current CRUD: these are additions of policy and identity
fields.

## 7. Common mistakes (what NOT to do)

- ❌ Doing **authorization in the middleware** (checking roles at the edge). ✅ The
  middleware only authenticates; authorization is per-feature, in the application
  (the usecase extends `AuthorizedUsecase`).
- ❌ Passing the identity into the **domain** or into `handle`. ✅ The base's
  `execute` uses the identity for the gate; `handle` receives only `input` (until a
  resource-scoped rule genuinely needs it — §6).
- ❌ Re-implementing the role check inside `handle` (or forgetting to call it). ✅
  The gate is inherited from `AuthorizedUsecase.execute`; the feature only fills in
  `handle`, so it can't be skipped.
- ❌ Calling the JWT SDK/lib directly from the middleware or the application. ✅
  Behind `TokenVerifierInterface`; the concrete implementation (`JwtTokenVerifier`)
  lives in `platform/`.
- ❌ Leaking token details to the client (the internal reason for the failure). ✅
  A generic auth `401`; `500` for the unexpected.
- ❌ Confusing `401` (not authenticated) with `403` (authenticated, no permission).
  ✅ Missing/invalid token → `401`; insufficient role → `403`.
- ❌ Protecting routes one by one and missing one. ✅
  `router.use(auth.authenticate)` at the module's router level; and the handler
  still has `resolveIdentity` as a defense.
- ❌ In e2e, importing the modules **before** setting the env vars. ✅ Dynamic
  import after configuring `process.env` (otherwise `configs/*` reads the wrong
  values).
- ❌ Loose role strings scattered around. ✅ `DEVICE_ROLES` (const object) in the
  entity.
