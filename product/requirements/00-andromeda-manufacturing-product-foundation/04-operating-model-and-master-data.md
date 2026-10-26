# Operating model and master data

## Physical and organizational hierarchy

Adopt the hierarchy **tenant/organization → legal entity (when needed) → site/plant → area →
line/process → cell/work center → work unit/equipment → component or measurement point** as a
configurable logical model. It must be able to represent discrete manufacturing, continuous
processes, batch production, and warehousing operations without forcing every level. It is the
anchor for permissions, capacity, planning, telemetry, analytical cost, and KPIs [S01].

## Shared master data

| Family | Minimum content and relationship |
|---|---|
| Resource | person, skill/certification, team, asset, tool, capacity, state, and calendar |
| Material | item, unit, specification, lot/serial number, quality status, validity, location, and balance |
| Product | finished/intermediate product, revision, specification, BOM/formula, and substitution rule |
| Process | routing/operation, eligible resource, standard time, instruction, parameter, recipe, and acceptance criterion |
| Order | origin, product/version, quantity, due date/priority, state, frozen routing, and lot link |
| Quality | plan, characteristic, method, sampling, limit, instrument, decision, and nonconformity |
| Asset | identifier, manufacturer/model, capacity, criticality, location, counter, condition, and maintenance |
| Context | shift, calendar, language, unit, time zone, standardized reason, and local policy |

## Ownership and synchronization rule

For every master attribute, there must be an owning system, data steward, stable internal key,
external identifiers/aliases, version, and conflict-resolution rule. Andromeda must not create two
"owners" for the same fact. The exchange of objects and transactions between enterprise and
operations levels must be contracted and traceable, consistent with ISA-95 [S01].

## Controlled states and transitions

Critical objects use explicit lifecycles. Examples: definition in draft → revision → approved →
effective → replaced/obsolete; planned order → released → prepared → in progress → paused →
completed/cancelled; available material → reserved → consumed/quarantined/blocked; pending
quality lot → approved/rejected/conditional. Every change records its author, instant, reason,
evidence, and, when required, a different approver.

## Time, calendar, and shift

A **shift template** is the planned and versioned rule (site, recurrence days, local time,
intervals, expected team/role, and nominal duration). A **shift occurrence** is the concrete
instance generated for a date/location: unique identifier, planned start and end as instants, IANA
time zone, template/policy version, planned duration, and state (scheduled, open, closed,
cancelled). An occurrence may have a team substitution or authorized adjustment without changing
the template that originated it.

Every site must have an operational calendar, IANA time zone, operational-day convention, and
allocation policy for a shift that crosses midnight: by start date, end date, or another explicit
rule approved by the tenant. The policy produces an `operational date` for the occurrence; it is
not inferred from the displayed calendar date. A 22:00–06:00 shift, for example, belongs to the
date defined by the policy and is not silently divided into two days.

Every raw event immutably preserves: identifier/origin, `event instant` with offset, the instant
provided by the source when different, receipt instant, quality, and allocation to the shift
occurrence/operational date with the policy version used. The model distinguishes actual event
instant from record instant, like the GS1 EPCIS `eventTime`/`recordTime` distinction [S15].
Interchangeable dates/times use an unambiguous representation based on ISO 8601 [S13].

Occurrences are materialized in the site's time zone, not by ambiguous abbreviation. Daylight
saving time changes may yield an actual duration shorter or longer than the nominal duration:
actual duration is always the difference between instants; planned duration is the template's
expectation. The rule must use the IANA database, which maintains historical and future time zone/
daylight-saving transitions [S14].

## Units and identification

Values always preserve the original unit and the conversion used. Human-readable codes do not
replace stable identifiers. Lot, serial number, and logistic unit may be linked through
transformation, aggregation, and disaggregation [S09] [S15].

**References:** [S01], [S02], [S09], [S10], [S13], [S14], [S15].
