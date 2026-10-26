# `domain/` layer — pure business rule

Reference: `src/modules/device/features/register/domain/`.

## 1. Core concept

Domain is a pure, synchronous input → valid canonical output transformation, or a
specific domain error with a business message. It must run without frameworks, I/O,
protocols, infrastructure or infrastructure mocks.

## 2. Role and when to use it

Put feature validation, required/default values, normalization (`trim`) and invariants
here. Repository orchestration belongs in application, `req.body` in inbound, database
error translation in outbound. Domain has **no roles**: the module catalog is in
`entity/<module>.roles.ts`; feature requirements in `application/authorization.ts`;
checks in inherited `@shared/auth/AuthorizedUsecase` (`references/auth.md`).

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

Represent v1 policies (only gateway, only MQTT, not initially decommissioned) as named
constants, not magic values. Keep rationale in module business documentation.

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

Derive types with `Omit`/`&` so entity changes propagate. Input excludes infra-generated
IDs/timestamps and may omit status; output resolves status/defaults and is ready to
persist, still excluding generated fields.

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

Use one abstract feature base (`DeviceRegisterError`) so inbound can map the family
via `instanceof` to `422`. Every concrete error has an explicit `name` and clear business
message used in responses. Domain **defines** `DeviceAlreadyExistsError`; outbound
**throws** it when translating a Postgres uniqueness violation; inbound maps it to
`409`. The detecting layer throws the domain-defined error.

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

Use a stateless static class: one public `create` (or `apply`) composes private named
validation/normalization helpers, each with its own error. No instance/injection.
Return canonical data: trimmed values, default status and omitted blank optional metadata.

## 4. Interfaces and testability

Read [common testing rules](testing.md) before writing this layer's tests.

SUT is the static class: no mocks/async. Cover every success path and domain error.

```ts
const makeSut = (): MakeSutInterface => ({ sut: DeviceRegister });

describe("DeviceRegister", () => {
  describe("when the input is valid", () => {
    it('should register a device with only the required fields, defaulting status to "active"', () => {
      const { sut } = makeSut();
      const input = makeRegisterDeviceInput();

      const result = sut.create(input);

      expect(result).toEqual({
        name: "Gateway 01",
        type: DEVICE_TYPE.GATEWAY,
        telemetry: { protocol: INGEST_PROTOCOL.MQTT, address: "..." },
        status: DEVICE_STATUS.ACTIVE,
      });
    });
  });

  describe("when the input is invalid", () => {
    it("should throw DeviceNameRequiredError when name is only whitespace", () => {
      const { sut } = makeSut();
      const input = makeRegisterDeviceInput({ name: "   " });

      expect(() => sut.create(input)).toThrow(DeviceNameRequiredError);
      expect(() => sut.create(input)).toThrow("Device name is required.");
    });
  });
});
```

Assert canonical output (trim, defaults, omitted blank optionals) and **both error
class and message**.

## 5. How to start (new feature)

1. Create `features/<feat>/domain/`.
2. Put named readonly policies in `rules.ts`, using entity enums.
3. Derive `<Feat>InputProps`/`<Feat>OutputProps` in `types.ts` with `Omit`/`&`.
4. Define abstract `<Feat>Error extends Error` and one named, business-message error
   per invariant in `errors.ts`.
5. Implement `<entity>.<feat>.ts` as one public static method composing private helpers.
6. Never use async/I/O.

## 6. Common mistakes (what NOT to do)

- Import only entity and domain siblings; never application, inbound, outbound,
  platform, Express or TypeORM.
- No repository/HTTP calls; I/O belongs in application/outbound.
- Never throw generic errors/strings; extend the feature base with a business message.
- Do not leave validation to the database: output must already be canonical.
- Centralize magic values in `rules.ts`.
- Omit blank optional metadata; never return `""`/`undefined` (`optionalMetadata` pattern).
