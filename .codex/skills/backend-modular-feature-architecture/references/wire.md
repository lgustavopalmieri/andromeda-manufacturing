# The `wire` — the feature's composition root

Reference: `src/modules/device/features/register/inbound/http/wire.ts`.

## 1. Core concept

Wire is the feature's only concrete dependency assembly point: instantiate repository,
inject it into usecase, then inject usecase/observability into handler. Other layers
use interfaces; wire selects platform/outbound implementations. Use manual injection,
not a container.

## 2. Role and when to use it

Create one wire per feature/input adapter (`inbound/http/wire.ts`, future
`inbound/mqtt/wire.ts`), reusing usecase/repository. Only instantiate and connect;
no rules, validation or translation.

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

- Only wire combines platform and outbound imports, selecting
  `RegisterDeviceTypeormRepository` from `AppDataSource`'s `Repository<DeviceOrmEntity>`
  and `PinoObservability` for their interfaces.
- Keep static `wire()` private; expose static `provideHandler()` as the stateless factory.
- Return `handler.handle.bind(handler)` to preserve `this.usecase` when Express invokes it.
- No authorization wrapper: the usecase inherits `AuthorizedUsecase` and declares
  `allowedRoles`. Edge `build-auth-middlewares` handles authentication
  (`references/auth.md`), not feature wire.

## 4. Interfaces and testability

Wire normally needs no unit test: E2E with the real app/database verifies the assembled
graph ([E2E guide](e2e.md), using Testcontainers and the [common rules](testing.md)). Test its layers separately with doubles. Keeping
dependency construction here lets those layers remain independently testable.

## 5. How to start (new feature)

1. After domain/application/outbound/handler exist, create `inbound/<protocol>/wire.ts`.
2. Define `<Feat>Wire` with private static `wire()` assembling repository → usecase →
   observability → handler, and public static `provideHandler()` returning the bound method.
3. Get infrastructure from platform (data-source, ORM entity, Pino).
4. Register `provideHandler()` under `platform/http/routes/`.

## 6. Common mistakes (what NOT to do)

- No validation, logging or transformation; only construction/wiring.
- Do not scatter `new PinoObservability()`/`new ...Repository()` across other layers.
- Always bind the handler method or `this` is lost.
- Wire must not know Express/`req`/`res`; it returns a function and platform registers the route.
- No giant multi-feature wire; use one per feature/adapter.
