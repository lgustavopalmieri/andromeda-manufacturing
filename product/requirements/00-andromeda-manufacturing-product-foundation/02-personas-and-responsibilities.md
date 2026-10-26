# People, Roles and Operational Responsibility

## The need for clear authority

Factory work crosses production, engineering, quality, logistics and maintenance. One person may
hold several roles, especially in a smaller plant, but access follows the task and its operational
scope rather than the job title alone. Clear responsibility prevents an exception from being
approved by someone without the necessary authority and makes handovers understandable.

Segregation of duties matters for critical decisions. For example, the person creating a formula
may need a different person to release it, and the person recording a deviation may not be allowed
to approve their own exception. The applicable policy determines where that separation is required.

## People the product supports

| Role | Operational purpose and useful capabilities | Authority boundary |
| --- | --- | --- |
| Operator | Follow instructions, view the HMI, start or pause work, report production and losses, and request help | Assigned assets, orders and actions; released process definitions remain controlled |
| Shift leader | Allocate people, organize the shift queue, review downtime and escalate deviations | The permitted shift and physical scope, without unrestricted corporate administration |
| Production supervisor or manager | Dispatch work, monitor performance, approve operational decisions and analyze a line or site | Technical or regulatory approvals remain with the designated authority |
| Planner | Relate demand to capacity, calendars, sequence and order release | Planning does not grant execution authority or the right to rewrite historical results |
| Process or product engineer | Define products, bills of materials or formulas, recipes, routings, parameters and instructions | Publication follows the applicable review and approval policy |
| Setup technician | Prepare equipment, perform changeover and cleaning, apply authorized setup and record preparation evidence | Critical exceptions cannot be self-approved where segregation applies |
| Quality professional | Define inspections and sampling, assess results, contain nonconformity and decide disposition | Decisions need scope, reason and evidence; original observations remain visible |
| Storekeeper or logistics professional | Receive, locate, reserve, move, consume, return and ship material | A balance or custody responsibility does not authorize release of blocked material |
| Maintenance or reliability professional | Manage condition, failures, maintenance work and return to service | Required procedures and evidence remain necessary for restoring productive availability |
| Environment, health and safety professional | Manage hazards, permits, incidents and corrective action | Local policy determines stop-work and release authority |
| Tenant administrator | Govern identities, permissions, policies, branding and authorized integrations | Administration does not automatically grant operational or quality-release authority |
| Systems integrator | Monitor and reconcile the agreed information exchange | Integration support does not imply broad access to production content |
| Auditor | Review evidence and permitted exports without changing the records | Access stays within the authorized organization and scope |
| Future AI agent | Query, propose or execute a specifically delegated task through the action contract | Separate identity, least privilege, required confirmation, evidence and revocation |

## How responsibility is interpreted

An authorization decision considers the authenticated identity, role or relevant attributes,
tenant, physical scope, requested action, object state, time or shift where relevant, and any
segregation policy. Roles are useful ways to organize access, but do not replace those conditions.
A supervisor authorized for one line, for example, does not gain access to another line merely
because both belong to the same company.

Emergency access is exceptional rather than a permanent shortcut. It is temporary, justified and
reviewable. Relevant actions and denied attempts remain attributable according to policy. This
supports operational continuity while preserving accountability for unusual decisions.

## Business impact

People receive the information and actions appropriate to their work without losing the wider
context needed to request help. The organization can explain who was responsible at a given time,
who made a consequential decision and whether that person had authority. The same clarity is
necessary before delegating any operational responsibility to an AI agent.

**Conceptual references:** [S07], [S08], [S11], [S12].
