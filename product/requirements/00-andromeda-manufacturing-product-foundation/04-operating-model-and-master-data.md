# Shared Operating Model and Master Information

## Why a common language is needed

An equipment signal, a production order and a maintenance record may describe the same machine
using different names. A shared operating model makes those relationships understandable without
forcing every plant into the same physical arrangement. It supports consistent permissions,
resource planning, operational analysis and key performance indicators. [S01]

## Physical and organizational context

The product can describe organization, legal entity where relevant, site or plant, area,
line or process, cell or work center, work unit or equipment, and component or measurement point.
Levels that do not exist in a particular plant need not be invented. Discrete manufacturing,
continuous processes, batch production and warehousing can share this language while retaining
their different resource relationships.

This hierarchy provides the context for permissions, capacity, calendars, telemetry and analytical
cost attribution. Human-readable equipment codes remain useful, but cannot replace stable identity
when a name or location changes.

## Master information and ownership

| Information family | Content and relationships the operation needs |
| --- | --- |
| Resources | People, skills and certifications, teams, assets, tools, capacity, states and calendars |
| Materials | Item, unit, specification, lot or serial, quality status, expiry, location and balance |
| Products | Finished or intermediate product, revision, specification, bill of materials or formula, and substitution policy |
| Processes | Routing, operations, eligible resources, standard time, instructions, parameters, recipes and quality limits |
| Orders | Origin, product and version, quantity, due date, priority, state, governing routing and related lots |
| Quality | Plans, characteristics, methods, sampling, limits, instruments, decisions and nonconformity |
| Assets | Identity, manufacturer and model, capacity, criticality, location, counters, condition, documentation and maintenance history |
| Operating context | Shifts, calendars, language, units, time zone, standardized reasons and local policy |

For each shared fact, the organization needs a designated owning system and a responsible data
steward. Stable identity, external aliases, version and a conflict-resolution policy prevent two
systems from becoming competing authorities. Information exchanged between enterprise planning and
manufacturing operations remains attributable to that ownership. [S01]

## Lifecycles and controlled change

Important objects have recognizable states and permitted changes. A definition can move through
draft, review, approval, effectiveness and replacement. An order can move from planning and release
through preparation, execution, pause and completion or cancellation. Material and quality states
express whether a quantity is available, reserved, consumed, contained, approved, rejected or subject
to a conditional disposition.

The product preserves who changed a consequential state, when, why and on what evidence. A separate
approver is associated where policy requires it. The business significance of a state matters:
maintenance completion, for example, does not itself mean equipment has been released for production.

## Shift templates, occurrences and operational dates

A shift template describes a recurring local schedule: site, recurrence days, local start and end,
intervals, expected team or role, nominal duration and the governing version. A shift occurrence is
the particular shift on a particular date and site. It has its own identity, planned start and end,
planned duration, time zone, template and policy versions, and a state such as scheduled, open,
closed or cancelled. An authorized team substitution or schedule adjustment changes that occurrence
without rewriting its originating template.

The site has an operational calendar and an explicit convention for shifts crossing midnight.
It may assign an overnight shift to its start date, end date or another approved operational rule.
For example, a 22:00–06:00 shift starting on 10 June can retain 10 June as its operational date;
a production observation at 02:00 on 11 June still belongs to that same occurrence. The displayed
civil date does not silently divide the shift or decide its operational ownership.

Time zones use their full IANA identifiers, rather than ambiguous abbreviations. The Internet
Assigned Numbers Authority (IANA) maintains the time-zone reference used to distinguish local civil
time rules. A change in daylight saving time can make a nominal eight-hour local schedule last
seven or nine actual hours during a one-hour clock change. Planned duration remains an expectation;
actual duration comes from the start and end instants. [S13] [S14]

## Evidence of time and quantity

An observation retains its origin, identity, occurrence instant and offset, source time where
different, receipt instant, quality and available sequence information. It also retains the shift
occurrence, operational date and allocation policy used. Distinguishing occurrence from recording
makes late information explainable; the EPCIS reference uses a similar distinction between fact
time and record time. [S15]

Original units and the conversion applied to a value remain visible. Lot, serial and logistics-unit
identities can be related through transformation, aggregation and disaggregation without becoming
interchangeable concepts. This context lets other capabilities reconcile quantities and explain
history even after names, calendars or organizational structures change. [S09] [S15]

**Conceptual references:** [S01], [S02], [S09], [S10], [S13], [S14], [S15].
