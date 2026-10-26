# Authentication and authorization (cross-cutting concern)

Reference: protected `POST /api/v1/devices` (register). Auth crosses layers; JWT/jose is
swappable, responsibility placement is not.

## 0. The core principle: separate authentication from authorization

| Concern | Question | Owner |
| --- | --- | --- |
| Authentication | Who are you? | HTTP edge: `platform/http/middlewares/auth/`; Bearer tokens are protocol details |
| Authorization | May you do this? | Each feature's application: AuthorizedUsecase + declared roles; protocol-neutral |

Middleware resolves/attaches identity (`userId`, roles); **never authorizes operations**.
Each feature extends AuthorizedUsecase and declares roles. Identity crosses into
application, enabling granular/resource/attribute and tenant policies without edge
changes. New MQTT input has its own authentication but reuses this same execute gate.

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

Protocol-neutral identity and authentication port:

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

Pure static access policy, with no dependencies:

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

Authorized port and template-method base:

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

Base-owned execute gates **before** abstract handle, so features cannot forget the
check. Each declares allowedRoles and implements handle; handle receives input only,
not identity/auth, until resource-scoped rules genuinely need it (§6).

Auth errors have their own family/business messages; keep the mock alongside:

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

Use const object + derived type with resource-scoped values (`devices:*`), like stable
status vocabulary, ready for granular resource policies.

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

- authorization.ts: required roles near the operation (`devices:write` for register).
- interfaces.ts: **one authorized port** consumed by inbound; no separate pure port.
- usecase.ts: extends AuthorizedUsecase, sets allowedRoles, implements handle orchestration.
  Feature unit tests cover this role binding, not only E2E.

### `platform/auth/` — provider-neutral port and errors

Keep generic token-verification ports/errors here. Provider-neutral OIDC/JWT verifiers
may live here; Keycloak-bound implementations use platform/keycloak + configs/keycloak.ts.

### `platform/keycloak/` — the Keycloak JWT verifier

```ts
// keycloak/keycloak-jwt-token-verifier.ts
export class KeycloakJwtTokenVerifier implements TokenVerifierInterface {
  public async verify(token: string): Promise<AuthenticatedIdentity> {
    try {
      const { payload } = await jwtVerify(token, await this.resolveKey(), {
        algorithms: this.options.algorithms,
      });
      return this.toIdentity(payload); // sub/auth_time/amr only; never roles or scopes
    } catch (error) {
      if (error instanceof InvalidTokenError) throw error;
      throw new InvalidTokenError(); // any failure becomes an auth domain error
    }
  }
}
```

Translate access tokens into the identity contract; require sub and **do not derive
authorization from JWT roles/scopes**. jose provides JWT/JWKS crypto without needing
Keycloak Admin SDK. Realm issuer, KEYCLOAK_* config and default
`.../protocol/openid-connect/certs` endpoint make this Keycloak-owned. Generic verifiers
use platform/auth + configs/auth.ts and must not retain a Keycloak name.

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
  const tokenVerifier = new KeycloakJwtTokenVerifier(loadKeycloakJwtVerificationConfig());
  const authentication = new AuthenticationMiddleware(tokenVerifier, observability);
  return { authenticate: authentication.handle.bind(authentication) };
};
```

Depend on TokenVerifierInterface/ObservabilityInterface, capture errors and map through
HttpResponse. build-auth-middlewares.ts is this edge's composition root.

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

Build auth once and inject it. Apply router.use at module scope, not per route;
leave liveness outside authentication.

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

Pass req.identity to the authorized `execute(input, identity)` port. resolveIdentity
provides defense-in-depth 401 even if route protection is missing. Handler depends on
that port regardless of whether the implementation is a decorator or base class.

### `wire` — no authorization step

```ts
const usecase = new RegisterDeviceUsecase(repository, eventPublisher);
const handler = new RegisterDeviceHandler(usecase, observability);
```

Build usecase → handler, without authorization wrappers: gate/allowedRoles are in the
usecase. Authentication is also absent here; edge build-auth-middlewares assembles it.

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

InsufficientRolesError propagates from usecase to handler/mapper (`403`). Check auth
before domain errors, and specific subtypes before generic families.

## 3. Status map (auth)

| Situation | Error | Status |
| --- | --- | --- |
| Missing token/non-Bearer header | MissingTokenError | `401` |
| Invalid/expired token, bad signature, missing sub | InvalidTokenError | `401` |
| Authenticated without required role | InsufficientRolesError | `403` |
| Other domain/repository failures | Feature errors | `409` / `422` / `500` |

## 4. How to add auth to a new feature

1. Ensure required role exists in entity/<module>.roles.ts.
2. Declare application authorization.ts roles, authorized usecase port and base subclass:
   allowedRoles + handle(input).
3. Handler resolves identity and calls authorized execute(input, identity).
4. Wire constructs usecase → handler; no separate gate.
5. Mapper: token errors → 401, insufficient roles → 403, before domain errors.
6. Ensure module router applies auth.authenticate.
7. Reuse existing authentication middleware; do not recreate it per feature.

## 5. Testing

Read [common testing rules](testing.md); these cases belong to the auth implementations above.

### Unit

- AccessControl (static SUT): matching role grants; empty allowedRoles grants;
  no overlap or empty user roles denies.
- AuthorizedUsecase: stub subclass with known roles and input-recording handle;
  authorized resolves handle output/input, unauthorized/empty roles rejects
  InsufficientRolesError **without calling handle**, proving ordering.
- Feature usecase: follow [application tests](application.md#basic-usecase), including
  its own role binding and denial before any collaborator is called.
- KeycloakJwtTokenVerifier: **real crypto** with jose-generated keys, no external service.
  Valid token yields AuthenticatedIdentityInterface with providerSubjectId, authentication
  instant and optional authentication method; roles/scopes remain absent even if in JWT.
  Malformed, wrong signature/audience, expired or missing-sub tokens → InvalidTokenError.
- AuthenticationMiddleware: Express + supertest, makeTokenVerifierMock/rejecting verifier
  and observability mock. Valid → 200, identity attached, verify(token) called; missing/
  non-Bearer header or rejected verification → 401; errors captured.
- AuthHttpResponse + makeHttpResponseMock: token errors 401, unknown errors 500.
- Feature handler: follow [handler tests](inbound-http.md#handler), using the authorized
  usecase port and the shared identity factory.

### Integration

No auth repository: integration happens in real-app/real-JWT E2E; verifier unit tests
already exercise real cryptography.

### E2E — `test/e2e/device/register.e2e.test.ts`

Follow [E2E assembly and lifecycle](e2e.md): real application, Testcontainers and real
JWT verification, without injected identities or mocked auth gates. Exercise middleware
→ route → handler → usecase authorization → domain → outbound → real Postgres.

- Generate real RS256 keys; set AUTH_JWT_PUBLIC_KEY and sign with the private key via
  issueToken(roles) for the reference verifier. Match the actual verifier's issuer,
  audience, algorithm and key/JWKS configuration; do not bypass verification.
- Register: devices:write → 201 + DB persistence; no/malformed token → 401;
  devices:read → 403; authorized unsupported type → 422.
- get-one (`test/e2e/device/get-one.e2e.test.ts`): seed through the repository;
  devices:read → 200; no token → 401; non-read token → 403; missing ID → 404.
  Every feature retains its own E2E role-binding coverage.

## 6. Future: granular and multi-tenant authorization (additive)

Identity + input already cross the authorized port; evolve additively without breaking CRUD:

- Resource/attribute policy: extend AccessControl or PolicyInterface using resource/input.
  When ownership of a loaded resource needs identity in the business step, widen base
  handle(input) to handle(input, identity), then consume it only in features needing it.
- Tenant isolation: extend AuthenticatedIdentity with token-derived tenantId and validate
  identity.tenantId === resource.tenantId in policy/usecase; no edge changes.
- New protocol: own verifier/middleware, same AuthorizedUsecase gate and feature roles.

## 7. Common mistakes (what NOT to do)

- No role checks in middleware; it authenticates, application authorizes.
- Do not pass identity into domain or handle unless the §6 resource-scoped extension
  genuinely requires it. Base execute owns the gate.
- Do not duplicate or omit checks in handle; inherit execute.
- No JWT SDK calls in middleware/application; use TokenVerifierInterface and place
  Keycloak-bound implementation in platform/keycloak.
- Never leak token failure reasons: generic auth 401, unknown 500.
- Distinguish missing/invalid identity (401) from insufficient permission (403).
- Protect module router once, retaining handler resolveIdentity as defense in depth.
- Set E2E environment before imports.
- No scattered role strings; use entity DEVICE_ROLES const catalog.
