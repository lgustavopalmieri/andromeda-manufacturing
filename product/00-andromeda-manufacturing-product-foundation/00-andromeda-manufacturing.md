# Andromeda Manufacturing — unified MES + MOM + SCADA platform

## Decision guided by this requirement

Andromeda Manufacturing **is the unified product/platform**. MES, MOM, and SCADA/HMI are not three
separate products or an ancillary scope: they are complementary, integrated capabilities that,
together, compose the platform. MES executes and records production; MOM manages production,
quality, inventory, and maintenance operations more broadly; SCADA/HMI supervises assets and
provides operational context and interaction. All use the same operational model, evidence and
data, permissions, and governance.

The multi-enterprise platform connects enterprise planning, shop-floor execution, and asset
supervision. It does not initially replace the ERP or deterministic PLC control; it makes the
flow between them and the decisions of the people working in it reliable. [S01] [S03]

## Expected business outcome

An organization must be able to know, for each produced unit or lot: **what** was done, **where**,
**by whom**, **on which equipment**, **with which materials and versions**, **under which
conditions**, **which quality result**, and **which exceptions occurred**. Information must be
usable in a timely manner by the operator and reliable for management, auditing, and integration.

## How to read this set

| Artifacts | Answer |
|---|---|
| 01–02 | immutable principles, scope, boundaries, and people |
| 03–04 | capability map and shared language/master data |
| 05–06 | end-to-end journeys and exception handling |
| 07–12 | requirements by domain, priorities, and evolution |
| 13–16 | priorities, verifiable criteria, sources, and vocabulary |

This is the parent requirement. Subsequent domains may deepen local rules, sectors, and
regulation, provided they do not weaken the decisions recorded here.

## Problems the platform solves

- Orders arrive from the ERP without executable context, state visibility, or reliable feedback.
- Machine, operator, quality, material, and maintenance data remain disconnected.
- The factory discovers losses late, cannot justify downtime in a standardized way, or trace
  genealogy for investigation, recall, and customer support.
- Similar plants and lines use divergent definitions of product, KPI, and operational screen.
- Generic access control allows people to execute, change, or view what is not their concern;
  critical configurations lack sufficient history.

## Product direction

Start with a configurable, auditable operational core that can be adopted by the shop floor.
Do not promise an entire enterprise suite at once. Depth must come by module, sector, and risk,
preserving the same operational model and the same isolation guarantees.

**Guiding sources:** [S01], [S03], [S04], [S05]. Cataloging and methodology are in
[15-sources-and-method.md](15-sources-and-method.md).
