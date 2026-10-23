# Requirements — assets, work, maintenance, and EHS

## Assets and maintenance

- It must maintain asset hierarchy, criticality, location, capacity, manufacturer/model, counter,
  condition, documentation, associated parts, and event/maintenance history.
- It must permit preventive, corrective, condition-based, and inspection maintenance: request,
  triage, planning, permit, execution, evidence, return to service, and failure analysis.
- It must correlate unavailability, alarm, production downtime, maintenance order, part, and
  capacity impact. "Completed" does not automatically mean "fit to produce".
- It must support lifecycle decisions that balance performance, risk, and spend, without
  prescribing each sector's maintenance policy [S10].

## Work, shifts, and competency

- It must configure shift template, concrete occurrence, site operating calendar, IANA time zone,
  operational-date convention, team, role, station, language, and local working rules. Planned and
  actually worked shifts remain distinct, including overtime, absence, extension, or interruption.
- It must close/open occurrence responsibility through shift handover: outstanding items,
  order/asset state, alarms, downtime, blocked quality/material, EHS risks, and receipt
  confirmation. Handover preserves who delivered, who received, instant, and unaccepted exceptions.
- It must handle daylight-saving start/end by the site's time zone, with actual duration by
  instants and planned duration as expectation; it must not infer a time zone by abbreviation.
  IANA maintains civil rules that change through governmental decisions [S14].
- It must associate people with skills, training, certifications, validity, and task/equipment
  authorization. Dispatch warns of/blocks incompatibility according to policy.
- It must permit work reporting, shift transfer, and context/outstanding-item handover without
  exposing improper information or creating ambiguous responsibility.

## Environment, health, and safety (EHS)

- It must record hazards, risk assessment, controls, work permits, administrative blocks,
  incidents/near misses, investigation, action, and effectiveness verification.
- It must connect EHS condition to order, location, asset, and task, without replacing emergency
  procedures, safety devices, legal training, or site stop authority.
- It must support worker participation, hazard identification, local compliance, and continuous
  improvement, central ISO 45001 themes [S12].

## Priority rule

A production target or KPI never hides a safety restriction, pending quality release, or asset
unavailability. The product makes the conflict explicit and records the decision/authority that
resolved it.

**References:** [S10], [S12], [S03], [S07], [S14].
