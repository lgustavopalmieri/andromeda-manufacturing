# Principles, scope, and boundaries

## Non-negotiable principles

1. **Tenant isolation:** no organization's data, configuration, signal, identity, file, search, or
   integration may be exposed to another.
2. **Contextual permission:** viewing, approving, operating, releasing, editing, and administering
   are distinct permissions, filterable by organization, site, area, line, asset, and shift.
3. **Version and effective period:** product, recipe/formula, routing, procedure, rule, form, HMI,
   KPI, and integration definitions have an identifier, owner, state, effective period, and usage
   traceability. An execution preserves the version that governed it.
4. **People and process safety first:** the platform supports decision-making and supervision; it
   may not bypass local safeguards, interlocks, permissives, or stop authority.
5. **Data with context:** every relevant observation carries time, origin, quality, asset/location,
   order/lot when known, and correlation with the action that generated it.
6. **Operator at the center:** the interface reduces ambiguity, shows relevant state and exception,
   operates by role, and records authorship; HMI principles follow [S06].
7. **Human–agent operational contract:** a versioned HMI/action definition specifies inputs,
   preconditions, effects, confirmations, alarms, and evidence. Humans and future agents consume
   it, but agents never receive implicit authority.
8. **White-label configuration:** language, unit, time zone, brand, terminology, and permitted
   behavior are per tenant/site; one customer's brand or convention is not a global standard.

## Platform functional scope

Covers MOM (production, quality, inventory, and maintenance), execution MES, integration with ERP
and other systems, SCADA/HMI connectivity and supervision, and operational data/KPIs. Capabilities
are in map 03 and are independent of the factory's degree of automation [S01] [S03].

## Responsibility boundaries

| System/domain | System of record or primary authority | Andromeda's role |
|---|---|---|
| ERP | finance, purchasing, sales, enterprise planning | receive/return commitments and actuals |
| PLC/DCS/SIS | real-time control, functional safety | observe/supervise; command only when authorized |
| Legacy WMS/LIMS/CMMS | when adopted as the specific master system | integrate and compose context, without duplicating decisions |
| Andromeda | MOM execution, operational evidence, and configurable definitions | orchestrate, trace, alert, and analyze |

## Assumptions and open decisions

- An organization may operate multiple countries, sites, calendars, languages, units, and rules.
- Chain of custody and regulatory requirements vary by sector; the core supports evidence, but
  certifiable sector compliance is an explicit later scope.
- Manual, semi-automated, and automated operation coexist on the same line.
- Functional safety, recipes directly on the controller, and deterministic sequencing are not
  replaced by this platform. Any remote command requires local risk assessment.
- Finite planning/advanced optimization, accounting, and external transportation are not in the
  v1 core, although their events and data may be integrated.

**References:** [S01], [S06], [S07], [S08].
