# `domain/` layer — pure business rule

> Reference for the `modular-feature-architecture` skill. Reference example:
> `src/modules/device/features/register/domain/`.

## 1. Core concept

`domain/` is the **heart of the feature**: the business rules, validations, and
domain errors, **isolated** from any framework, I/O, or protocol. It's pure
TypeScript that takes an input, applies the rules, and returns valid data — or
throws a **domain error** with an appropriate message.

If you could run `domain/` in a terminal with no database, no HTTP, and no infra
mocks, it would still work. That's the mental test.

## 2. Role and when to use it

Use `domain/` for **everything that is a business rule of the feature**: what's
valid, what's required, default values, normalization (trim), invariants. This is
where business language becomes code.

Don't reach for `domain/` to: orchestrate a repository call (that's
`application/`), read `req.body` (that's `inbound/`), translate a database error
(that's `outbound/`).

> **Where do roles (authorization) live?** The feature's `domain/` **has no**
> roles. The module's role **catalog** lives in `entity/` (`<module>.roles.ts`, e.g.,
> `DEVICE_ROLES`), as stable module vocabulary; the **roles required by each
> feature** live in `application/authorization.ts`; and the **check** is inherited
> from the `AuthorizedUsecase` base class (`@shared/auth`) that the feature's usecase
> extends. Full detail in `references/auth.md`.

## 3. File structure (`register` example)

```
domain/
├── device.register.ts   # the rule: a static ActionName class with create()
├── errors.ts            # the feature's domain-error hierarchy
├── rules.ts             # constants/policies (what's registrable)
└── types.ts             # input/output types derived from the entity
```

### `rules.ts` — explicit policies

```ts
import {
  DEVICE_STATUS,
  DEVICE_TYPE,
  INGEST_PROTOCOL,
  type DeviceStatus,
  type DeviceType,
  type IngestProtocol,
} from "../../../entity/device.types.js";

export const REGISTRABLE_DEVICE_TYPES: readonly DeviceType[] = [DEVICE_TYPE.GATEWAY];
export const SUPPORTED_INGEST_PROTOCOLS: readonly IngestProtocol[] = [INGEST_PROTOCOL.MQTT];
export const REGISTRABLE_DEVICE_STATUSES: readonly DeviceStatus[] = [
  DEVICE_STATUS.ACTIVE,
  DEVICE_STATUS.INACTIVE,
];
export const DEFAULT_DEVICE_STATUS: DeviceStatus = DEVICE_STATUS.ACTIVE;
```

The v1 business rules (only `gateway` is registrable, only `mqtt`, cannot be born
`decommissioned`) become **named constants**, not scattered magic values. The rule
stays readable and testable, and the reasoning behind it lives in the module's
business documentation.

### `types.ts` — input/output derived from the entity

```ts
import type { DeviceEntityInterface } from "../../../entity/device.entity.js";
import type { DeviceStatus } from "../../../entity/device.types.js";

export type RegisterDeviceInputProps = Omit<
  DeviceEntityInterface,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
> & { status?: DeviceStatus };

export type RegisterDeviceOutputProps = Omit<
  DeviceEntityInterface,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
```

The feature's types **derive from the entity** via `Omit`/`&`, so contract changes
propagate on their own. The **input** has no `id`/timestamps (the infra generates
them) and has an optional `status` (the domain resolves the default). The
**output** is what will be persisted: already with `status` resolved, still without
the fields the database generates.

### `errors.ts` — the domain-error hierarchy

```ts
export abstract class DeviceRegisterError extends Error {}

export class DeviceNameRequiredError extends DeviceRegisterError {
  public readonly name = "DeviceNameRequiredError";
  constructor() {
    super("Device name is required.");
  }
}

export class UnsupportedDeviceTypeError extends DeviceRegisterError {
  public readonly name = "UnsupportedDeviceTypeError";
  constructor(type: string, supported: readonly string[]) {
    super(`Device type "${type}" is not supported. Supported types: ${quoteList(supported)}.`);
  }
}
// ... TelemetryRequiredError, UnsupportedTelemetryProtocolError,
//     TelemetryAddressRequiredError, InvalidDeviceStatusError, DeviceAlreadyExistsError
```

Key points:

- One **abstract base class** per feature (`DeviceRegisterError`) lets the inbound
  layer do `error instanceof DeviceRegisterError` and map the whole family to `422`
  at once.
- Every error has an explicit `name` and a clear **business message** (which
  becomes the HTTP response body).
- `DeviceAlreadyExistsError` also extends `DeviceRegisterError`, but is **thrown by
  the outbound layer** (when translating a Postgres uniqueness violation) and mapped
  to `409`. The domain **defines** the error; the layer that detects it **throws**
  it.

### `device.register.ts` — the rule as a static class

```ts
export class DeviceRegister {
  public static create(input: RegisterDeviceInputProps): RegisterDeviceOutputProps {
    return {
      name: DeviceRegister.normalizeName(input.name),
      type: DeviceRegister.validateType(input.type),
      telemetry: DeviceRegister.validateTelemetry(input.telemetry),
      status: DeviceRegister.resolveStatus(input.status),
      ...DeviceRegister.optionalMetadata(input),
    };
  }

  private static normalizeName(name: string): string {
    const normalized = name?.trim();
    if (!normalized) throw new DeviceNameRequiredError();
    return normalized;
  }
  // validateType, validateTelemetry, resolveStatus, optionalMetadata ...
}
```

Why a static class with one public `create` and private helpers:

- **Stateless**: the rule is a pure input → output transformation; it needs neither
  an instance nor injection. Trivial to call (`DeviceRegister.create(input)`) and to
  test.
- **One public, several private**: `create` composes named steps
  (`validateType`, `validateTelemetry`...). Each step does one thing and throws its
  specific error. It reads like the feature's spec.
- **Normalization + validation together**: `trim`, the status default, and
  **omitting** blank optional metadata all happen here, guaranteeing the output is
  already canonical.

## 4. Interfaces and testability

`domain/` doesn't depend on an infra interface — it **is** the innermost dependency.
Its testability comes from being **pure and synchronous**: the test calls
`DeviceRegister.create(input)` and asserts directly on the return value or the
thrown error, with no mocks at all. It's the cheapest and most valuable layer to
test; cover every success path and every domain error. Details in
`references/testing.md`.

## 5. How to start (new feature)

1. Create `features/<feat>/domain/`.
2. `rules.ts`: turn every business rule into a named (`readonly`) constant,
   importing the enums from `entity/`.
3. `types.ts`: derive `<Feat>InputProps` and `<Feat>OutputProps` from the entity
   with `Omit`/`&`.
4. `errors.ts`: create the abstract base `<Feat>Error extends Error` and one
   concrete error per invariant, with a `name` and a business message.
5. `<entity>.<feat>.ts`: a static class with one public method
   (`create`/`apply`/...) that composes private validation/normalization helpers.
6. Never use `async`/I/O here.

## 6. Common mistakes (what NOT to do)

- ❌ Importing `application`, `inbound`, `outbound`, `platform`, `express`, or
  `typeorm`. ✅ Only `entity/` and the domain's own sibling files.
- ❌ Calling a repository/HTTP inside the rule. ✅ The domain is pure; I/O belongs
  to application/outbound.
- ❌ Throwing a generic `Error` or a string. ✅ Throw an error that extends the
  feature's abstract base, with a business message.
- ❌ Returning "almost valid" data and leaving validation to the database. ✅ The
  domain's output is already canonical (trimmed, defaulted, no blank fields).
- ❌ Scattering magic numbers/strings. ✅ Centralize them in `rules.ts`.
- ❌ Setting an optional metadata field to `""`/`undefined`. ✅ Omit it when blank
  (the `optionalMetadata` pattern).
