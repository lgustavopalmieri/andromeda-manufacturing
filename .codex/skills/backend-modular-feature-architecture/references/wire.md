# The `wire` — the feature's composition root

> Reference for the `modular-feature-architecture` skill. Reference example:
> `src/modules/device/features/register/inbound/http/wire.ts`.

## 1. Core concept

The `wire` is the **only place that knows the concrete classes** and ties them
together: it instantiates the concrete repository, injects it into the usecase,
injects observability and the usecase into the handler, and hands the route a
ready-to-use handler. It's the feature's **composition root** — the point where
dependency injection happens "by hand", with no container.

Every other layer talks through **interfaces**; the `wire` is where those
interfaces finally meet their concrete implementations from `platform/` and
`outbound/`.

## 2. Role and when to use it

Use the `wire` to: assemble the feature's dependency graph for a specific protocol.
One `wire` per input adapter — `inbound/http/wire.ts` for HTTP; if `inbound/mqtt/`
shows up, it will have its own `wire`, reusing the same usecase and repository.

Don't put in the `wire`: any logic at all (no rules, validation, or translation).
It only calls `new` and wires the pieces together.

## 3. Real example (`register`)

```ts
import { AppDataSource } from "platform/database/postgres/data-source.js";
import { DeviceOrmEntity } from "platform/database/postgres/typeorm/entities/device.orm-entity.js";
import { PinoObservability } from "platform/observability/pino-observability.js";
import { RegisterDeviceHandler } from "./http-handler.js";
import { RegisterDeviceUsecase } from "../../application/usecase.js";
import { RegisterDeviceTypeormRepository } from "../../outbound/typeorm/device.repository.js";

export class RegisterDeviceWire {
  private static wire(): RegisterDeviceHandler {
    const repository = new RegisterDeviceTypeormRepository(
      AppDataSource.getRepository(DeviceOrmEntity),
    );
    const usecase = new RegisterDeviceUsecase(repository);
    const observability = new PinoObservability();
    const handler = new RegisterDeviceHandler(usecase, observability);

    return handler;
  }

  public static provideHandler() {
    const registerDeviceHandler = RegisterDeviceWire.wire();
    return registerDeviceHandler.handle.bind(registerDeviceHandler);
  }
}
```

What this file does and why:

- **It's the only one that imports from `platform/` and `outbound/` at the same
  time.** It resolves `RegisterDeviceRepositoryInterface` with
  `RegisterDeviceTypeormRepository` (built from `AppDataSource`'s
  `Repository<DeviceOrmEntity>`) and `ObservabilityInterface` with
  `PinoObservability`. The concrete choice lives here, outside the usecase and the
  handler.
- **`wire()` is private**; the internal assembly doesn't leak out. The public
  entry point is `provideHandler()`.
- **`provideHandler()` returns `handle` with `.bind(handler)`.** The `bind`
  preserves `this` when Express calls the isolated route function — without it,
  `this.usecase` would be `undefined` inside `handle`.
- **It's static** because there's no state; it's a factory. The route calls
  `RegisterDeviceWire.provideHandler()` (see `references/platform.md`).
- **Authorization isn't wired here.** The usecase extends `AuthorizedUsecase` and
  carries its own `allowedRoles`, so the wire just builds it — there's no
  authorization wrapper to compose. Authentication lives at the edge
  (`build-auth-middlewares`), not in the feature wire (see `references/auth.md`).

## 4. Interfaces and testability

The `wire` usually **has no unit test of its own**: it only calls `new`. What
exercises the wire end-to-end is the **e2e test** (the real app, with a real
database, see `references/testing.md`). The layers the wire assembles have already
been tested in isolation with stubs/mocks — the wire only confirms the right
concrete implementations were plugged in.

Precisely because it concentrates every `new`, the wire is what keeps the other
layers **free of instantiation** and, therefore, testable with test doubles.

## 5. How to start (new feature)

1. Create `inbound/<protocol>/wire.ts` (only after domain/application/outbound/
   handler already exist).
2. A `<Feat>Wire` class with:
   - a `private static wire()` that instantiates, in dependency-rule order,
     repository → usecase → observability → handler;
   - a `public static provideHandler()` that returns `handler.handle.bind(handler)`.
3. Pull the infra dependencies from `platform/` (data-source, orm-entity, Pino).
4. Register `provideHandler()` in the module's route under `platform/http/routes/`.

## 6. Common mistakes (what NOT to do)

- ❌ Putting logic (validation, logging, transformation) in the wire. ✅ Only `new`
  and wiring.
- ❌ Scattering `new PinoObservability()`/`new ...Repository()` across other
  layers. ✅ Every dependency `new` lives in the wire.
- ❌ Forgetting `.bind(handler)` when handing the method to the route. ✅ Always
  `bind`, or `this` gets lost.
- ❌ Making the wire aware of `express`/`req`/`res`. ✅ It delivers a handler
  function; the one who registers it on the route is `platform/http/routes/`.
- ❌ One giant wire for several features. ✅ One wire per feature/adapter.
