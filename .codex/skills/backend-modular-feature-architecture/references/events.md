# Domain events — publishing (cross-cutting concern)

> Reference for the `modular-feature-architecture` skill. Just like testing, events
> **cross every layer**. Reference example: the `device.registered` event from the
> `register` feature. The transport stack is swappable — today it's a **log
> placeholder**, not a real broker.

## 0. BEFORE YOU START: which pattern is it? (read this first)

There are two possible patterns for "write to the database **and** publish an
event". **Always confirm which one is in use in the service before implementing.**

| Pattern                           | How it works                                                                                                                                    | When                                                  | Status in this project                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| **Publish + DLQ** (current)       | publishes the event **after** the commit, in the same flow; if it fails, it falls into a _dead-letter queue_ and the request **does not** break | simplicity; tolerates a small window of inconsistency | **This is the current pattern.** It's the one described in this file. |
| **Transactional Outbox** (future) | writes the event to an `outbox` table **in the same transaction** as the entity; a _relay_ reads the outbox and publishes                       | when "never lose the event" becomes a requirement     | **Does not exist yet.** It will have to be built (see §7).            |

Two truths that must always be clear:

1. **The current pattern is publish + DLQ.** If a task calls for strong delivery
   guarantees (outbox), that's **new** infrastructure work (table + relay) — don't
   assume it already exists. Confirm it and, if so, align on it beforehand.
2. **`platform/` today only `log`s.** `LogEventPublisher` and
   `LogEventDeadLetterQueue` **don't deliver** to any real broker yet — they're
   placeholders that prove the flow. Publishing for real (MQTT, Kafka, SNS/SQS...)
   is a new implementation **behind the same interface**, without touching
   domain/application.

Never **mix** the two patterns within the same feature.

## 1. Core concept

A **domain event** represents something in the business that **happened**
(`device.registered`). It's published so that **future listeners** (other
services/features) can react, without the publishing feature knowing who consumes
it.

The architecture splits three responsibilities by **interface**:

- **what happened** → the event is a **domain** concept (`domain/events.ts`);
- **how to publish** → an `EventPublisherInterface` _port_ (contract in `@shared`);
- **reliability** (what to do if publishing fails) → a **decorator** in `@shared`
  that wraps the publisher and falls back to a **DLQ**;
- **concrete transport** → an implementation in `platform/` (today, log).

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

The event and port contracts are agnostic of both feature and transport:

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

The **decorator** is the current pattern's reliability core — it implements
`EventPublisherInterface` itself, so whoever publishes doesn't know a DLQ is behind
it:

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

Alongside sit the mocks (`event-publisher.mock.ts`, `event-dead-letter-queue.mock.ts`),
next to the contracts they double — the same pattern as `@shared`'s other contracts.

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

The event lives in the feature's **domain** because it's business vocabulary: it
names the fact (`device.registered`) and types the payload (`DeviceEntityInterface`).
The name becomes an exported constant (consumers and tests reference it without a
magic string).

### `application/` — publishes AFTER persisting

The application names its port and injects the publisher as an **interface**:

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

**The order is the rule**, and it defines the pattern:

- it publishes **after** `save`, and with the **persisted entity** (already has
  `id` and timestamps in the payload);
- if the domain (`create`) or the repository (`save`) fails, the event is **not**
  published — the error bubbles up normally to the inbound layer;
- the usecase depends on `EventPublisherInterface`, not on the decorator nor on the
  transport; there's no publish `try/catch` here — reliability is the decorator's
  job.

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

Swapping log for a real broker = a **new class** in `platform/` implementing the
same interface (e.g., `MqttEventPublisher`), plugged into the wire. Domain,
application, and the decorator **don't change**.

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

The wire is the only point that knows the "real" publisher is the log-based one and
that a decorator with a DLQ sits in front of it. To publish for real, only the
concrete classes here need to change.

## 4. Why decorator + DLQ (the reliability logic)

- The device **has already been saved** when we publish. A publish failure
  **cannot** undo it or break the request — that's why the decorator **swallows**
  the publish error, logs it to observability, and sends the event to the **DLQ**
  (for reprocessing).
- If **the DLQ itself** fails, there's also nothing to be done within the request's
  flow: it just captures it in observability with `stage: "dead-letter-queue"` and
  moves on. **It never propagates.**
- **Trade-off (the reason outbox exists):** there's a window between the commit and
  the publish. If the process dies exactly there, the event is lost without ever
  reaching the DLQ. Whoever needs an atomic guarantee migrates to **outbox** (§7).

## 5. How to start (adding an event to a feature)

1. **Confirm the pattern** (§0). Today it's publish + DLQ.
2. `domain/events.ts`: a constant with the name (`"<resource>.<fact>"`) + a class
   `implements DomainEventInterface<Payload>` with `occurredAt = new Date()`.
3. `application/`: export `type <Feat>EventPublisherInterface = EventPublisherInterface`,
   inject it into the usecase's constructor, and `publish(new <Feat>Event(persisted))`
   **after** persisting.
4. `platform/events/`: if there's no transport yet, use/implement one (today
   log-based). A real broker = a new implementation behind the same interface.
5. `wire`: assemble `new DecoratorEventPublisher(publisher, deadLetterQueue, observability)`
   and inject it into the usecase.
6. Write the tests for each piece (§6).

## 6. Testing the concern (summary; detail in `references/testing.md`)

- **Domain event** (unit): `name`, `payload`, `occurredAt` is a `Date`.
- **Decorator** (unit, the most important): success delegates to the publisher and
  **doesn't** touch the DLQ/observability; a publisher failure → `capture` +
  `deadLetterQueue.send(event, error)` and **doesn't propagate**; a DLQ failure →
  `capture` with `stage: "dead-letter-queue"` and doesn't propagate. Uses `@shared`'s
  mocks.
- **`platform/` implementations** (unit, integration-style): pino into a captured
  `Writable`, asserting the emitted record (both the log one and the DLQ one at
  error level).
- **Usecase** (unit): publishes `DeviceRegisteredEvent` with the **persisted**
  payload; **doesn't** publish when the domain or the repository fails. Uses
  `makeEventPublisherMock`.

  Assert the published event with **asymmetric matchers**, never by extracting and
  casting the mock's captured argument:

  ```ts
  expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(DeviceRegisteredEvent));
  expect(eventPublisher.publish).toHaveBeenCalledWith(
    expect.objectContaining({ name: "device.registered", payload: persisted }),
  );
  ```

  ❌ `const publishedEvent = vi.mocked(eventPublisher.publish).mock.calls[0]?.[0] as
DeviceRegisteredEvent` — the port's signature
  (`publish(event: DomainEventInterface)`) is generic on purpose, so there's no type
  for TypeScript to narrow to; the cast just silences the compiler without testing
  anything. `expect.any(...)` already proves the concrete class (no `toBeInstanceOf`
  needed) and `expect.objectContaining(...)` already proves `name`/`payload` (and
  correctly ignores the non-deterministic `occurredAt`).

## 7. Migrating to Outbox in the future — what changes (and what doesn't)

When "don't lose the event" becomes a requirement:

- **Changes** in `outbound/` + `application/`: the event starts being **written to
  an `outbox` table in the same transaction** as the entity's `save` (write+event
  atomicity).
- **A relay is born** (a poller/worker in `platform/`) that reads the `outbox`,
  publishes to the broker, and marks it as sent; consumers need to be
  **idempotent**.
- **Can stay**: `DomainEventInterface`, the domain event, and, possibly,
  `EventPublisherInterface` (the relay uses it for transport).
- **Goes away**: the "inline after the commit" publish and the decorator+DLQ as the
  main path (the DLQ can remain as the relay's safety net).
- **Confirm the design before implementing** — this is a structural change, not a
  trivial additive one.

## 8. Common mistakes (what NOT to do)

- ❌ **Assuming outbox already exists.** ✅ Check (§0); today it's publish + DLQ.
- ❌ Publishing **before** persisting, or publishing the pre-save entity (with no
  `id`). ✅ Publish **after** `save`, with the persisted entity.
- ❌ Letting a publish failure **break the request** (the data was already saved).
  ✅ The decorator swallows it, captures it, and sends it to the DLQ.
- ❌ Putting the publish `try/catch` in the usecase. ✅ Reliability belongs to
  `DecoratorEventPublisher`; the usecase only calls `publish`.
- ❌ Putting the event in `application/`/`inbound/`. ✅ It's a **domain** concept
  (`domain/events.ts`).
- ❌ Calling a broker/SDK directly from the domain or application. ✅ Behind
  `EventPublisherInterface`; the concrete implementation lives in `platform/` and
  enters through the `wire`.
- ❌ Forgetting that `platform/` **today only logs** and thinking it already
  delivers to a broker. ✅ Real delivery is a new implementation behind the same
  interface.
- ❌ **Mixing** publish+DLQ with outbox in the same feature. ✅ One confirmed
  pattern only.
- ❌ A **consumer** (listener) that swallows its error. ✅ Capture via observability
  **and** re-throw so the transport can retry / DLQ; make the handler idempotent
  (§9).

## 9. Consuming events (the listener side)

Publishing has a counterpart: **consuming**. A feature in **another** module reacts to
a published event through an `inbound/events/` listener — the publishing module knows
nothing about who consumes (decoupling via the event). Reference: `account/create-account`
publishes `account.created`, and the listener `AccountCreatedListener implements
EventHandlerInterface` reacts by issuing a set-password token and emailing the owner.

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

Rules for a listener:

- It lives in `inbound/events/` (an input adapter for the "events" protocol), depends
  on **interfaces**, and is assembled in its own `wire` — same shape as `inbound/http/`,
  different protocol.
- **Capture then re-throw** on failure: observability records it **and** the error
  propagates, so the transport can retry or route to a DLQ. Don't swallow it.
- **Idempotency** is the consumer's responsibility (at-least-once delivery): handling
  the same event twice must be safe.
- Cross-module communication is **only** through the event — the publisher never
  imports the consumer.

Testing (unit) is described in `references/testing.md` (`inbound/events/` — event
consumer): assert the side effects on success (and that a secret like a token is
persisted **hashed**, never raw), and that a failing step is captured, re-thrown, and
stops the later steps.
