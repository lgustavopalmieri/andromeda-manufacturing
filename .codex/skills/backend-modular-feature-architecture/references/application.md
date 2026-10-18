# `application/` layer — orchestration and ports

> Reference for the `modular-feature-architecture` skill. Reference example:
> `src/modules/device/features/register/application/`.

## 1. Core concept

`application/` is the **use case**: it orchestrates the feature's flow by calling
`domain/` (to apply the rules) and an **abstract repository** (to persist/read),
without knowing who implements that repository or which protocol the call arrived
through. It also enforces the feature's **authorization** by extending the shared
`AuthorizedUsecase` base (role gate before the business step — see
`references/auth.md`).

It's also where the feature's **interfaces (ports)** live. In hexagonal terms: the
application defines the _ports_; `inbound/` and `outbound/` are the _adapters_.

## 2. Role and when to use it

Use `application/` to: coordinate the use case's steps (validate through the domain
→ persist through the repository → return the entity), **declare which roles the
feature requires**, and **declare the contracts** the feature needs from the outer
edge (repository) and offers inward (usecase).

Don't put here: business rules (that's `domain/`), concrete database access (that's
`outbound/`), reading `req`/writing `res` (that's `inbound/`).

## 3. File structure (`register` example)

```
application/
├── interfaces.ts     # the PORTS: AuthorizedUsecaseInterface (in) + RepositoryInterface (out)
├── authorization.ts  # roles the feature requires (authorization) — see references/auth.md
└── usecase.ts        # the orchestration; extends AuthorizedUsecase (role gate + handle)
```

### `interfaces.ts` — the feature's ports

```ts
import type { AuthorizedUsecaseInterface } from "modules/@shared/auth/authorized-usecase.js";
import type { DeviceEntityInterface } from "modules/device/entity/device.entity.js";
import type {
  RegisterDeviceInputProps,
  RegisterDeviceOutputProps,
} from "modules/device/features/register/domain/types.js";

export type AuthorizedRegisterDeviceUsecaseInterface = AuthorizedUsecaseInterface<
  RegisterDeviceInputProps,
  DeviceEntityInterface
>;

export interface RegisterDeviceRepositoryInterface {
  save(device: RegisterDeviceOutputProps): Promise<DeviceEntityInterface>;
}
```

This file is the heart of the service's testability. Two interfaces, two
directions:

- **`AuthorizedRegisterDeviceUsecaseInterface`** (driving port): what the feature
  **offers** to whoever triggers it — `execute(input, identity)`. `inbound/` depends
  on this, not on the concrete class.
- **`RegisterDeviceRepositoryInterface`** (driven port): what the feature **requires**
  from a repository. It receives the domain's `OutputProps` and returns the full
  `DeviceEntityInterface` (with the `id` and timestamps the infra generates).
  `outbound/` implements this.

Notice the interface speaks the **domain's language** (`RegisterDeviceOutputProps`,
`DeviceEntityInterface`) — it leaks no `Repository` from TypeORM nor any infra
detail.

### `usecase.ts` — the orchestration

```ts
import { AuthorizedUsecase } from "modules/@shared/auth/authorized-usecase.js";
import { DeviceRegister } from "modules/device/features/register/domain/device.register.js";
import type { RegisterDeviceInputProps } from "modules/device/features/register/domain/types.js";
import type { DeviceEntityInterface } from "modules/device/entity/device.entity.js";
import type { DeviceRole } from "modules/device/entity/device.roles.js";
import { REGISTER_DEVICE_ALLOWED_ROLES } from "./authorization.js";
import type { RegisterDeviceRepositoryInterface } from "./interfaces.js";

export class RegisterDeviceUsecase extends AuthorizedUsecase<
  RegisterDeviceInputProps,
  DeviceEntityInterface
> {
  protected readonly allowedRoles: readonly DeviceRole[] = REGISTER_DEVICE_ALLOWED_ROLES;

  constructor(private readonly deviceRepository: RegisterDeviceRepositoryInterface) {
    super();
  }

  protected async handle(input: RegisterDeviceInputProps): Promise<DeviceEntityInterface> {
    const device = DeviceRegister.create(input);
    return await this.deviceRepository.save(device);
  }
}
```

The usecase is **thin by design**: the business step lives in `handle`, which
applies the domain (`DeviceRegister.create`, which throws if invalid) and persists
(`repository.save`). No rule lives here. The dependency comes in through the
**constructor** as an **interface** — classic DIP. The role gate isn't written here:
it's inherited from `AuthorizedUsecase.execute`, which runs **before** `handle`. If
the identity lacks the role, `handle` never runs; if the domain rule throws, `save`
is never called; the error bubbles up for the inbound layer to handle.

> The real `register` usecase also receives an `EventPublisherInterface` and
> publishes a `DeviceRegisteredEvent` inside `handle` — see `references/events.md`.
> Extra collaborators (events, transactions) live **inside** `handle`, within the
> authorization gate.

### `authorization.ts` — authorization lives here (see `references/auth.md`)

**Authorization is a responsibility of the application layer.** This is where each
feature declares **which roles it requires**; the check itself is inherited from a
reusable base class (`AuthorizedUsecase`, from `@shared/auth`) that the feature's
usecase extends.

```ts
// authorization.ts — the feature declares what it requires
export const REGISTER_DEVICE_ALLOWED_ROLES: readonly DeviceRole[] = [DEVICE_ROLES.WRITE];

// interfaces.ts — one usecase port, the authorized one
export type AuthorizedRegisterDeviceUsecaseInterface = AuthorizedUsecaseInterface<
  RegisterDeviceInputProps,
  DeviceEntityInterface
>;
```

Why it lives in the application and not in the middleware/edge:

- **Authentication** (who you are) is resolved at the **edge** (HTTP middleware in
  `platform`), because the token is a protocol detail.
- **Authorization** (whether you can do this) is **the feature's**, in the
  application: it stays reusable, with **per-feature roles**, and ready to scale
  (granular / multi-tenant) — the identity crosses the boundary inward through
  `AuthorizedUsecaseInterface`.
- `usecase.ts` **extends `AuthorizedUsecase`**: the base's `execute` runs the role
  gate, then calls the feature's `handle(input)`. Because the gate lives in the
  usecase, the feature's roles are covered by the **feature's own unit test**, not
  only at the e2e level.

The full flow (edge → base usecase → handle), the errors (`401`/`403`), and the
tests are in **`references/auth.md`**.

## 4. Interfaces and testability

The application is the clearest example of **testing through interfaces**. Tests go
through `execute(input, identity)`:

- Because the usecase receives `RegisterDeviceRepositoryInterface` through the
  constructor, the test injects a **stub** (`class RegisterDeviceRepositoryStub
implements ...`) and checks three key behaviors: (a) that the data handed to `save`
  is the one **normalized by the domain** (`vi.spyOn(repository, "save")`); (b) that
  a domain error **aborts** before `save` runs
  (`expect(saveSpy).not.toHaveBeenCalled()`); and (c) the **role gate** — an identity
  without the required role rejects with `InsufficientRolesError` and `save` is
  **never** called (proving the gate runs before the business step).
- No database, no HTTP is started. It's a pure unit test. See
  `references/testing.md`.

That's the reason the interfaces exist: they're the **substitution point** that
swaps the real Postgres for an in-memory stub in the test.

## 5. How to start (new feature)

1. Create `features/<feat>/application/authorization.ts` with `<FEAT>_ALLOWED_ROLES`
   and `interfaces.ts` with:
   - `Authorized<Feat>UsecaseInterface = AuthorizedUsecaseInterface<In, Out>` (the
     `execute(input, identity)` the inbound layer will call);
   - `<Feat>RepositoryInterface` (the `save`/`findById`/`update`... the outbound
     layer will implement), always speaking in domain/entity types.
2. Create `usecase.ts`: a class `extends AuthorizedUsecase<In, Out>`, declaring
   `allowedRoles = <FEAT>_ALLOWED_ROLES` and receiving its dependencies as
   **interfaces** through the constructor (call `super()` first).
3. Put the orchestration in `handle(input)`: call the domain first, then the
   repository(ies). Keep it thin: no rule, no business try/catch (let the error
   bubble up). The inherited `execute` runs the role gate before `handle`.

## 6. Common mistakes (what NOT to do)

- ❌ Injecting the concrete class (`RegisterDeviceTypeormRepository`) into the
  usecase. ✅ Inject the **interface**; the concrete implementation is only
  provided in `wire`.
- ❌ Putting validation/rules in `handle`. ✅ The rule belongs to `domain/`; the
  usecase only orchestrates.
- ❌ Re-implementing the role check inside `handle` (or forgetting it). ✅ It's
  inherited from `AuthorizedUsecase.execute`; the feature only fills in `handle`.
- ❌ The repository interface exposing infra types (`Repository<...>`,
  `QueryRunner`). ✅ It speaks domain (`RegisterDeviceOutputProps`,
  `DeviceEntityInterface`).
- ❌ Catching and "swallowing" a domain error here. ✅ Let it bubble up; the
  inbound layer translates it into an HTTP status.
- ❌ Having the usecase build its own dependencies (`new ...` in the constructor).
  ✅ Injection comes from outside (wire).
