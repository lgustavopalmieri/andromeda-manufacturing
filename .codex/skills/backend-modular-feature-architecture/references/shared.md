# `modules/@shared/` — cross-module contracts and utilities

Reference: `src/modules/@shared/`.

## 1. Core concept

Shared holds genuinely cross-feature/module contracts, bases and utilities without
module-specific business rules. It belongs under modules because it defines contracts
features consume; platform provides their concrete implementations.

## 2. Role and when to use it

Use shared for business-agnostic contracts/utilities used by two or more features/modules
(or clearly about to be). Keep single-feature needs local: duplicate once rather than
create a premature abstraction; promote when a second real use demonstrates the pattern.

## 3. What exists today

```
@shared/
├── errors/repository.error.ts        # RepositoryError (generic persistence failure)
├── http/
│   ├── http-response.ts              # HttpResponse (abstract envelope base)
│   └── http-response.mock.ts         # Response mock for testing mappers
├── observability/
│   ├── observability.ts              # ObservabilityInterface + ObservabilityContext
│   ├── observability.mock.ts         # makeObservabilityMock()
│   └── composite-observability.ts    # CompositeObservability (fan-out)
└── tests/                            # cross-module TEST infrastructure (test-only)
    ├── factories/<module>/           # data factories grouped by module (make<Thing>)
    └── testcontainers/               # shared container setup (e.g., setup-postgres)
```

Auth/events also live here; see `SKILL.md` for their anatomy.

### `http/http-response.ts` — the envelope base

```ts
export abstract class HttpResponse {
  constructor(protected readonly res: Response) {}

  protected ok<T>(status: number, data: T): void {
    this.res.status(status).json({ error: false, data });
  }

  protected abstract mapError(error: unknown): void;

  protected fail(status: number, message: string): void {
    this.res.status(status).json({ error: true, message });
  }
}
```

Standardize success `{ error: false, data }` and failure `{ error: true, message }`.
Features extend HttpResponse in `http-response-mapper.ts` (`RegisterDeviceHttpResponse`)
with their own error → status `mapError` (`references/inbound-http.md`).

### `observability/observability.ts` — the observability contract

```ts
export interface ObservabilityContext {
  readonly [key: string]: unknown;
}

export interface ObservabilityInterface {
  capture(error: unknown, context?: ObservabilityContext): void;
}
```

Handlers depend on this contract and use `makeObservabilityMock` in tests; concrete
`PinoObservability` stays in platform. Shared `CompositeObservability` implements the
same interface, fans out to log/trace/metric targets and isolates each target's failure.

### `errors/repository.error.ts` — generic persistence failure

```ts
export class RepositoryError extends Error {
  public readonly name = "RepositoryError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
```

A module-agnostic technical persistence failure: outbound fallback throws it with cause;
inbound maps it to generic `500`. It belongs in shared, not a feature's domain.

### Shared mocks (`*.mock.ts`)

Keep `http-response.mock.ts`/`makeHttpResponseMock` and
`observability.mock.ts`/`makeObservabilityMock` next to their contracts. Reuse them across
feature mapper/handler tests instead of rewriting them.

### `tests/` — cross-module test infrastructure (the one allowed exception)

Unlike business-agnostic runtime shared code, this **test-only** subtree may name modules:

- `factories/<module>/`: `make<Thing>(overrides = {})` data factories, grouped by module
  (`machine/machine.factory.ts`, `account/account.factory.ts`). Cross-module tests can
  seed account + machine without reaching into those modules' internals. Centralize
  them here; see [Data factories](#data-factories) for the implementation pattern.
- `testcontainers/`: reusable container setup (`setup-postgres`) for integration suites.

No production code belongs here. **Only tests may import `@shared/tests/**`**; runtime
layers must never depend on it. This boundary permits module-specific fixture names.

## 4. Interfaces and testability

Keep interface + mock together in shared and concrete implementation in platform,
allowing layers to depend on contracts with reusable test doubles.

Read [common testing rules](testing.md) for suite structure, fixtures and doubles.

### Data factories

```ts
// @shared/tests/factories/device/device.factory.ts
export const makeTelemetrySource = (overrides: Partial<TelemetrySource> = {}): TelemetrySource => ({
  protocol: INGEST_PROTOCOL.MQTT,
  address: "andromeda/plants/plant-01/devices/gateway-01/telemetry",
  ...overrides,
});

export const makeDeviceEntity = (
  overrides: Partial<DeviceEntityInterface> = {},
): DeviceEntityInterface => ({
  id: 1,
  name: "Gateway 01",
  type: DEVICE_TYPE.GATEWAY,
  telemetry: makeTelemetrySource(),
  status: DEVICE_STATUS.ACTIVE,
  createdAt: new Date("2026-07-16T00:00:00.000Z"),
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  ...overrides,
});

// @shared/tests/factories/device/register.factory.ts
export const makeRegisterDeviceInput = (
  overrides: Partial<RegisterDeviceInputProps> = {},
): RegisterDeviceInputProps => {
  const { name, type, telemetry } = makeDeviceEntity();
  return { name, type, telemetry, ...overrides };
};
```

Use valid defaults + overrides spread last (`make<Thing>(overrides = {})`); scenarios
specify only what matters (`makeRegisterDeviceInput({ name: "   " })`). Group by module,
not feature: fixtures serve register/find/update and cross-module integration needs.


## 5. How to start / when to promote something to `@shared`

1. Start in the feature; consider promotion on the second real use.
2. For contracts, add `...Interface` + adjacent `*.mock.ts`; implement in platform.
3. For agnostic bases/utilities, choose the appropriate shared area (`errors/`, `http/`)
   without referencing business modules.

## 6. Common mistakes (what NOT to do)

- No module-specific runtime rules/types in shared; only test-only module factories
  under `@shared/tests/factories/<module>/` are exempt.
- Do not share abstractions on first use; wait for repetition.
- No concrete Pino/TypeORM infrastructure; shared defines contracts, platform implements.
- Keep mocks next to their contracts.
- Do not leak shared into pure domain unnecessarily; use contracts only where they
  genuinely apply (e.g. RepositoryError in outbound).
