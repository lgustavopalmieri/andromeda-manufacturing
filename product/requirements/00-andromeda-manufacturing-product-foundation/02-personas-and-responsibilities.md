# Personas, roles, and responsibilities

A person may hold multiple roles, but access is granted based on operational need and
organizational scope — never only by job title. Segregation of duties is required for critical
acts (for example, creating and releasing a formula, or recording and approving a deviation).

| Persona | Work objective | Expected capabilities | Relevant limits |
|---|---|---|---|
| Operator | Produce safely and with quality | view instruction/HMI, start/pause, report production/loss, request help | only authorized assets, orders, and actions; cannot change released definition |
| Shift leader | Maintain shift flow | allocate people, prioritize queue, validate downtime, escalate deviations | does not change corporate governance or data from other shifts without permission |
| Production supervisor/manager | Meet plan and improve performance | dispatch, monitoring, operational approval, analysis by line/site | separate technical/regulatory approval when applicable |
| Planner | Convert demand into feasible execution | capacity, calendar, sequencing, order release | does not execute or change historical events |
| Process/product engineer | Define how to manufacture | product, BOM/formula, recipe, routing, parameters, and instructions | publishing requires a defined review/approval flow |
| Setup technician | Prepare resource for the order | checklist, changeover, authorized configuration, evidence | does not approve their own critical exception when segregation exists |
| Quality | Ensure conformance and lot disposition | plan/sample, result, hold/release, nonconformity/CAPA | decision has scope, reason, and evidence; does not mask original data |
| Storekeeper/logistics | Ensure the right material is in the right place | receipt, inventory, reservation, consumption, transfer, shipment | traceable movements; does not release blocked material |
| Maintenance/reliability | Restore and preserve asset | request, maintenance order, condition, failure, return | does not close without evidence/procedure when required |
| EHS/safety | Prevent harm and meet obligation | risk, work permit, incident, corrective action | authority to stop work according to local policy |
| Tenant administrator | Govern users, brand, and policies | identities, roles, scopes, branding, authorized integrations | does not automatically gain operational access or quality approval |
| Systems integrator | Maintain contracted data exchange | monitor/reprocess integrations within their scope | no broad reading of productive content by default |
| Auditor | Verify evidence and compliance | immutable review, permitted export, trail | does not change records or see another tenant |
| Future AI agent | Assist or execute an explicitly delegated task | consume action contract, propose/execute under policy | own identity, least privilege, confirmation/evidence, and revocation |

## Authorization model

An access decision evaluates: authenticated identity, role/attributes, tenant, physical scope,
object state, requested action, time/shift when applicable, and segregation policy. Every denial
or relevant act may be audited. Emergency access is exceptional, temporary, justified, and
reviewable.

**References:** [S07], [S08], [S11], [S12].
