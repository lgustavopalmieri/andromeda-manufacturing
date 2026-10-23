# Permission and role catalog

## Operation convention

Each domain uses explicit business operations. `Read` does not include export; `record` does not include correction; `edit draft` does not include approve/publish; `administer` does not include operate. The catalog below is the basis for assignments and may gain operations without expanding existing ones.

| Domain | Distinct minimum operations | Resources and context |
|---|---|---|
| Organization | read/edit profile, branding, location, calendar, and policy | tenant, legal entity, or site |
| Access | read members, invite, activate/suspend, assign/revoke, review, transfer Owner | member, role, scope, and tenant |
| Structure and assets | read, register, edit, deactivate, assign operator/technician | physical hierarchy, asset, device, and capability |
| Data and configuration | read, create, edit draft, submit, review, approve, publish, withdraw | versioned master data, form, rule, HMI, setup, and template |
| Planning and order | read, create/import, schedule, release, dispatch, replan, cancel | product, order, queue, resource, and shift |
| Execution/HMI | read context, prepare, start/pause/resume/close, report, justify, request support | order/operation, shift, asset, and HMI contract |
| Quality | record result, open NC, contain, reinspect, decide disposition/release, grant | sample, lot, unit, plan, and shipping |
| Materials and logistics | receive, inspect, reserve, move, consume, return, adjust, ship | item, lot/serial, balance, location, and logistics unit |
| Maintenance and EHS | request, plan, execute, attest return, record risk/incident, issue/close permit | asset, activity, risk, and work order |
| Telemetry and integration | read signal, configure contract, activate/deactivate, monitor, reprocess, manage credential | asset, source, integration, message, and logical topic |
| Data and auditing | read KPI/detail, export, read trail, and review access | report, classified data, event, and log |

Physical `delete` is not an ordinary operation for facts, telemetry, quality, execution, genealogy, or auditing. When allowed for configuration, it means withdrawing from use and preserving versions and references. A contracted physical command is a separate permission and never a consequence of `start` order in the HMI.

## Recommended role packages

| Base role | Permissions normally grouped | Recommended initial scope |
|---|---|---|
| Account Owner | organization and governance access; Owner transfer | tenant, without operational execution |
| Tenant administrator | members, assignments, branding, and permitted policies | tenant, without production data by default |
| Plant manager | operational view, dispatch, and delegated approval | one or more sites |
| Shift leader | queue, assignment, handover, and operational exceptions | assigned area/line and shift |
| Planner | schedule, release, and replan order | site, product family, or line |
| Process engineering | author/review product, process, setup, and HMI definitions | site, product/process, or authorized standard |
| Setup technician | execute setup, checklist, and evidence | assigned assets and applicable shift |
| Operator | read/execute HMI, report facts, and request support | assigned asset/station and orders |
| Quality inspector | record inspection, NC, and containment | assigned product/process/site |
| Quality approver | decide lot, disposition, and concession | product/site, distinct from the conflicting act |
| Logistics | receive, reserve, move, consume, and ship | authorized warehouse/location and material |
| Maintenance | execute/record service, condition, and failure | assigned assets/maintenance |
| EHS | risk, incident, and work permit | location/activity and local policy |
| Integrator | monitor and reprocess own contract | specific integration and data flow |
| Auditor | read trail, evidence, and allowed export | tenant/site/auditing object, read-only |

Roles can be combined, but the conflicts in [06-state-rules-and-segregation.md](06-state-rules-and-segregation.md) remain active. Direct permissions are a justified and temporary exception; they must not become an informal catalog.

**Example:** a shift leader can prioritize the Packaging Line 3 queue but cannot change an effective formula. If also a setup technician, they receive a second assignment only for designated assets and still cannot approve their own critical release.
