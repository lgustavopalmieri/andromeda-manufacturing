# Prioritization: foundation, v1, and evolution

Priority means complete operational capability, not an isolated screen. A v1 item includes
permissions, auditing, state, exceptions, version when configurable, and acceptance criterion.

| Horizon | Included deliveries | Deliberate cuts / condition to advance |
|---|---|---|
| Foundation | tenant/branding, identity/scope, site–asset hierarchy, minimum master data, auditing, versions, reason/unit/shift catalog, shift template and occurrence, operational date/time zone, HMI contract | no physical command or corporate calculation; model validated in pilot plants |
| Operational MVP | assets/devices, connectivity onboarding, telemetry/state, form/setup, basic configurable HMI, manual/imported order, production/loss/downtime reporting | one process family and selected connectors; traceable exceptions |
| **v1** | ERP order/actuals integration, basic planning/dispatch, materials/lots/consumption, versioned recipe/BOM/routing, basic inspection and NC, genealogy by configured granularity, KPI by shift occurrence, dashboard, setup template, governed multi-site | no optimization APS, complete LIMS/WMS/CMMS, advanced SPC, or autonomous AI |
| v1.x | integrated corrective/preventive maintenance, shipping/packaging, competency, self-service reports, global-local definition library | demonstrate adoption, data integrity, and reduced reporting outside the system |
| v2 | complete HMI, advanced alarms/trends, expanded quality, deeper inventory/logistics, EHS, sophisticated approval workflow, additional industrial connectors | validate operation in multiple sectors and manual/automatic modes |
| v3 | finite planning/optimization, predictive maintenance, advanced SPC/analytics, assistive AI agent with action contract and governance | only after reliable data baseline and validated authority controls |

## Criteria for the v1 cut

1. It must close the "ERP order → execute → quality/material → ERP confirmation" cycle in a
   pilot plant, even when part of collection is manual.
2. It must prove queryable lot genealogy in a simulated recall scenario.
3. It must calculate each basic KPI with a published definition and drill down to event sources.
4. It must operate different lines in the same tenant with appropriate permission scope and
   branding/location, without data leakage.
5. It must reject configuration or operational action without applicable version, permission, and trail.
6. It must allocate a night shift and late event explainably, including at a site with DST.
7. It must answer genealogy investigation with declared coverage, without assuming serialization
   where product policy requires only a lot.

## Out of v1 scope, but prepared by contract

Accounting/financial costs, complete purchasing and sales, PLC/SIS control, digital twin,
mathematical optimization of the entire chain, automatic sector regulatory certification, and
autonomous AI decision. Integrations and references for these domains must be addable without
changing v1 historical evidence.

**References:** [S01], [S03], [S04], [S07].
