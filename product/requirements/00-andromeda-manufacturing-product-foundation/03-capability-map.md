# Platform capability map

The map uses the four MOM operations of production, quality, inventory, and maintenance and their
recurring activities (definition, resources, detailed scheduling, dispatch, execution,
collection, tracking, and analysis) as its backbone [S03] [S04]. The modules are integrated; they are not
isolated information licenses or services.

| Domain | Business capabilities | Observable outcome |
|---|---|---|
| Organization and governance | tenant, brand, locations, calendars, units, policies, users, and permissions | coherent and isolated global operation |
| Industrial model | physical hierarchy, assets, capabilities, states, materials, products, specifications | single shop-floor language |
| Product/process engineering | BOM/formula, recipe, routing, parameters, instructions, and changes | reproducible execution by version |
| Enterprise integration | requests/orders, demand, inventory, master data, confirmation, and exceptions | reconciled ERP and operation |
| Planning and dispatch | capacity, calendar, queue, sequencing, allocation, and priorities | right order at the right resource and shift |
| Production execution (MES) | preparation, setup, start/end, counting, consumption, losses, rework, closure | complete electronic production record |
| SCADA, connectivity, and HMI | acquisition, state, alarms, trends, authorized command, screens, and actions | real-time context with safe interaction |
| Materials and inventory | receipt, inspection, balance, reservation, movement, consumption, lot/serial | correct, traceable, and available material |
| Quality | control plan, sampling, inspection, future SPC, NC, containment, release | quality decision linked to genealogy |
| Maintenance and reliability | condition, failure, request, preventive/corrective maintenance, parts, history | controlled asset availability and risk |
| Work and competency | shifts, team, qualification, instruction, reporting, and local fatigue/limit | qualified person on the permitted task |
| EHS and compliance | risks, work permits, incidents, actions, evidence | protection and systemic improvement |
| Logistics and shipping | packaging, aggregation, picking, verification, dispatch, tracking | released product arrives with proof of origin |
| Data and performance | events, history, genealogy, KPI, reports, alerts, investigation | fact-based decision, not an isolated spreadsheet |
| Configuration and extensibility | forms, rules, workflows, HMI, versions, templates, localizations | adaptation without losing control |
| Security and auditing | identity, authorization, logs, retention, privacy, integration governance | operational trust and accountability |

## Module completeness criterion

A module is considered usable only when it defines: master data, roles and permissions, normal
flow and exceptions, evidence/auditing, versioning, tenant/local scope, and adoption indicators.
A screen without these decisions does not constitute an industrial capability.

**References:** [S01], [S03], [S04], [S09], [S10].
