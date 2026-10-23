# Personas, roles, and responsibilities

This platform grants access based on **demonstrable operational need**, not badge title. A person
may perform multiple personas, in distinct tenants or on the same shift, provided each capacity
has an explicit role, permission, scope, and validity period.

## Mandatory terminology

- **Persona** describes the business responsibility; it does not grant access on its own.
- **Role** is a manageable package of permissions, ready to be assigned to a persona.
- **Permission** authorizes a specific business operation, such as releasing a batch or editing a draft.
- **Scope** limits where the operation applies: tenant, site, area, line, cell, asset, or object.
- **Assignment** joins person/identity, role, scope, validity period, and operating conditions.
- **Asset** includes an identified machine, device, station, tool, or physical resource.
- **Owner** is the account's root responsible party, not an exception to operational-safety rules.

## Persona catalog

| Persona | Typical mission and capacity | Usual powers | Non-negotiable limit |
|---|---|---|---|
| Account Owner | Responsible for the tenant and its continuity | activate tenant, define governance, and appoint administrators | receives no operational act or technical approval merely by being Owner |
| Tenant administrator | Administer members, brand, and allowed policy | invite, assign, and review access; manage branding | does not read or alter production by default |
| Plant manager | Be accountable for site operation | monitor, dispatch, and approve delegated operational acts | does not alter corporate standards outside their scope |
| Shift leader | Maintain flow and shift handover | prioritize the queue, allocate work, and escalate exceptions | only on the authorized shift, location, and actions |
| Planner | Turn demand into an executable plan | schedule, release, and reschedule orders | does not execute or rewrite production facts |
| Process/product engineer | Define how to produce | prepare recipe, routing, form, rule, and instruction | does not approve/publish their own critical definition |
| Setup technician | Prepare asset and process for the order | perform authorized checklist, setup, and evidence | does not release their own critical exception |
| Operator | Produce safely and with quality | use HMI, record production/loss/downtime, and request support | only order, action, and asset to which they were assigned |
| Quality | Measure and decide conformance | inspect, contain, decide on batch, and handle NC | does not mask the original result; segregation may separate measurement and decision |
| Warehouse/logistics clerk | Ensure correct and traceable material | receive, reserve, move, and check | does not release blocked material without a valid concession |
| Maintenance/reliability | Restore and preserve asset capability | record failure, perform maintenance, and evidence return | critical asset return may require a distinct approver |
| EHS/safety | Prevent harm and control risk | record/escalate risk, work permit, and incident | does not replace emergency response or physical safeguard |
| Systems integrator | Operate the data-exchange contract | monitor, reprocess, and maintain designated integration | no broad reading of productive content by default |
| Auditor | Verify evidence and conformance | query immutable trail and export when permitted | does not modify records or cross tenants |
| AI agent | Assist or fulfill a delegated task | query, propose, or execute an action listed in the delegation | never receives implicit authority from the sponsoring person |

Roles may be combined in one person, but conflict between acts continues to be assessed by
effective identity and object. Base roles and their operations are in
[04-permission-and-role-catalog.md](04-permission-and-role-catalog.md).
