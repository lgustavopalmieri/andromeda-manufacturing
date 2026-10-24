# Andromeda Manufacturing

A multi-tenant, white-label industrial SaaS platform that integrates Manufacturing Execution Systems (MES), Manufacturing Operations Management (MOM), and asset supervision (SCADA/HMI).

## Product vision

Andromeda connects enterprise planning to the shop floor, making operations executable, visible, and traceable. It brings people, orders, materials, equipment, quality, and operational events into one model, serving operators, managers, auditors, and integrations.

For every produced unit or lot, the platform must answer: what was done, where, by whom, on which equipment, with which materials and versions, under which conditions, with which quality result, and which exceptions occurred.

## Problems it solves

- Missing context and reliable feedback between ERP and production.
- Disconnected data across machines, operators, quality, materials, and maintenance.
- Losses, downtime, and deviations identified late or without standardized justification.
- Limited genealogy for investigations, recalls, and customer support.
- Similar operations using inconsistent definitions for KPIs, processes, and operational screens.

## Core capabilities

- Modeling of plants, assets, products, materials, and processes.
- Production orders, execution, reporting, losses, and exceptions.
- Industrial connectivity, telemetry, states, alarms, and configurable HMI interfaces.
- Quality, lots, material consumption, and genealogy.
- Operational metrics such as OEE, throughput, availability, and quality rate.
- Versioned forms, rules, workflows, and interfaces for each operational context.
- ERP integration for orders, master data, and production confirmations.

## Non-negotiable principles

- Strict tenant data isolation.
- Granular permissions for both operations and configuration.
- Auditing and change history for trustworthy decisions and evidence.
- Versioning for every configurable element: forms, rules, recipes, and HMI.
- Per-tenant white-label branding, theming, and behavior.
- Clear operational contracts for people and future AI agents.

## Scope and evolution

The product starts with a configurable, auditable operational core. The first version focuses on closing the **ERP order → execution → quality and materials → ERP confirmation** cycle with traceability and explainable KPIs.

Andromeda does not initially replace ERP systems or deterministic PLC control. Advanced optimization, physical process control, and autonomous AI decisions are outside the initial scope, while the platform remains designed to evolve toward them under governance.

## Repository structure

- `apps/andromeda-backend`: platform API and services.
- `architecture/`: architecture decisions, domain models, and implementation specifications.
- `product/`: product vision, requirements, and acceptance criteria.

## Product documentation

The detailed vision, capability map, and version scope are in [`product/00-andromeda-manufacturing-product-foundation`](product/00-andromeda-manufacturing-product-foundation/).
