# `modules/@shared/` — cross-module contracts and utilities

> Reference for the `modular-feature-architecture` skill. Reference path:
> `src/modules/@shared/`.

## 1. Core concept

`@shared` holds what is **genuinely common to more than one module/feature**:
contracts (interfaces), base classes, and utilities that standardize the service's
behavior, **without** carrying any specific module's business rules.

Think of `@shared` as the "lingua franca" between modules: the HTTP response
format, the observability contract, the generic repository error. It lives under
`modules/` (close to the business logic) — and not under `platform/` — because it
defines **contracts that the domain/feature use**, while `platform/` brings the
**concrete implementations** of those contracts.

## 2. Role and when to use it

Only put something in `@shared` **when**:

- it's used by **two or more** features/modules (or clearly will be), and
- it's **business-agnostic** (it doesn't talk about `device`, `plant`, etc.), and
- it's a **contract or utility**, not a rule.

If it's used by a single feature, keep it in the feature. Duplicating once is
cheaper than building the wrong shared abstraction. Promote it to `@shared` once a
second real use case shows up.

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

(`auth/` and `events/` also live here — see the anatomy in `SKILL.md`; the tree
above lists the pieces this reference details.)

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

Standardizes the **response envelope** across the whole service: success is
`{ error: false, data }`, failure is `{ error: true, message }`. Each feature
extends this base in its own `http-response-mapper.ts` (e.g.,
`RegisterDeviceHttpResponse`) and implements `mapError` with its own
error-vocabulary → status mapping. The base guarantees consistency; the subclass
brings the feature's mapping rules (see `references/inbound-http.md`).

### `observability/observability.ts` — the observability contract

```ts
export interface ObservabilityContext {
  readonly [key: string]: unknown;
}

export interface ObservabilityInterface {
  capture(error: unknown, context?: ObservabilityContext): void;
}
```

The **contract** lives in `@shared`; the implementation (`PinoObservability`) lives
in `platform/`. The handler depends only on the interface — that's why capturing an
error doesn't couple the feature to Pino, and the test uses
`makeObservabilityMock()`.

`CompositeObservability` (also in `@shared`) implements the same interface and fans
out to several targets (log, trace, metric), isolating each target's failure.
Callers still only see `ObservabilityInterface`.

### `errors/repository.error.ts` — generic persistence failure

```ts
export class RepositoryError extends Error {
  public readonly name = "RepositoryError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
```

A **module-agnostic** error for "persistence failed for a technical reason". Any
feature's `outbound/` throws this (with `{ cause }`) as its fallback, and every
inbound layer maps it to a generic `500`. Because it's cross-cutting, it doesn't
belong to any feature's `domain/` — hence living in `@shared`.

### Shared mocks (`*.mock.ts`)

`http-response.mock.ts` (`makeHttpResponseMock`) and `observability.mock.ts`
(`makeObservabilityMock`) sit right next to the contracts they double. Since the
contract is shared, its test double is too — any feature tests its
mapper/handler with the same mock, without rewriting it.

### `tests/` — cross-module test infrastructure (the one allowed exception)

Everything else in `@shared` is business-agnostic. The `tests/` subtree is the
deliberate exception: it holds **test-only** code that _does_ name concrete modules.

- **`factories/<module>/`** — the data factories (`make<Thing>(overrides = {})`),
  grouped by module (`factories/machine/machine.factory.ts`,
  `factories/account/account.factory.ts`, ...). A factory names a concrete module
  (`makeMachineEntity`), so it can't sit among the agnostic runtime contracts — but
  it belongs in `@shared` because factories are reused **across modules**: an
  `operation` integration test seeds an `account` and a `machine`, importing both
  their factories. Centralizing them here keeps a test from reaching into another
  module's internals for a fixture, and gives every module one predictable place to
  find them. See `references/testing.md` for the factory pattern itself.
- **`testcontainers/`** — shared container bootstrapping (e.g., `setup-postgres`)
  reused by every `*.integration.test.ts`.

This subtree ships **no production code** and is never imported by a runtime layer —
only test files import from `@shared/tests/**`. That's what makes the module-specific
naming acceptable here: the "business-agnostic" rule guards the runtime graph, and
test fixtures are outside it.

## 4. Interfaces and testability

`@shared` is, for the most part, **made of interfaces** — that's what underpins the
whole service's testability. Consistent pattern: **interface + mock** together in
`@shared`; **concrete implementation** in `platform/`. This lets any layer depend on
the contract and be tested with a ready-made test double.

## 5. How to start / when to promote something to `@shared`

1. It's born inside the feature. Only consider `@shared` on the second real use.
2. If it's a **contract**: create the `interface ...Interface` in `@shared` and its
   `*.mock.ts` next to it; put the concrete implementation in `platform/`.
3. If it's a **base/agnostic utility**: create the class/function in the right
   sub-area (`errors/`, `http/`, ...), with no reference to any business module.

## 6. Common mistakes (what NOT to do)

- ❌ Putting a specific module's **runtime** rule or type in `@shared` (e.g.,
  something about `device`). ✅ That belongs to the module. The lone exception is
  **test-only** data under `@shared/tests/factories/<module>/`, which is organized by
  module on purpose and never touches the runtime graph.
- ❌ Creating a shared abstraction on the first use. ✅ Wait for the pattern to
  repeat.
- ❌ Putting a concrete infra implementation (Pino, TypeORM) in `@shared`. ✅
  Contract in `@shared`, concrete implementation in `platform/`.
- ❌ Leaving the mock far from its contract. ✅ `*.mock.ts` next to the `*.ts` it
  doubles.
- ❌ Leaking `@shared` into the pure `domain/` unnecessarily. ✅ Only use a shared
  contract where it genuinely applies (e.g., `RepositoryError` in the outbound
  layer).
