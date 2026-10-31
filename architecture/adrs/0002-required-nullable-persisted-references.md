# ADR-0002 — Required Nullable Persisted References

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Decision date | 2026-10-31, America/Sao_Paulo |
| Source feature | [EP-00-F01 — Govern scoped access](../../product/epics/00-authorization-first-validation/01-govern-scoped-access.md) |
| Approved package | **SPEC-EP-00-F01 revision 7** — unchanged approved M0 baseline plus the required-nullable actor/location reference correction only |
| Specification | [Requirements](../specs/EP-00-F01-govern-scoped-access.requirements.md), [Design](../specs/EP-00-F01-govern-scoped-access.design.md#revision-7--nullable-reference-representation), [Tasks](../specs/EP-00-F01-govern-scoped-access.tasks.md#approved-revision-7-correction-handoff) |
| Approval evidence | The user explicitly requested “então gostaria que fosse ownerActorId: string \| null; e removessemos os OptionalFieldsSubscriber”. Removal of both actor/location subscribers and the same representation for `parentLocationId` is the coordinator's stated interpretation of the surrounding discussion; the quote itself names only `ownerActorId`. |
| Implementation authorization | The same request explicitly authorizes this correction to the current grouped M0-18–21 work. Accepted records the decision; Backend still must implement and revalidate it. M0-22 is not authorized. |
| Relationship | Supersedes [ADR-0001](0001-m0-graph-authoritative-authorization-foundation.md) **only** for optional/omission representation of these two persisted references; carries forward all its unchanged approved M0 decisions by reference. |

## Context and drivers

The retained SQL schema already stores an absent actor owner and location parent as NULL. Revision 6's pure entity contracts represented these references as optional strings. Its initial mapping implementation used two local subscribers to delete hydrated/save-output null properties so that ORM results matched those contracts.

The requester now wants an explicit nullable property and removal of the optional-field subscribers. The correction aligns the complete persisted entity shape with the existing SQL representation and TypeORM nullable-column behavior. It does not change which references may exist, foreign-key enforcement, tenant ownership or any permission decision.

## Decision

1. Define `ActorEntityInterface.ownerActorId: string | null` and `LocationEntityInterface.parentLocationId: string | null` as required complete-entity properties. Null represents no persisted reference; strings retain their existing meaning.
2. Map the existing nullable SQL columns directly. Remove both actor/location optional-field subscribers, their helper shapes/decorators/imports and datasource registrations. Do not replace them with a null-to-undefined/delete transformer or another normalization layer.
3. Full persisted entities expose these properties, including null after hydration and complete-entity save/insert/update. Explicit typed null clears a reference. A TypeORM partial update may omit a column to leave it unchanged; such a partial update is not the complete entity contract.
4. Align factories and future seeds with explicit null defaults. Preserve the service/agent owner rule as future domain validation requiring a non-null owner where applicable; this decision adds no lifecycle/domain validation.
5. Retain every unrelated approved M0 decision from ADR-0001: graph-authoritative authorization, trusted identity context, global actor/tenant/membership gates, provider binding, post-allow tenant-filtered business reads, failure/logging boundaries and controlled-scope delivery. Existing SQL schema, twenty constraints, thirteen indexes, transaction behavior and migration assets are unchanged.

## Alternatives and consequences

| Alternative | Outcome |
| --- | --- |
| Keep optional strings and omission subscribers | Rejected by the user's explicit correction; requires hydration/save-output normalization solely to remove SQL null values. |
| Accept optional string-or-null properties | Rejected because it retains three complete-entity states: string, null and absent/undefined. The requested representation makes absence explicit. |
| Required nullable references with direct mapping | Selected. Complete consumers/factories must now provide and handle null; TypeScript catches old missing/undefined reference fields. No database migration is required because storage already permits NULL. |

Prior revision-6 task acceptance and execution evidence remain historical facts. Changed actor/location consumers and the grouped mapping implementation must be revalidated against revision 7; historical omission assertions do not validate the new behavior. Membership/machine contracts, tenant-safe relationships and authority remain unchanged.

## Conformance and follow-up

TC-M0-06 verifies the complete changed contracts accept string/null and reject missing/undefined references under strict compiler settings. TC-M0-07 uses real PostgreSQL to verify strings and explicit null after save, find, QueryBuilder entity hydration and reconnect, plus typed null clearing and unchanged omitted partial-update behavior. Datasource composition must register the same five mappings without either optional-field subscriber.

Backend records compiler/lint/integration and affected composition results in Tasks. The grouped M0-18–21 implementation review remains pending. This accepted correction does not accept its future runtime results, begin M0-22, approve later F01 milestone designs or close G01–G04.

## Relationships

ADR-0001 preserves the original revision-6 approval and baseline decisions. This record is the current narrow supersession for nullable-reference representation and reuses all other accepted baseline decisions rather than reopening them. The canonical three-part package remains the single specification for EP-00-F01.
