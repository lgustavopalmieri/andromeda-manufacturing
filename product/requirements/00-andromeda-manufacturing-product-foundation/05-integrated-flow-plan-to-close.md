# Integrated flow: plan to close

This flow describes the traceable minimum for an order; plants may add approvals and stages. It
separates enterprise planning (level 4), manufacturing operations (level 3), and physical control
(levels 0–2), without assuming a specific technology [S01].

1. **Define and release:** engineering releases the product version, BOM/formula, routing,
   recipe, instructions, quality limits, and eligible resources. A subsequent change does not
   rewrite execution that has already started.
2. **Receive demand:** the ERP or planner creates/updates an order with product, quantity, due
   date, priority, and origin. The platform validates master data, idempotency, and accepted state.
3. **Plan and dispatch:** capacity, calendar, concrete shift occurrence, material, tool,
   maintenance, and competency constraints produce a justified queue. The supervisor may
   prioritize within policy and is accountable for the reason for deviation.
4. **Prepare:** technician/operator confirms resource, cleaning/changeover, reserved material,
   applicable version, training, and safety/quality prerequisites; a discrepancy blocks or
   requires formal authorization.
5. **Execute:** the HMI shows task, equipment state, parameters, instruction, and permitted
   actions. Automatic events and human reports record start, good quantity, loss, consumption,
   downtime, and conditions, associated with the current shift occurrence and operational date;
   crossing midnight does not automatically end or reassign execution.
6. **Control quality:** inspections are requested by plan/result/event; material or production
   remains in the appropriate state until a decision. A nonconformity remains linked to order,
   operation, lot, asset, person, and version.
7. **Close and reconcile:** validate quantities, yields, consumption, rework, leftovers, lot
   status, and outstanding items. Confirm completion to the ERP and issue exceptions on failure.
8. **Learn:** consolidate genealogy and indicators; investigate deviation and create corrective
   action without modifying the source evidence.

## Flow integrity criteria

- An order does not enter execution without an effective process version, physical scope, and owner.
- Good product, loss, rework, and consumed material complete an explainable reconciliation.
- Late or duplicate events are preserved/identified without doubling quantity or KPI; the initial
  occurrence, calendar version, and arrival information make the adjustment explainable.
- A pause due to machine, material, quality, safety, or person has defined reason, duration, and
  resumption flow; the reason cannot erase the observed raw state.
- The confirmation returned to the ERP identifies the source order and the completion version/instant.

**References:** [S01], [S02], [S03], [S09], [S13], [S15].
