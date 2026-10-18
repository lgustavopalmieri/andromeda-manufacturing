# `entity/` layer — the module's contract

> Reference for the `modular-feature-architecture` skill. Go back to `SKILL.md` for
> the overall map. Reference example: `src/modules/device/entity/`.

## 1. Core concept

`entity/` is the module's **data contract**: the canonical shape of the business
entity, expressed as **pure TypeScript types**. It is the innermost point of the
architecture — the base the dependency rule points toward.

It is not a class with behavior, not the database table, not the API DTO. It's the
**source of truth for the shape** of the data, from which every other layer derives:

- `domain/` validates against it;
- `application/` derives its input/output types from it;
- `outbound/` (ORM) **maps** it to columns;
- `inbound/` serializes it to JSON.

## 2. Role and when to use it

Only touch `entity/` when the module's **data shape** changes: a new field, a new
type, a new enum. If the change is purely behavioral (a rule), it belongs in
`domain/`, not here.

When an entity is born, it should be **simple enough** for the current CRUD and
**designed to grow** additively (optional fields, enums that gain values) without
breaking whoever already consumes the contract.

## 3. File structure (`device` example)

```
entity/
├── device.entity.ts      # the entity's main interface
├── device.types.ts       # enums (const object + derived type)
├── device.interfaces.ts  # sub-objects/value-objects of the contract
└── device.roles.ts       # the module's role catalog (authorization) — see references/auth.md
```

### `device.types.ts` — enums as const objects

```ts
export const DEVICE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DECOMMISSIONED: "decommissioned",
} as const;
export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];

export const INGEST_PROTOCOL = {
  MQTT: "mqtt",
} as const;
export type IngestProtocol = (typeof INGEST_PROTOCOL)[keyof typeof INGEST_PROTOCOL];

export const DEVICE_TYPE = {
  GATEWAY: "gateway",
} as const;
export type DeviceType = (typeof DEVICE_TYPE)[keyof typeof DEVICE_TYPE];
```

Why this and not a native `enum`: the `as const` object produces real string values
(good for persisting and serializing), without the runtime pitfalls of TS's `enum`,
and the derived `type` gives you static checking. **Growth is additive**:
`INGEST_PROTOCOL` can gain `MODBUS_TCP` in the future without touching anyone
already using `MQTT`.

### `device.interfaces.ts` — sub-objects of the contract

```ts
import type { IngestProtocol } from "./device.types";

export interface TelemetrySource {
  protocol: IngestProtocol;
  address: string;
}
```

`TelemetrySource` is a small value-object: **where and how** the device's data is
published. It isolates the `{ protocol, address }` pair so it can evolve (become a
list of channels, gain a `direction: "read" | "command"`) without bloating the root
entity.

### `device.entity.ts` — the entity

```ts
import type { TelemetrySource } from "./device.interfaces";
import type { DeviceStatus, DeviceType } from "./device.types";

export interface DeviceEntityInterface {
  id: number;
  plantId?: string;
  name: string;
  type: DeviceType;
  telemetry: TelemetrySource;
  status: DeviceStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

Note: `id` is a `number` (mapped to `bigint` in Postgres); future identity fields
(`plantId`) already exist as **optional**, preparing for multi-tenancy without
breaking the current contract. Timestamps are part of the contract because the infra
generates them and returns them on every entity read.

### `device.roles.ts` — the module's role catalog (authorization)

```ts
export const DEVICE_ROLES = {
  READ: "devices:read",
  WRITE: "devices:write",
  UPDATE: "devices:update",
  DECOMMISSION: "devices:decommission",
} as const;
export type DeviceRole = (typeof DEVICE_ROLES)[keyof typeof DEVICE_ROLES];
```

The module's **role catalog** lives in `entity/` because it's **stable module
vocabulary** — exactly like the enums in `device.types.ts`. Same pattern: const
object + derived type, values **scoped to the resource** (`devices:*`), which
already prepares for granular per-resource authorization in the future.

Watch the split of responsibilities (detail in `references/auth.md`):

- the **catalog** (which roles exist) → here, in `entity/`;
- the **roles required by each feature** → in the feature's
  `application/authorization.ts` (e.g., `REGISTER_DEVICE_ALLOWED_ROLES = [DEVICE_ROLES.WRITE]`);
- the **check** → inherited from the `AuthorizedUsecase` base class (`@shared/auth`)
  that the feature's usecase extends.

The feature's `domain/` **has no knowledge** of roles.

## 4. Interfaces and testability

`entity/` has no test of its own — it's just types, checked by the compiler. But it
is what **makes the other layers testable**: because it's a pure contract, the test
factory (`@shared/tests/factories/device/device.factory.ts`) can build a complete
`DeviceEntityInterface` without touching a database or a framework. It's the "fake data" that feeds tests
across every layer.

## 5. How to start (new module/feature)

1. Create `modules/<module>/entity/`.
2. Start with the enums in `<module>.types.ts` (const object + type).
3. Extract value-objects into `<module>.interfaces.ts` once a sub-object earns its
   own identity.
4. Assemble `<module>.entity.ts` referencing those types. Include timestamps and the
   tenant hook (`plantId?`/`tenantId?`) even if optional.
5. **Don't** add methods here. Behavior belongs to `domain/`.

## 6. Common mistakes (what NOT to do)

- ❌ Importing `typeorm`/`express` or annotating decorators (`@Entity`, `@Column`) on
  the entity. ✅ The entity is pure; the ORM mapping lives in
  `platform/database/postgres/typeorm/entities/` (see `references/platform.md`).
- ❌ Using a native `enum`. ✅ Const object + derived type.
- ❌ Putting validation/rules ("name cannot be empty") on the entity. ✅ That belongs
  to `domain/`.
- ❌ Creating the feature's input/output types here. ✅ They derive from the entity,
  but live in the feature's `domain/types.ts` (see `references/domain.md`).
- ❌ Setting an optional field to explicit `undefined`. With
  `exactOptionalPropertyTypes`, optional fields are **omitted** from the object.
- ❌ Retroactively making a field required. ✅ Grow with optionals and a data
  migration when it's time to promote a field to required.
