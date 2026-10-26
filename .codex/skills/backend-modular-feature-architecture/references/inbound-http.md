# `inbound/http/` layer — HTTP input adapter

Reference: `src/modules/device/features/register/inbound/http/`.
Wire lives here; see `references/wire.md` for its separate responsibilities.

## 1. Core concept

Inbound adapts a protocol request into a usecase call and returns protocol-specific
output. HTTP, MQTT, gRPC or CLI adapters can share the same unchanged usecase;
the protocol belongs in the inbound subfolder.

## 2. Role and when to use it

Extract body/params/query and middleware-attached identity; call `usecase.execute`,
capture errors and delegate statuses/envelopes to the mapper. No business rules,
database access or dependency assembly (wire owns assembly).

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

Inject `AuthorizedRegisterDeviceUsecaseInterface` and `ObservabilityInterface`, never
concretes. The thin handler extracts input/identity, invokes usecase and delegates
responses; every catch captures the error before mapping it. No raw errors escape.
`resolveIdentity` throws `MissingTokenError` (`401`) if middleware identity is missing,
even on an accidentally unprotected route. Authorization runs in the usecase
(`references/auth.md`); status codes belong only in the mapper.

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

Extend shared HttpResponse (`references/shared.md`): `ok(status, data)` gives
`{ error: false, data }`; `fail(status, msg)` gives `{ error: true, message }`.
Order checks from specific to generic: auth first; `DeviceAlreadyExistsError` → `409`
**before** its `DeviceRegisterError` base → `422`. Domain messages are intentionally
client-facing. Repository/unknown errors become generic `500 "Internal server error"`,
never technical messages, database details or stack traces.

### This feature's status map

| Situation | Error | Status | Body |
| --- | --- | --- | --- |
| Success | — | `201` | `{ error: false, data }` |
| Not authenticated | MissingTokenError / InvalidTokenError | `401` | `{ error: true, message }` |
| Missing role | InsufficientRolesError | `403` | `{ error: true, message }` |
| Invalid business input | DeviceRegisterError family | `422` | Domain message |
| Uniqueness conflict | DeviceAlreadyExistsError | `409` | Domain message |
| Persistence failure | RepositoryError | `500` | `{ error: true, message: "Internal server error" }` |
| Unknown | Any Error | `500` | Same generic envelope |

### Variations (from the `create-account` feature)

- **Public endpoint:** resolve missing identity to anonymous rather than raising `401`;
  the usecase's empty allowedRoles accepts it (`references/auth.md` and public-endpoint
  test in [application.md](application.md#public-endpoint)):

  ```ts
  const ANONYMOUS_IDENTITY: AuthenticatedIdentity = {
    userId: "",
    tenantId: "",
    roles: [],
    firstName: "",
  };
  const identity = req.identity ?? ANONYMOUS_IDENTITY;
  ```

- **Edge validation:** validate structured payload shape with Zod before the usecase;
  parse failure → RequestValidationError → `400`. Domain revalidation remains mandatory;
  business-rule failure → `422`.
- **Upstream failure:** IdentityProviderError indicates IdP provisioning failure, not
  client-fixable input. Map it before its feature error base to `502` with a stable,
  generic message, never upstream detail:

  ```ts
  if (error instanceof IdentityProviderError)
    return this.fail(502, "Failed to provision the account identity. Please try again later.");
  if (error instanceof CreateAccountError) return this.fail(422, error.message);
  ```

Client-fixable errors are 4xx (`400` shape, `422` business, `409` conflict); infrastructure
failures are generic 5xx (`502` failed dependency, `500` repository/unexpected).

## 4. Interfaces and testability

Read [common testing rules](testing.md) before writing this layer's tests.

### Handler

Use real Express + supertest with an authorized-port UsecaseStub, observability mock
and middleware attaching req.identity, without a database.

```ts
const makeSut = (
  overrides: Partial<UsecaseStub> = {},
  identity: AuthenticatedIdentity | null = makeIdentity(),
): MakeSutInterface => {
  const usecase = Object.assign(new UsecaseStub(), overrides);
  const observability = makeObservabilityMock();
  const handler = new RegisterDeviceHandler(usecase, observability);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (identity) req.identity = identity;
    next();
  });
  app.post("/devices", handler.handle.bind(handler));
  return { app, usecase, observability };
};

describe("RegisterDeviceHandler", () => {
  describe("when the request has no authenticated identity", () => {
    it("should return 401", async () => {
      const { app } = makeSut({}, null);
      const res = await request(app).post("/devices").send(makeRegisterDeviceInput());
      expect(res.status).toBe(401);
    });
  });

  describe("when the usecase rejects the input", () => {
    it("should return 422 with the domain error message", async () => {
      const { app, usecase } = makeSut();
      vi.spyOn(usecase, "execute").mockRejectedValue(new DeviceNameRequiredError());
      const res = await request(app).post("/devices").send(makeRegisterDeviceInput());
      expect(res.status).toBe(422);
      expect(res.body).toEqual({ error: true, message: "Device name is required." });
    });
  });
});
```

Assert success 201/envelope, missing-identity 401, every 422/409/403/500 mapping and
observability.capture(error).

Always bind the handler method when registering it in a test route.

### Response mapper

Test directly without Express/HTTP.

```ts
const makeSut = (): MakeSutInterface => {
  const res = makeHttpResponseMock();
  return { sut: new RegisterDeviceHttpResponse(res), res };
};

describe("RegisterDeviceHttpResponse", () => {
  describe("when mapping a duplicate-device error", () => {
    it("should call res with status 409 and the domain error message", () => {
      const { sut, res } = makeSut();
      sut.mapError(new DeviceAlreadyExistsError("SN-123456"));
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: true, message: "...already registered." });
    });
  });
});
```

Assert every mapError branch (specific → generic) and success, using makeHttpResponseMock
with chainable status/json vi.fn methods.

## 5. How to start (new feature)

1. Create `features/<feat>/inbound/http/`.
2. Define `<Feat>HttpResponse extends HttpResponse` in `http-response-mapper.ts`:
   success (`201` create, `200` read/update), auth `401`/`403`, specific feature errors,
   domain family, RepositoryError and generic `500` fallback.
3. Define `<Feat>Handler` with usecase/observability ports. In handle: try →
   resolveIdentity → execute(input, identity) → success; catch → capture + mapError.
4. Then create wire (`references/wire.md`).

## 6. Common mistakes (what NOT to do)

- Inject dependencies; never instantiate usecase/repository/observability in handler.
- No scattered status/JSON calls; all responses use the standardized mapper envelope.
- Specific subtypes precede bases (AlreadyExists before RegisterError).
- Never expose technical error messages; use generic `500`.
- Always capture caught errors before responding.
- Keep Express/req/res out of the usecase.
- Do not map upstream failures to `422`/`409` or expose raw messages; use generic `502`
  for failed dependencies. Reserve 4xx for client-fixable problems.
