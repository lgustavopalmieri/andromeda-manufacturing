# `inbound/http/` layer — HTTP input adapter

> Reference for the `modular-feature-architecture` skill. Reference example:
> `src/modules/device/features/register/inbound/http/`. `wire.ts` lives here, but has
> its own reference: `references/wire.md`.

## 1. Core concept

`inbound/` is the **input adapter**: it translates a request from a specific
protocol (here, HTTP) into a usecase call and returns the response in that
protocol's format. It's the hexagon's "front door".

`inbound/http/` is the HTTP adapter. Tomorrow there could be `inbound/mqtt/`,
`inbound/grpc/`, or `inbound/cli/` for the same feature — **the usecase doesn't
change**, it just gains another adapter. That's why `http` is a subfolder: the
protocol is an inbound detail.

## 2. Role and when to use it

Use `inbound/http/` to: read the `req` (body/params/query), resolve the identity the
authentication middleware attached, call `usecase.execute(...)`, capture errors for
observability, and **map** the result (or the error) to the correct **HTTP status**
and response envelope.

Don't put here: business rules, database access, or dependency instantiation
(that's `wire`'s job).

## 3. File structure (`register` example)

```
inbound/http/
├── http-handler.ts          # the controller: req -> usecase -> response
├── http-response-mapper.ts  # translates success/error into status + envelope
└── wire.ts                  # composition root (see references/wire.md)
```

### `http-handler.ts` — the thin controller

```ts
import { type Request, type Response } from "express";
import { MissingTokenError } from "modules/@shared/auth/errors.js";
import type { AuthenticatedIdentity } from "modules/@shared/auth/identity.js";
import type { ObservabilityInterface } from "modules/@shared/observability/observability.js";
import type { AuthorizedRegisterDeviceUsecaseInterface } from "../../application/interfaces.js";
import type { RegisterDeviceInputProps } from "../../domain/types.js";
import { RegisterDeviceHttpResponse } from "./http-response-mapper.js";

export class RegisterDeviceHandler {
  constructor(
    private readonly usecase: AuthorizedRegisterDeviceUsecaseInterface,
    private readonly observability: ObservabilityInterface,
  ) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const response = new RegisterDeviceHttpResponse(res);
    try {
      const input = req.body as RegisterDeviceInputProps;
      const identity = this.resolveIdentity(req);
      const result = await this.usecase.execute(input, identity);
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

Key points:

- Depends on **interfaces** (`AuthorizedRegisterDeviceUsecaseInterface`,
  `ObservabilityInterface`), never on concrete classes. That's what lets you test
  the handler with a `UsecaseStub` and an observability mock.
- The handler is **thin**: it extracts the input, resolves the identity the
  authentication middleware attached to `req`, calls the usecase, and delegates the
  response to the mapper. Every `catch` goes through **observability** (`capture`)
  and then error mapping — no error escapes unlogged or leaks raw to the client.
- `resolveIdentity` is defense in depth: even if the route weren't protected, a
  missing identity throws `MissingTokenError` (→ 401). The identity flows into the
  usecase, where the authorization gate lives — see `references/auth.md`.
- It has no business rule and knows nothing about `status codes` directly (that's
  the mapper's job).

### `http-response-mapper.ts` — domain error → HTTP status

```ts
import {
  InsufficientRolesError,
  InvalidTokenError,
  MissingTokenError,
} from "modules/@shared/auth/errors.js";
import { RepositoryError } from "modules/@shared/errors/repository.error.js";
import { HttpResponse } from "modules/@shared/http/http-response.js";
import { DeviceAlreadyExistsError, DeviceRegisterError } from "../../domain/errors.js";

export class RegisterDeviceHttpResponse extends HttpResponse {
  public success<T>(data: T): void {
    this.ok(201, data);
  }

  public mapError(error: unknown): void {
    if (error instanceof MissingTokenError || error instanceof InvalidTokenError)
      return this.fail(401, error.message);
    if (error instanceof InsufficientRolesError) return this.fail(403, error.message);
    if (error instanceof DeviceAlreadyExistsError) return this.fail(409, error.message);
    if (error instanceof DeviceRegisterError) return this.fail(422, error.message);
    if (error instanceof RepositoryError) return this.fail(500, "Internal server error");
    return this.fail(500, "Internal server error");
  }
}
```

This is the **anti-corruption layer** between the domain's error vocabulary and
HTTP statuses:

- It extends `HttpResponse` (the `@shared` base, see `references/shared.md`), which
  provides `ok(status, data)` → `{ error: false, data }` and `fail(status, msg)` →
  `{ error: true, message }`. The envelope is standardized across the whole
  service.
- **The `instanceof` order matters**: auth errors first, then the domain family.
  `DeviceAlreadyExistsError` is a subtype of `DeviceRegisterError`, so it must be
  tested **first** to become `409` instead of falling into the family's generic
  `422`. The auth error mapping is detailed in `references/auth.md`.
- **Technical errors don't leak**: `RepositoryError` and unknown errors become
  `500 "Internal server error"` — a generic message, with no stack trace or
  database detail.
- **Domain messages leak on purpose**: for `422`/`409`, the domain's `error.message`
  is the response (it's business language, meant for the client).

### This feature's status map

| Situation                   | Error                                     | Status | Body                                                |
| --------------------------- | ----------------------------------------- | ------ | --------------------------------------------------- |
| Success                     | —                                         | `201`  | `{ error: false, data }`                            |
| Not authenticated           | `MissingTokenError` / `InvalidTokenError` | `401`  | `{ error: true, message }`                          |
| Missing role                | `InsufficientRolesError`                  | `403`  | `{ error: true, message }`                          |
| Invalid input               | `DeviceRegisterError` family              | `422`  | `{ error: true, message }` (domain message)         |
| Already exists (uniqueness) | `DeviceAlreadyExistsError`                | `409`  | `{ error: true, message }`                          |
| Persistence failure         | `RepositoryError`                         | `500`  | `{ error: true, message: "Internal server error" }` |
| Unknown                     | any `Error`                               | `500`  | same                                                |

### Variations (from the `create-account` feature)

Not every feature maps input and errors identically. `account/create-account` shows
three common deviations — all still handled in the handler/mapper, never by leaking
infra:

- **Public endpoint → anonymous identity, no `401`.** When the feature requires no
  role, the handler **falls back to an anonymous identity** instead of throwing
  `MissingTokenError`; the empty `allowedRoles` gate in the usecase lets it through
  (see `references/auth.md` and the public-endpoint test in `references/testing.md`):

  ```ts
  const ANONYMOUS_IDENTITY: AuthenticatedIdentity = {
    userId: "",
    tenantId: "",
    roles: [],
    firstName: "",
  };
  const identity = req.identity ?? ANONYMOUS_IDENTITY;
  ```

- **Edge input validation → `400`.** A feature with a structured payload validates the
  **shape** at the edge with a Zod schema before calling the usecase; a parse failure
  becomes a `RequestValidationError` mapped to `400` — distinct from the domain's
  `422` (a business-rule violation). The domain still re-validates: the schema is a
  fast, shape-level guard, not a replacement for the rule.

- **Upstream dependency failure → `502`, not `422`.** `IdentityProviderError` means the
  external IdP (Keycloak) failed to provision the tenant. The client cannot fix that by
  changing the payload, so it maps to **`502` (Bad Gateway)** with a **stable, generic
  message** — placed **before** the domain-family `422` branch (it's a subtype of the
  feature's error base) and **without** leaking the upstream detail:

  ```ts
  if (error instanceof IdentityProviderError)
    return this.fail(502, "Failed to provision the account identity. Please try again later.");
  if (error instanceof CreateAccountError) return this.fail(422, error.message);
  ```

  The rule generalizes: **client-fixable → 4xx** (`400` shape, `422` business, `409`
  conflict); **upstream/infra, not client-fixable → 5xx** (`502` a failed dependency,
  `500` an unexpected/repository error — always a generic message).

## 4. Interfaces and testability

Two testing fronts (both unit tests, see `references/testing.md`):

- **Handler**: built on a test `express()` + `supertest`, with a
  `UsecaseStub implements AuthorizedRegisterDeviceUsecaseInterface` (its `execute`
  receives input **and** identity), a short middleware that sets `req.identity`, and
  an observability mock (`makeObservabilityMock`). It checks status/body on success,
  `401` when there's no identity, and every error mapping, plus that
  `observability.capture` was called with the error.
- **Response mapper**: tested directly with a mocked `Response`
  (`makeHttpResponseMock`), asserting `res.status(...)`/`res.json(...)` for every
  branch of `mapError` + `success`.

Swapping the real usecase for a stub is only possible because the handler depends
on the **interface**. It's the same principle as the application layer, now at the
input edge.

## 5. How to start (new feature)

1. Create `features/<feat>/inbound/http/`.
2. `http-response-mapper.ts`: `class <Feat>HttpResponse extends HttpResponse` with a
   `success(data)` (the verb's correct status: `201` for create, `200` for
   read/update) and a `mapError(error)` covering, **from most specific to most
   generic**, the auth errors (`401`/`403`), the feature's errors, `RepositoryError`,
   and the `500` fallback.
3. `http-handler.ts`: `class <Feat>Handler` receiving `Authorized...UsecaseInterface`
   - `ObservabilityInterface` through the constructor; in `handle`, `try` →
     `resolveIdentity(req)` → `usecase.execute(input, identity)` → `response.success`;
     `catch` → `observability.capture` + `response.mapError`.
4. Only then create `wire.ts` (see `references/wire.md`).

## 6. Common mistakes (what NOT to do)

- ❌ Instantiating usecase/repository/observability inside the handler. ✅ It
  receives everything through the constructor; assembly is `wire`'s job.
- ❌ Scattering `status`/`json` calls across the handler. ✅ Every response goes
  through the mapper (`success`/`fail`), with a standardized envelope.
- ❌ Testing `DeviceRegisterError` before `DeviceAlreadyExistsError` in `mapError`.
  ✅ From the most specific subtype to the most generic.
- ❌ Leaking `error.message` from `RepositoryError`/a technical error to the
  client. ✅ `500 "Internal server error"`.
- ❌ Forgetting `observability.capture(error)` in the catch. ✅ Every error is
  captured before responding.
- ❌ Coupling the usecase to Express. ✅ The usecase knows nothing about
  `req`/`res`; only the handler does.
- ❌ Mapping an **upstream dependency failure** (e.g. an identity-provider error) to
  `422`/`409`, or leaking its raw message. ✅ It's a `5xx` (`502` for a failed
  dependency) with a stable, generic message; `4xx` is for client-fixable errors only.
