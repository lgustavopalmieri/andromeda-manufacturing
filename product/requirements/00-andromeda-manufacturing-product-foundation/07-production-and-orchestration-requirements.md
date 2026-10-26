# Requirements — production, engineering, and orchestration

## Product and process engineering

- The system must maintain product and version/revision, BOM or formula, routing, operations,
  eligible resources, parameters, instructions, quality criteria, and controlled attachments.
- For batch processes, it must support separation between general and site recipe, recipe/procedure
  structure, and batch record; the model follows ISA-88 concepts [S02].
- A change must undergo a configurable review/approval, effective-date, and communication flow;
  publication identifies impact on orders, inventory, training, and HMI.
- Reusable setup must be storable as a versioned template, with declared compatibility for product,
  resource, location, and validity range.

## Detailed planning and dispatch

- The platform must receive and expose demand/order, prioritize it through explainable rules, and
  allocate resource, date/shift, and sequence while respecting available constraints.
- It must report planned versus effective capacity and expose calendar, competency, maintenance,
  material, and quality conflicts before dispatch.
- Replanning cannot erase the prior plan or completion; reason, author, and impact must be
  auditable. Users change queues only within their scope and authority.

## Production execution and recording

- Each operation must accept start, pause, resumption, closure, cancellation, and transfer of
  responsibility with appropriate state rules and confirmation.
- It must record good quantity, loss, scrap, rework, yield, time, consumption, and intermediate/
  finished production by order/operation/resource/shift.
- It must allow hierarchical and configurable reasons for losses and downtime, without silently
  reclassifying the original fact. Mandatory reason and dual approval are tenant policies.
- It must generate an electronic execution record with operator/agent, instruction and applied
  versions, evidence, exceptions, and signatures/attestation when local policy requires them.

## Authority rule

No business rule turns Andromeda into the safety controller or source of truth for interlocking.
A "start" action in the product can mean requesting, recording, or confirming a start; its effect
and confirmation are explicit in the HMI/integration contract.

**References:** [S01], [S02], [S03], [S06].
