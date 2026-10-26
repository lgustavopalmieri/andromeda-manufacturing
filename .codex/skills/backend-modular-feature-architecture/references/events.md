# Domain events — publishing (cross-cutting concern)

Reference: register's `device.registered`. Events cross layers; the swappable transport
is currently a **log placeholder, not a broker**.

## 0. BEFORE YOU START: which pattern is it? (read this first)

**Confirm the service's pattern before implementing; never mix both in one feature.**

| Pattern | Behavior | When/status |
| --- | --- | --- |
| Publish + DLQ | Publish after commit in the same flow; publishing failures go to DLQ without breaking the request | Current; simple, accepts a small inconsistency window |
| Transactional Outbox | Entity and outbox event written in one transaction; relay publishes later | Future, not built; for no-event-loss requirements |

Outbox requires new table + relay infrastructure and prior alignment; do not assume it
exists. LogEventPublisher/LogEventDeadLetterQueue only log. Real MQTT/Kafka/SNS/SQS
delivery requires new platform implementations behind the same interfaces, leaving
core layers unchanged.

## 1. Core concept

A domain event records a business fact (`device.registered`) without knowing consumers:

- Domain (`domain/events.ts`): what happened.
- Shared EventPublisherInterface: publication port.
- Shared decorator + DLQ: publication failure handling.
- Platform: concrete transport (currently logs).

## 2. The current pattern's flow, layer by layer

```
domain/events.ts            defines DeviceRegisteredEvent (name, payload, occurredAt)
        │
application/usecase         create() -> save() -> publish(new DeviceRegisteredEvent(saved))
        │                   (publishes AFTER persisting, via EventPublisherInterface)
        ▼
@shared DecoratorEventPublisher.publish(event)
        ├── try  publisher.publish(event)                  (success: done)
        └── catch → observability.capture(err) → deadLetterQueue.send(event, err)
                                                   └── if the DLQ fails: capture(err) and stop
        │
platform/events             LogEventPublisher / LogEventDeadLetterQueue  (placeholder: log)
        ▲
wire                        composes DecoratorEventPublisher(LogEventPublisher, LogEventDeadLetterQueue, observability)
```

## 3. Layer by layer (with the reference code)

### `@shared/events/` — contracts + decorator + mocks

Feature- and transport-neutral contracts:

```ts
// event.ts
export interface DomainEventInterface<TPayload = unknown> {
  readonly name: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;
}

// event-publisher.ts
export interface EventPublisherInterface {
  publish(event: DomainEventInterface): Promise<void>;
}

// event-dead-letter-queue.ts
export interface EventDeadLetterQueueInterface {
  send(event: DomainEventInterface, error: unknown): Promise<void>;
}
```

Decorator implements the same port; callers need not know about its DLQ:

```ts
// decorator-event-publisher.ts
export class DecoratorEventPublisher implements EventPublisherInterface {
  constructor(
    private readonly publisher: EventPublisherInterface,
    private readonly deadLetterQueue: EventDeadLetterQueueInterface,
    private readonly observability: ObservabilityInterface,
  ) {}

  public async publish(event: DomainEventInterface): Promise<void> {
    try {
      await this.publisher.publish(event);
    } catch (error) {
      this.observability.capture(error, { eventName: event.name });
      await this.sendToDeadLetterQueue(event, error);
    }
  }

  private async sendToDeadLetterQueue(event: DomainEventInterface, error: unknown): Promise<void> {
    try {
      await this.deadLetterQueue.send(event, error);
    } catch (deadLetterQueueError) {
      this.observability.capture(deadLetterQueueError, {
        eventName: event.name,
        stage: "dead-letter-queue",
      });
    }
  }
}
```

Keep event-publisher.mock.ts and event-dead-letter-queue.mock.ts adjacent to contracts.

### `domain/` — the event is a domain concept

```ts
// features/register/domain/events.ts
export const DEVICE_REGISTERED_EVENT = "device.registered";

export class DeviceRegisteredEvent implements DomainEventInterface<DeviceEntityInterface> {
  public readonly name = DEVICE_REGISTERED_EVENT;
  public readonly occurredAt: Date;
  constructor(public readonly payload: DeviceEntityInterface) {
    this.occurredAt = new Date();
  }
}
```

Name the fact with an exported constant and type its payload (DeviceEntityInterface),
so consumers/tests do not repeat magic strings.

### `application/` — publishes AFTER persisting

Inject the named publisher port as an interface:

```ts
// application/interfaces.ts
export type RegisterDeviceEventPublisherInterface = EventPublisherInterface;

// application/usecase.ts (extends AuthorizedUsecase — see references/auth.md)
export class RegisterDeviceUsecase extends AuthorizedUsecase<
  RegisterDeviceInputProps,
  DeviceEntityInterface
> {
  protected readonly allowedRoles: readonly DeviceRole[] = REGISTER_DEVICE_ALLOWED_ROLES;

  constructor(
    private readonly deviceRepository: RegisterDeviceRepositoryInterface,
    private readonly eventPublisher: RegisterDeviceEventPublisherInterface,
  ) {
    super();
  }

  protected async handle(input: RegisterDeviceInputProps): Promise<DeviceEntityInterface> {
    const device = DeviceRegister.create(input);
    const registeredDevice = await this.deviceRepository.save(device);
    await this.eventPublisher.publish(new DeviceRegisteredEvent(registeredDevice));
    return registeredDevice;
  }
}
```

Publish **after save**, using the persisted entity with IDs/timestamps. Domain/repository
failure propagates to inbound without publishing. Usecase depends on the port, not the
decorator/transport; publish try/catch belongs in the reliability decorator.

### `platform/events/` — concrete transport (today, LOG)

```ts
// log-event-publisher.ts  (PLACEHOLDER: logs; does not deliver to a real broker)
export class LogEventPublisher implements EventPublisherInterface {
  public async publish(event: DomainEventInterface): Promise<void> {
    this.logger.info({ event: event.name, payload: event.payload, occurredAt: event.occurredAt });
  }
}

// log-event-dead-letter-queue.ts  (logs the failed event at error level)
export class LogEventDeadLetterQueue implements EventDeadLetterQueueInterface {
  public async send(event: DomainEventInterface, error: unknown): Promise<void> {
    this.logger.error({
      event: event.name,
      payload: event.payload,
      occurredAt: event.occurredAt,
      err: error,
    });
  }
}
```

To replace logging, add a platform implementation (e.g. MqttEventPublisher) and select
it in wire. Domain, application and decorator do not change.

### `wire` — composes the reliability

```ts
const observability = new PinoObservability();
const eventPublisher = new DecoratorEventPublisher(
  new LogEventPublisher(),
  new LogEventDeadLetterQueue(),
  observability,
);
const usecase = new RegisterDeviceUsecase(repository, eventPublisher);
```

Only wire knows the concrete publisher, DLQ and decorator composition. Real delivery
changes the selected concrete classes here.

## 4. Why decorator + DLQ (the reliability logic)

Data is already committed: publication failure must not undo it or break the request.
Decorator captures the error and sends event + error to DLQ for reprocessing. DLQ
failure is also captured with `stage: "dead-letter-queue"`, never propagated.
A process crash between commit and publish can still lose the event before DLQ receives
it; atomic delivery requires the outbox migration (§7).

## 5. How to start (adding an event to a feature)

1. Confirm the pattern (§0); current is publish + DLQ.
2. domain/events.ts: `<resource>.<fact>` constant + class implementing
   DomainEventInterface<Payload>, with `occurredAt = new Date()`.
3. Application: export `<Feat>EventPublisherInterface = EventPublisherInterface`,
   inject it and publish the persisted event after save.
4. Platform: use/implement transport; current log is not real broker delivery.
5. Wire: inject `DecoratorEventPublisher(publisher, deadLetterQueue, observability)`.
6. Test every piece (§6).

## 6. Testing the concern

Read [common testing rules](testing.md); these are event-specific assertions.

- Domain event: name, payload, occurredAt instanceof Date.
- Decorator + shared mocks: success calls publisher only (no DLQ/observability);
  publisher failure captures + `deadLetterQueue.send(event, error)` without propagation;
  DLQ failure captures stage `dead-letter-queue`, still without propagation.
- Platform log publisher/DLQ: integration-style unit tests with Pino + captured Writable;
  assert emitted records, including DLQ error level.
- Usecase + makeEventPublisherMock: persisted DeviceRegisteredEvent payload; never
  publish on domain/repository failure. Use asymmetric matchers:

  ```ts
  expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(DeviceRegisteredEvent));
  expect(eventPublisher.publish).toHaveBeenCalledWith(
    expect.objectContaining({ name: "device.registered", payload: persisted }),
  );
  ```

Never extract/cast a captured argument (`vi.mocked(...).mock.calls[0]?.[0] as
DeviceRegisteredEvent`). The generic DomainEventInterface port cannot narrow it;
casting only silences TypeScript. expect.any proves class without extra toBeInstanceOf;
objectContaining proves name/payload while ignoring nondeterministic occurredAt.
No casts or intermediate variables.

## 7. Migrating to Outbox in the future — what changes (and what doesn't)

For no-event-loss requirements, **confirm the structural design before implementation**:

- Application/outbound write event + entity atomically in one transaction.
- New platform relay polls outbox, publishes and marks sent; consumers must be idempotent.
- Keep DomainEventInterface/domain event, and possibly EventPublisherInterface for relay transport.
- Remove inline post-commit publishing and decorator+DLQ as the main path; DLQ may remain
  the relay's safety net. This is not a trivial additive change.

## 8. Common mistakes (what NOT to do)

- Do not assume outbox exists or mix patterns; confirm current publish + DLQ.
- Never publish before save or use pre-save data without IDs.
- Never let publishing break an already committed request; decorator captures + DLQs.
- No publication try/catch in usecase; reliability belongs to DecoratorEventPublisher.
- Events belong in domain, not application/inbound.
- No direct broker/SDK calls from domain/application; use EventPublisherInterface,
  platform implementation and wire.
- Logging placeholders do not deliver events; real transport is new implementation.
- Consumers must capture **and rethrow** failures for retry/DLQ, and be idempotent (§9).

## 9. Consuming events (the listener side)

Consumers in another module react through inbound/events without publisher knowledge
of consumers. Reference: account.created → AccountCreatedListener implementing
EventHandlerInterface, issuing a set-password token and emailing the owner.

```ts
export class AccountCreatedListener implements EventHandlerInterface {
  constructor(
    private readonly tokenGenerator: SetPasswordTokenGeneratorInterface,
    private readonly tokenRepository: SetPasswordTokenRepositoryInterface,
    private readonly emailService: EmailServiceInterface,
    private readonly observability: ObservabilityInterface,
    private readonly frontendUrl: string,
  ) {}

  public async handle(event: DomainEvent): Promise<void> {
    const accountCreated = event as AccountCreatedEvent;
    try {
      // ...generate token → persist its HASH → send the welcome email...
    } catch (error) {
      this.observability.capture(error, {
        eventName: accountCreated.eventName,
        ownerUserId: accountCreated.ownerUserId,
      });
      throw error; // re-throw so the transport can retry / DLQ
    }
  }
}
```

Listeners depend on interfaces and have their own wire, as protocol-specific inbound
adapters. Capture then rethrow failures so transport can retry/DLQ; repeated delivery
must be safe (consumer-owned idempotency). Cross-module communication is only by event:
publisher never imports consumer.

### Listener tests

Read [common testing rules](testing.md).

AccountCreatedListener implements EventHandlerInterface in another module, generates
a set-password token, persists its hash and emails the owner. Unit-test with collaborator
mocks + makeObservabilityMock:

- Success: correct collaborator data, persist **hash, never raw token**; email link
  carries the raw token.
- Failure: capture + rethrow for transport retry/DLQ, stop later steps (token-generation
  failure sends no email). One behavior per it.
