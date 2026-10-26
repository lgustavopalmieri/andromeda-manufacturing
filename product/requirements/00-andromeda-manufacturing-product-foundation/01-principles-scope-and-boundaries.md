# Product Principles, Scope and Responsibility Boundaries

## Why these boundaries matter

Andromeda connects decisions made by different people and systems. Without clear ownership, a
production target can override a quality restriction, an operational screen can appear to promise
machine safety, or two systems can disagree about the same fact. These principles define the
trust the product must preserve as its capabilities grow.

## Principles that apply throughout the product

Each tenant is an isolated organizational space. Its data, identities, signals, files, searches,
notifications, integrations and configuration belong to that organization and are visible only
within authorized scope. White-label behavior is part of this boundary: brand, language, units,
time zone, terminology and permitted local behavior are governed by tenant or site configuration,
not imposed as another customer's convention.

Authority is contextual. Viewing, operating, approving, releasing, editing and administering are
different activities. Permission may depend on the organization, site, area, line, asset, shift,
object state and requested action. A person who administers access does not thereby acquire the
right to release a quality lot or change a live process definition.

Configurable definitions are versioned and have an owner, state and effective period. This applies
to products, recipes and formulas, routings, procedures, rules, forms, HMI definitions, indicators
and integration definitions. An execution keeps the version that governed it, so a later change
cannot silently reinterpret earlier production.

Operational information needs context. Relevant observations retain time, origin, quality,
asset or location, order and lot when known, and their relationship to the action or event that
created them. People must be able to distinguish a raw observation from an interpretation of it.

People and process safety take priority. The platform supports supervision and decisions without
bypassing local safeguards, interlocks, permissives or stop authority. The HMI reduces ambiguity,
shows relevant states and exceptions, adapts to the person's role and records authorship. [S06]

The same versioned HMI/action definition serves people and future AI agents. It explains the
required inputs, prerequisites, effects, confirmations, alarms and evidence of an action. An agent
requires its own identity and explicit authority; access to the definition is not permission to
execute it.

## Functional scope and ownership

The product covers manufacturing operations in production, quality, inventory and maintenance;
production execution; enterprise integration; asset supervision and HMI; and operational data and
key performance indicators (KPIs). Manual, semi-automated and automated operations can coexist.
The capability map explains how these areas relate. [S01] [S03]

| Responsible system or domain | Primary authority | Andromeda's relationship |
| --- | --- | --- |
| Enterprise resource planning (ERP) | Finance, purchasing, sales and enterprise planning | Exchange commitments, actual results and exceptions |
| Programmable logic controllers (PLC), distributed control systems (DCS) and safety instrumented systems (SIS) | Deterministic control and functional safety | Observe and supervise; request a command only under authorized local conditions |
| Existing warehouse, laboratory or maintenance systems | The information and decisions for which they remain the designated master | Combine operational context without creating competing owners |
| Andromeda | Manufacturing operations, execution evidence and configurable operational definitions | Coordinate, trace, alert and analyze within assigned authority |

## Assumptions and product limits

An organization may span countries, plants, calendars, languages, units and local rules. The core
needs to support that variation while making the governing policy visible. Chain of custody and
regulatory obligations vary by sector; supporting evidence does not automatically provide a
certified sector solution.

Functional safety, controller-resident recipes and deterministic sequencing remain outside the
platform's replacement role. Remote commands require an appropriate local risk assessment.
Enterprise accounting, external transportation and advanced finite planning or whole-chain
optimization are outside this foundation's direct operational responsibility, although the
product may exchange their information. These boundaries avoid conflicting decisions and keep
the product focused on reliable manufacturing operations.

**Conceptual references:** [S01], [S06], [S07], [S08].
