# Requirements — data, KPIs, integrations, and governance

## Events, history, and data quality

- Operational events must be treated as contextual evidence: fact, origin, occurrence and receipt
  instants, quality, correlation, rule version, and the identity of the person who confirmed/corrected it.
- It must support retention, querying, export, aggregation, and disposal according to tenant policy,
  legal obligation, and information classification; retention does not erase a required audit trail.
- It must show incompleteness, delay, duplication, and estimation. An indicator must state coverage
  and definition so that a user does not mistake missing data for actual performance.

## Time allocation and KPI periods

- Every raw event retains, without overwriting, its occurrence instant with offset, source instant/
  clock when provided, receipt instant, origin, quality, and available sequence. It references the
  shift occurrence, operational date, time zone, and policy version allocated to it; a late/out-of-
  order event receives the same transparency, not a new fact.
- For a point measurement, the occurrence is the one containing the event instant. For duration,
  counter, or interval, the contribution is calculated by the **intersection with actual shift
  occurrences**, not by simplistic division at midnight on the calendar day. Production and loss
  from an interval follow the allocation rule published in the KPI, including when crossing a shift change.
- A shift report uses the identified occurrence and its operational date. An optional civil report
  may use the local or corporate calendar but must state its label, time zone, boundary, and
  allocation rule; it cannot be called a "per shift" result. The overnight convention (start or
  end date) is a versioned tenant/site policy.
- Planned/nominal duration, actual elapsed duration, and productive duration are distinct fields.
  During a DST change, eight local-clock hours may correspond to seven or nine actual hours;
  availability and denominators use the published definition, never an assumption of 24 hours.
- Changing the calendar, template, time zone, or policy affects new occurrences. It does not
  rewrite historical allocation; an authorized correction creates a traceable adjustment and a new
  KPI version/reprocessing with date, reason, coverage, and linkage to the original events. ISO 8601
  and IANA support the unambiguous expression of instants and civil rules [S13] [S14].

## Reliable KPIs

- Every KPI has a name, purpose, formula, population, unit, period, source, filters,
  inclusion/exclusion rules, version, owner, applicable calendar/shift, and configurable alert/action thresholds.
- It must calculate and explain measures such as availability/uptime, performance/throughput,
  quality, simplified OEE, plan adherence, scrap rate, and downtime. OEE is displayed only when its
  components and planned time are defined for that context.
- It must allow drilling into a KPI down to order, shift, asset, downtime, lot, and source event.
  It must not compare plants/lines without declaring compatible unit, calendar, definition, and version.
- KPI terminology is inspired by ISO 22400 for MOM and does not replace corporate financial/
  logistics-level targets [S04].

## Integrations and multi-site

- It must maintain an integration catalog: partner/system, data scope, owner, contract, identifier
  mappings, frequency, state, failure, reprocessing, and auditing.
- It must support receiving and returning order, performance, material, quality, and asset
  transactions according to defined responsibility. A repeated, out-of-order, or invalid message
  must not duplicate production or corrupt state.
- It must allow a reusable corporate standard and governed local variation: global model, site
  template, allowed adaptation, approval, and adherence comparison.
- It must provide reports by tenant, company/site/area/line/asset, consolidating only when the user
  is authorized and definitions are comparable.

**References:** [S01], [S04], [S05], [S09], [S13], [S14], [S15].
