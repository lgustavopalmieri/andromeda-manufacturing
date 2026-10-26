# Operational Evidence, Indicators and Information Exchange

## The business problem

Two reports can show different performance for the same shift because one uses receipt time,
another uses event time, and neither explains missing observations. Andromeda needs to make
operational information understandable before using it for comparison, escalation or improvement.
Reliable measures depend on clear definitions and contextual evidence, not only a calculated value.

## Facts, history and data quality

An operational event retains what happened, origin, occurrence and receipt instants, source clock
information where provided, quality, available sequence, related operational context and the
version of any interpretation rule. A confirmation or correction is attributable to its person
or delegated agent. Raw observations are not silently overwritten by later interpretation.

People can distinguish complete observations from delay, duplication, missing information and
estimation. Retention, investigation, export, aggregation and eventual disposal follow tenant
policy, information classification and applicable obligations. Disposal does not silently erase
an audit trail that must be retained.

## Allocate events to real shifts

A shift occurrence has its own identity, operational date, time zone, calendar and allocation
policy version. A point observation belongs to the occurrence containing its actual event instant,
not simply the date on which it arrived. A late or out-of-order observation retains that historical
context and its distinct receipt time.

For duration, counters or intervals, the contribution to a shift follows the overlap with actual
shift occurrences and the allocation rule published for the indicator. A downtime interval from
21:55 to 22:10 across a 22:00 shift boundary contributes five minutes to the earlier occurrence
and ten to the next one. Midnight is not a substitute for a shift boundary, and a production or
loss interval crossing a handover needs the same explainable allocation policy.

A shift report identifies the occurrence and its operational date. A separate civil-calendar
report may use local or corporate dates, but labels its calendar, time zone, boundaries and
allocation rule. It is not described as a shift result when it uses a different period.

Planned or nominal duration, actual elapsed duration and productive duration have different
meanings. During a one-hour daylight-saving change, eight local-clock hours may represent seven
or nine actual hours. Availability and other denominators follow the published indicator definition,
not an assumed eight-hour shift or 24-hour day. [S13] [S14]

## Preserve historical interpretation

Changes to calendars, shift templates, time zones or overnight-date policies govern new
occurrences. They do not silently reallocate earlier observations. For example, changing a night
shift from a start-date policy to an end-date policy leaves earlier occurrences associated with
their original operational date and version.

An authorized correction produces a visible adjustment and a new interpretation or recalculation
of the indicator. Date, reason, coverage and links to original observations explain what changed.
This separates a corrected result from deletion of inconvenient history. ISO 8601 and IANA provide
conceptual references for unambiguous instants and civil time rules. [S13] [S14]

## Explain every key performance indicator

A key performance indicator (KPI) has a purpose, formula, population, unit, period, sources,
filters, inclusion and exclusion rules, version, owner and applicable calendar or shift.
Configurable alert or action thresholds belong to that definition. Users need to understand the
measure's coverage before interpreting the result as actual performance.

Relevant measures include availability or uptime, performance, throughput, quality, simplified
overall equipment effectiveness (OEE), plan adherence, scrap and downtime. OEE has meaning only
where availability, performance, quality and planned time are defined for that operation. Its
detail exposes those components, formula and version, period and related orders or events.

People can follow an indicator back to the order, shift, asset, downtime, lot or source event.
Comparisons between plants or lines identify compatible units, calendars, definitions and versions.
MOM indicator terminology is informed by ISO 22400; it does not replace corporate financial or
logistics measures. [S04]

## Information exchange and governed multi-site operation

An integration has a partner or responsible system, information scope, owner, agreed meaning,
identifier mappings, expected exchange frequency, state, failure visibility, reprocessing and
history. Order, performance, material, quality and asset information follow the designated system's
authority. Repeated, out-of-order or invalid information must not duplicate production or corrupt
the business state.

A corporate standard can be reused across sites while allowing approved local differences.
The global definition, site template, permitted adaptations, approvals and adherence remain
understandable rather than becoming disconnected copies. Consolidated reports stay within granted
tenant, company, site, area, line and asset scope, and combine results only where definitions are
meaningfully comparable.

## Business value

Managers can distinguish a genuine production loss from an incomplete data record, and plants can
investigate differences without re-creating the history in separate spreadsheets. Explainable
periods and definitions support fairer comparison, while visible reconciliation problems prevent
an apparently successful information exchange from hiding operational uncertainty.

**Conceptual references:** [S01], [S04], [S05], [S09], [S13], [S14], [S15].
