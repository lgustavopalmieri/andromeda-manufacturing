# Common Testing Rules

Read this guide whenever writing or revising tests, together with the implementation
reference for the current layer/topic. These rules apply to all runtime suites;
layer-specific examples and assertions live with their implementation guidance. Runner: Vitest.

## 1. Test taxonomy

| Level | Suffix | Config | Command | Database |
| --- | --- | --- | --- | --- |
| Unit | *.test.ts | vitest.config.ts | npm run test | No |
| Integration | *.integration.test.ts | vitest.integration.config.ts | npm run test:integration | Real testcontainer |
| E2E | *.e2e.test.ts | vitest.e2e.config.ts | npm run test:e2e | Real app + Testcontainers |

Unit excludes integration/E2E to remain Docker-independent; never start Postgres for
pure domain/application unit tests. Integration/E2E use 120s
test/180s hook timeouts for container startup. All configs share modules/platform/configs/
@shared aliases. Pure/interface-dependent layers use unit tests with doubles; real
database adapters use integration; assembled graph/wire uses E2E.

## 2. Universal conventions (every layer)

- **Co-locate** tests with their SUT (`usecase.ts` ↔ `usecase.test.ts`).
- **Mandatory runtime suite shape**, including platform, adapters, mappers, listeners
  and testcontainers: outer `describe("<SUT>")`, nested `describe("when <condition>")`,
  cases `it("should <observable behavior>")`. No bare it, top-level scenario without
  SUT, test(...) or vague “works” names. Pure entity interfaces use tsc instead.
  Role denial is a failure condition, never a separate authorization suite; place it
  first in its failure group to reflect gate-before-business ordering.
- **AAA**: one behavior per it, Arrange → Act → Assert. Use phase comments for
  non-trivial setups (integration/E2E, multiple collaborators); optional for short
  makeSut → call → expect tests.
- **Typed makeSut() is mandatory** in every runtime suite; return `{ sut, ...collaborators }`
  and accept overrides. Integration/E2E factories may be async and return container,
  DataSource and teardown. No ad hoc SUT construction in it or unstructured mutable globals.
- **Stubs** implement interfaces with fixed behavior; **mocks/spies** (vi.fn/vi.spyOn)
  verify interactions. makeSut composes them without conflating roles.
- **Centralize data** in `modules/@shared/tests/factories/<module>/`, reused across
  modules/features/test levels: entities, `<Feat>Input` and shared scenario constants
  (e.g. owner roles). Import via aliases, e.g.
  `@shared/tests/factories/machine/machine.factory`. Shared container setup lives in
  `@shared/tests/testcontainers/setup-postgres`; database adapters, transaction managers
  and assembled database flows use that real disposable infrastructure, never mocked DBs.
- **Import shared doubles**, adjacent to their contracts: makeObservabilityMock
  (@shared/observability), makeEventPublisherMock (@shared/events), makeHttpResponseMock
  (@shared/http), makeTokenVerifierMock (@shared/auth). Never redeclare them per feature.
- **Import identity factory** from `@shared/tests/factories/auth/identity.factory`.
  Override only relevant fields (`makeIdentity({ roles: [LOCATION_ROLES.MANAGE] })`,
  `makeIdentity({ roles: [] })` for public input). Never hand-write identity objects.
- **Only makeSut()/makeRequest() wrappers may be local helpers.** They wire the SUT
  and fake Request, composing shared entity/input/identity factories; they are test-only.
  Never add local makeValidBody, duplicate payloads or inline identities. Factories
  supply data; wrappers assemble collaborators.

- Test the real SUT's public behavior and collaboration, not private methods or a
  reconstructed copy of its control flow. Drive `sut.run(work)`, not hand-written
  try/finally around the raw dependency.
- When asserting errors, verify both class and message. Coverage numbers do not replace
  meaningful assertions of specified behavior, invariants, boundaries and failures.
- Integration/E2E suites must release connections and stop containers in `afterAll`,
  including cleanup after partial setup failures.
- Never create module-local `modules/<module>/@testing` factories. Follow the shared
  [factory implementation and example](shared.md#data-factories).

## 3. Suite structure example

This is a structural sketch; the current layer's guide supplies the concrete SUT,
typed `MakeSutInterface`, interface-implementing stubs, imports and expected outputs.
Factories and doubles are imported from their shared locations; only makeSut wires locally.

```ts
const makeSut = (overrides: MakeSutOptions = {}): MakeSutInterface => {
  const dependency = Object.assign(new DependencyStub(), overrides);
  return { sut: new SubjectUnderTest(dependency), dependency };
};

describe("SubjectUnderTest", () => {
  describe("when the input is valid", () => {
    it("should return the expected result", async () => {
      const { sut, dependency } = makeSut();
      const saveSpy = vi.spyOn(dependency, "save");
      const input = makeFeatureInput();

      const result = await sut.execute(input);

      expect(result).toEqual(expectedResult);
      expect(saveSpy).toHaveBeenCalledWith(expectedData);
    });
  });
});
```

Use an interface-implementing stub for fixed results; add `vi.spyOn` or a mock when
asserting interactions. A pure-domain suite has no injected collaborators. Async
integration/E2E makeSut returns real resources and teardown, not repository doubles.

## 4. Find the current layer's tests

Read only the applicable destinations; do not load every recipe for each stage.

| Layer/topic | Test guidance | Level and purpose |
| --- | --- | --- |
| Entity | [Entity validation](entity.md#4-interfaces-and-testability) | Compiler only for pure contracts |
| Domain | [Domain tests](domain.md#4-interfaces-and-testability) | Pure rule unit tests |
| Application | [Usecase tests](application.md#4-interfaces-and-testability) | Roles, orchestration, saga, public usecases |
| Inbound HTTP | [Handler/mapper tests](inbound-http.md#4-interfaces-and-testability) | Protocol adaptation unit tests |
| Outbound | [Adapter tests](outbound.md#4-interfaces-and-testability) | Real persistence integration; transaction unit + integration; external adapter unit |
| Platform | [Infrastructure tests](platform.md#testing-platform-infrastructure) | Real server/logger behavior |
| Shared | [Shared contracts/factories](shared.md#4-interfaces-and-testability) | Reusable contracts, doubles and factory data |
| Auth | [Auth tests](auth.md#5-testing) | Policy, base gate, real crypto, middleware and role bindings |
| Events | [Event tests](events.md#6-testing-the-concern) and [listener tests](events.md#listener-tests) | Publication, DLQ and consumer behavior |
| Listings | [Query tests](listing-queries.md#8-testing) | Query VOs, usecase construction and real repository behavior |
| Wire/E2E | [E2E](e2e.md) and [wire validation](wire.md#4-interfaces-and-testability) | Real assembled flow with Testcontainers |

Tests and implementation belong to the same layer review stage. E2E is its own stage;
follow the backend agent's explicit user-review checkpoints.
