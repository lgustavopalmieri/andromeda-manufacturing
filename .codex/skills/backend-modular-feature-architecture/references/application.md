# `application/` layer — orchestration and ports

Reference: `src/modules/device/features/register/application/`.

## 1. Core concept

Application orchestrates domain → abstract repository → entity without knowing concrete
persistence or input protocols. It owns driving/driven ports and per-feature authorization:
extend `@shared/auth/AuthorizedUsecase` to run the role gate before business steps
(`references/auth.md`). Inbound/outbound implement or consume these ports.

## 2. Role and when to use it

Coordinate the usecase, declare required roles and inward/outward contracts. Keep rules
in domain, concrete persistence in outbound, and `req`/`res` in inbound.

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

- Driving `AuthorizedRegisterDeviceUsecaseInterface`: exposes `execute(input, identity)`;
  inbound depends on this port, not the concrete class.
- Driven `RegisterDeviceRepositoryInterface`: accepts domain `OutputProps`, returns
  full `DeviceEntityInterface` including generated IDs/timestamps; implemented by outbound.

Ports speak domain/entity types, never TypeORM `Repository` or infrastructure details.

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

Keep `handle` thin: call domain, then repository. Inject interfaces through the constructor;
inherit `execute` for authorization. Denied identity must never reach `handle`; domain
failure must never reach `save`. Let errors propagate to inbound.

The real register usecase also publishes `DeviceRegisteredEvent` through
`EventPublisherInterface` (`references/events.md`). Events, transactions and other
collaborators run **inside `handle`**, behind the authorization gate.

### `authorization.ts` — authorization lives here (see `references/auth.md`)

Declare required roles here; inherit their check rather than duplicating it.

```ts
// authorization.ts — the feature declares what it requires
export const REGISTER_DEVICE_ALLOWED_ROLES: readonly DeviceRole[] = [DEVICE_ROLES.WRITE];

// interfaces.ts — one usecase port, the authorized one
export type AuthorizedRegisterDeviceUsecaseInterface = AuthorizedUsecaseInterface<
  RegisterDeviceInputProps,
  DeviceEntityInterface
>;
```

Authentication resolves identity at the platform edge; authorization belongs to the
feature so every protocol shares its role gate. Identity crosses through the authorized
usecase interface. Cover role checks in feature unit tests, not only E2E; see
`references/auth.md` for the full flow and `401`/`403` errors.

## 4. Interfaces and testability

Read [common testing rules](testing.md) before writing this layer's tests.

### Basic usecase

Inject an interface-implementing repository stub, observe collaboration with vi.spyOn
and invoke execute(input, identity), importing makeIdentity rather than recreating it.

```ts
class RegisterDeviceRepositoryStub implements RegisterDeviceRepositoryInterface {
  savedDevice: DeviceEntityInterface = makeDeviceEntity();
  save = async (_d: RegisterDeviceOutputProps): Promise<DeviceEntityInterface> => this.savedDevice;
}

// makeRegisterDeviceInput and makeIdentity are imported from @shared/tests/factories/*;
// the suite never redeclares the input or the identity.

const makeSut = (overrides: Partial<RegisterDeviceRepositoryStub> = {}): MakeSutInterface => {
  const repository = Object.assign(new RegisterDeviceRepositoryStub(), overrides);
  const eventPublisher = makeEventPublisherMock();
  return { sut: new RegisterDeviceUsecase(repository, eventPublisher), repository, eventPublisher };
};

describe("RegisterDeviceUsecase", () => {
  describe("when the request is authorized and valid", () => {
    it("should hand the repository the device normalized by the domain", async () => {
      const { sut, repository } = makeSut();
      const saveSpy = vi.spyOn(repository, "save");
      await sut.execute(
        makeRegisterDeviceInput({ name: "  Gateway 02  " }),
        makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
      );
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ name: "Gateway 02" }));
    });

    it("should publish a DeviceRegisteredEvent with the persisted device as payload", async () => {
      const persisted = makeDeviceEntity({ id: 3, name: "Gateway 03" });
      const { sut, eventPublisher } = makeSut({ savedDevice: persisted });

      await sut.execute(
        makeRegisterDeviceInput({ name: "Gateway 03" }),
        makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
      );

      expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(DeviceRegisteredEvent));
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "device.registered", payload: persisted }),
      );
    });
  });

  describe("when authorization or validation fails", () => {
    it("should throw InsufficientRolesError and not touch the repository without the role", async () => {
      const { sut, repository, eventPublisher } = makeSut();
      const saveSpy = vi.spyOn(repository, "save");
      await expect(
        sut.execute(makeRegisterDeviceInput(), makeIdentity({ roles: [DEVICE_ROLES.READ] })),
      ).rejects.toBeInstanceOf(InsufficientRolesError);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });

    it("should propagate the domain error and not call the repository when input is invalid", async () => {
      const { sut, repository, eventPublisher } = makeSut();
      const saveSpy = vi.spyOn(repository, "save");
      await expect(
        sut.execute(
          makeRegisterDeviceInput({ name: "   " }),
          makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
        ),
      ).rejects.toThrow(DeviceNameRequiredError);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
```

Assert denied roles touch no repository or other collaborator; domain runs before persistence and errors abort
save; mocked repository rejection propagates; event publishing never runs on failure.
Role denial belongs under when fails beside domain/repository cases, not a separate
authorization describe. `Object.assign(new Stub(), overrides)` varies savedDevice/behavior.

Use the [event assertion rules](events.md#6-testing-the-concern) for published events.

### Multi-step usecase

Flow: validate owner → uniqueness → Keycloak provisioning → single account/owner
transaction → publish; compensate realm/user provisioning if transaction fails.
makeSut takes an options object, exposing **all** collaborators including repositories
inside the transaction callback:

```ts
describe("CreateAccountUsecase", () => {
  const makeSut = (options: MakeSutOptions = {}): MakeSutInterface => {
    const accountRepo = options.accountRepo ?? makeAccountRepo();
    const userRepo = options.userRepo ?? makeUserRepo();
    const identityProvider = options.identityProvider ?? makeIdentityProvider();
    const eventPublisher = options.eventPublisher ?? makeEventPublisherMock(); // @shared mock
    const ctxAccountManager = options.ctxAccountManager ?? makeAccountRepo();
    const ctxUserManager = options.ctxUserManager ?? makeUserRepo();

    // the transaction mock runs the work with the ctx repos we can spy on
    const transaction: CreateAccountTransactionInterface = options.transaction ?? {
      run: vi.fn(async (work: (ctx: TransactionalContext) => Promise<unknown>) =>
        work({ accountManager: ctxAccountManager, userManager: ctxUserManager }),
      ) as CreateAccountTransactionInterface["run"],
    };

    const sut = new CreateAccountUsecase(
      accountRepo,
      userRepo,
      identityProvider,
      eventPublisher,
      transaction,
    );
    return {
      sut,
      accountRepo,
      userRepo,
      identityProvider,
      eventPublisher,
      transaction,
      ctxAccountManager,
      ctxUserManager,
    };
  };

  // Each nested `describe("when …")` uses this factory for its scenario.
});
```

Cover these additional cases:

- Provider before transaction (`["identity", "transaction"]`); publish after commit with persisted IDs.
- Normalization across boundaries: ACME-CORP → acme-corp in both IdP and transactional save.
- Transaction failure calls deleteAccountWithOwner(provisionedId, slug), then rethrows
  the **original** error even if compensation also throws.
- No publication on uniqueness, IdP or transaction failure; assert separately in each it.
- Invalid owner email fails before **any** interaction, including existsBySlug;
  validateOwner must run first.

### Public endpoint

With `<FEAT>_ALLOWED_ROLES = []`, AccessControl accepts any identity. Instead of a
role-denial case, add a when success test with **empty identity roles** to lock this
contract against accidental future restrictions:

```ts
describe("CreateAccountUsecase", () => {
  describe("when the endpoint is public and the identity has no roles", () => {
    it("should allow the account to be created", async () => {
      const { sut, identityProvider } = makeSut();
      await expect(
        sut.execute(makeCreateAccountInput(), makeIdentity({ roles: [] })),
      ).resolves.toBeDefined();
      expect(identityProvider.createAccountWithOwner).toHaveBeenCalledTimes(1);
    });
  });
});
```

## 5. How to start (new feature)

1. Create `authorization.ts` with `<FEAT>_ALLOWED_ROLES`; declare
   `Authorized<Feat>UsecaseInterface = AuthorizedUsecaseInterface<In, Out>` and a
   domain/entity-only `<Feat>RepositoryInterface` (`save`/`findById`/`update` as needed).
2. In `usecase.ts`, extend `AuthorizedUsecase<In, Out>`, declare `allowedRoles`, inject
   interfaces and call `super()` first.
3. Implement thin `handle(input)` orchestration: domain then repositories, without
   business rules or business try/catch. Inherited `execute` gates it first.

## 6. Common mistakes (what NOT to do)

- Inject ports, never concrete repositories; `wire` selects implementations.
- No rules/validation in `handle`; use domain.
- Do not duplicate/omit the role gate; inherit `AuthorizedUsecase.execute`.
- No infrastructure types (`Repository`, `QueryRunner`) in ports; use domain/entity types.
- Do not swallow domain errors; inbound maps them to HTTP.
- Do not instantiate dependencies in the usecase; inject them from wire.
