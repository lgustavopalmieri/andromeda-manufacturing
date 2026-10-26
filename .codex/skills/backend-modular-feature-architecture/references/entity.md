# `entity/` layer — the module's contract

Reference: `src/modules/device/entity/`. See `SKILL.md` for the architecture map.

## 1. Core concept

`entity/` defines the canonical business data shape in pure TypeScript types: not
behavior classes, database tables or API DTOs. Domain validates it; application derives
I/O types; outbound maps it to columns; inbound serializes it.

## 2. Role and when to use it

Change entity only for shape changes (fields, types, enums); rules belong in domain.
Start with the current CRUD needs and grow additively through optional fields and enum
values without breaking consumers.

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

Use `as const` + derived type for real serializable/persistable strings and static
checking, avoiding native enum runtime pitfalls. Growth is additive: adding
`INGEST_PROTOCOL.MODBUS_TCP` must not affect existing `MQTT` consumers.

### `device.interfaces.ts` — sub-objects of the contract

```ts
import type { IngestProtocol } from "./device.types";

export interface TelemetrySource {
  protocol: IngestProtocol;
  address: string;
}
```

`TelemetrySource` isolates where/how data is published (`protocol`, `address`) so it
can grow into channels or gain `direction: "read" | "command"` without bloating the root.

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

The reference maps numeric `id` to Postgres `bigint`; optional future identity fields
such as `plantId` preserve consumers. Include infra-generated timestamps in the contract:
they return on entity reads.

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

Roles are stable module vocabulary, like enums: const object + derived type with
resource-scoped values (`devices:*`), ready for granular resource authorization.
Responsibility split (`references/auth.md`): catalog here; required feature roles in
`application/authorization.ts` (`REGISTER_DEVICE_ALLOWED_ROLES = [DEVICE_ROLES.WRITE]`);
checks inherited from `@shared/auth/AuthorizedUsecase`. Domain knows nothing about roles.

## 4. Interfaces and testability

Follow the [common test taxonomy](testing.md#1-test-taxonomy); this pure type layer
is checked by the compiler, not a runtime suite.

The compiler tests this type-only layer; do not add runtime tests. Its pure contract
lets `@shared/tests/factories/device/device.factory.ts` build complete
`DeviceEntityInterface` fixtures for every layer without databases/frameworks.

## 5. How to start (new module/feature)

1. Create `modules/<module>/entity/`.
2. Define const enums + types in `<module>.types.ts`.
3. Extract meaningful sub-objects into `<module>.interfaces.ts`.
4. Assemble `<module>.entity.ts`, including timestamps and tenant hooks
   (`plantId?`/`tenantId?`), even if optional.
5. Keep methods and behavior in domain.

## 6. Common mistakes (what NOT to do)

- No `typeorm`/`express`, `@Entity` or `@Column`; ORM mappings belong in
  `platform/database/postgres/typeorm/entities/` (`references/platform.md`).
- No native enums or entity validation; use const + type and domain rules.
- Feature input/output types belong in `domain/types.ts`, derived from entity
  (`references/domain.md`).
- With `exactOptionalPropertyTypes`, omit absent fields; never set explicit `undefined`.
- Do not retroactively require a field: grow with optionals, then migrate data before
  promoting it to required.
