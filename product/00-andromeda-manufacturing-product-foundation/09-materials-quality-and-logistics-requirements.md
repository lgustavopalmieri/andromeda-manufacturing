# Requirements — materials, quality, logistics, and shipping

## Materials and operational inventory

- Must support receiving/identification, incoming inspection, location, balance, status,
  reservation, transfer, consumption, return, adjustment with approval, and cycle counting.
- Each movement retains origin, destination, quantity/unit, lot/serial, responsible party, timestamp,
  order/process when applicable, and justification. Visible balance is not authorization for use.
- Material allocation validates product compatibility, revision, quality status,
  validity, storage condition, and substitution rule. It must prevent improper consumption or
  formally record an authorized concession.

## In-process quality and release

- Must define control plans by product/process/site/version: characteristics, method,
  frequency/sample, limit, instrument, instruction, and result consequence.
- Must record result, unit, method, instrument, operator, timestamp, evidence, and decision.
  Manual and automatic results are distinguishable; correction preserves the original value and reason.
- Must handle nonconformity, containment, disposition, rework, concession, cause,
  corrective/preventive action, and effectiveness verification, linking all of them to genealogy.
- Must allow quality decisions on material, lot, unit, and shipping, with configurable permissions and
  segregation. The evidence supports a quality system, without claiming automatic
  ISO certification [S11].

## Traceability, packaging, and shipping

- Must distinguish three granularities, without treating them as equivalent: **unit/serial** is an
  identifiable individual instance; **lot/batch** groups produced/received quantity under
  common conditions; **logistics unit** (box, pallet, container) identifies the packaging or
  load that may contain items/lots. GTIN+serial, GTIN+lot, and SSCC illustrate the levels [S09] [S16].
- The traceability policy is configurable by product, site, customer, and sector: it may require
  serialized unit, lot only, or both. The product does not claim that every industry requires
  genealogy by unit; granularity is chosen in proportion to risk, obligation, and feasibility.
- Must record immutable relationships to **consume, produce, transform, split, merge,
  aggregate, disaggregate, rework, relabel, return, and scrap**. A relationship is not deleted when
  corrected: the adjustment points to the previous relationship and makes destination/disposition explicit.
- Each genealogy event must capture identification/granularity, origin and destination/custody,
  location, requested and actual quantity with UOM, order/operation, resource, people/agent,
  timestamp, recipe/process/HMI versions, quality results, and critical parameters when
  applicable. EPCIS events formalize transformation and aggregation/disaggregation [S15].
- Must build backward and forward queries by unit, serial, lot, logistics unit,
  order, asset, period, supplier, and customer/destination, respecting permission scope and commercial
  protection. The response reports coverage: confirmed relationships, missing/late data,
  estimates, capture gaps, and queried period/source; it never calls itself complete without basis.
- Must record packaging, label, weighing, picking, checking, release, and dispatch;
  open identification/capture/sharing standards are preferred [S09] [S16].

**References:** [S09], [S11], [S01], [S15], [S16].
