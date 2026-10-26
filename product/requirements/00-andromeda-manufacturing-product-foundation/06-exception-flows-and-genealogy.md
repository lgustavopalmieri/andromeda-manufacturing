# Exception, lot, and genealogy flows

## Downtime, deviation, and resumption

1. A signal, alarm, or operator records the loss of condition/rate.
2. The platform correlates asset, order/operation, shift, and duration; it suggests a category,
   but the responsible person classifies and justifies it when policy requires.
3. If quality, safety, maintenance, or material is involved, containment and the specialized
   flow are created; production resumes only after the applicable release condition.
4. A classification change preserves author, reason, versions, and history; the indicator shows
   raw data, classified data, and outstanding items.

## Quality failure and traceability

1. An out-of-specification result, expired inspection, or rejected sample identifies the affected
   lot, unit, or interval.
2. The system contains material/production according to policy and creates a nonconformity with evidence.
3. Quality decides to reinspect, rework, use under concession, scrap, or release; every decision
   has an owner, justification, and, where applicable, segregated approval.
4. Genealogy finds materials/components and process conditions backwards, and affected products,
   aggregations, inventory, orders, and shipping forwards. End-to-end traceability considers
   transformation, custody, and distribution [S09] [S15].

## Unavailable or incorrect material

Dispatch verifies balance, quality status, expiration, location, and approved substitute. When it
reads a lot/serial identifier, it validates the reservation and product/stage. Substitution, extra
consumption, return, and scrap record quantity, unit, cause, and genealogy relationship. Blocked
material cannot be consumed through an interface shortcut.

## Loss of connectivity, delay, and correction

The operation must distinguish: received, delayed, duplicate, missing, estimated, and corrected
event. The user knows when acting on stale information. On reconnection, the event preserves its
occurrence instant, source, and receipt; it is deduplicated by identification/evidence and ordered
by event instant without concealing conflict. Historical allocation uses the occurrence and policy
effective when the event occurred; it is not recalculated merely because the calendar changed later.

Human correction neither edits nor deletes the raw event: it creates a versioned adjustment that
references the original and states author, instant, reason, approval when required, new
interpretation, and effect on quantities/KPI. The report must show original data, adjustment,
reprocessing time, and completeness indicator. A critical decision requires confirmation of the
current state, not merely historical reading. Separating fact time and record time parallels EPCIS [S15].

## Safety/EHS incident

Any authorized person can record or escalate an unsafe condition; the platform captures location,
activity, potentially exposed people, initial containment, and investigation. Management follows
local policy and legislation, informed by the hazard identification, risk, participation, and
continuous improvement in [S12]; it does not replace emergency response or local authority.

**References:** [S04], [S09], [S11], [S12].
