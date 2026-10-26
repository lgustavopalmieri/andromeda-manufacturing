# Andromeda Manufacturing — A Unified Industrial Operations Platform

## The product and the problem it addresses

Andromeda Manufacturing is a multi-tenant, white-label platform that connects enterprise planning,
factory execution and asset supervision. Its foundation combines manufacturing execution systems
(MES), manufacturing operations management (MOM), and supervisory control and data acquisition
(SCADA), including the human-machine interface (HMI). These are complementary capabilities of one
product: MES guides and records production execution, MOM connects production with quality,
materials and maintenance, and SCADA/HMI gives people operational context and a controlled way to interact.

Factories often manage these activities through disconnected systems and spreadsheets. An order
may arrive from enterprise resource planning (ERP) without the instructions, material status or
resource context needed to execute it. Machine signals may describe a stoppage while the operator's
explanation, the quality decision and the maintenance record remain elsewhere. The result is slow
investigation, repeated reporting and uncertainty about what actually happened.

The product brings those facts into a shared operational language, with consistent evidence,
permissions and governance. It does not replace enterprise finance or deterministic machine
control. Its purpose is to make the flow between planning, people and the physical process
reliable and understandable. [S01] [S03]

## Business value

For a produced unit or lot, an organization needs to understand what was done, where, by whom,
on which equipment, using which materials and versions, under which conditions, and with which
quality results and exceptions. Operators need that information in time to act; supervisors,
quality teams and managers need it to investigate losses and make defensible decisions.

A connected record reduces reconciliation effort, helps contain affected production and supports
customer investigations and recalls. Shared definitions of products, indicators and operational
screens also make practices easier to reuse across plants. These benefits depend on trustworthy
capture and adoption in the factory; no numerical improvement target is assumed by this requirement.

## How to read this set

| Reading path | Subject and purpose |
| --- | --- |
| [01](01-principles-scope-and-boundaries.md)–[02](02-personas-and-responsibilities.md) | Product principles, responsibility boundaries, people and authority |
| [03](03-capability-map.md)–[04](04-operating-model-and-master-data.md) | Connected capabilities and the shared operational vocabulary |
| [05](05-integrated-flow-plan-to-close.md)–[06](06-exception-flows-and-genealogy.md) | The order journey, interruptions, corrections and investigation |
| [07](07-production-and-orchestration-requirements.md)–[12](12-security-access-auditing-and-change-control.md) | Capabilities and essential rules across the operating domains |
| [13](13-product-priorities-and-dependencies.md)–[14](14-business-outcomes-and-operating-confidence.md) | Product priorities, dependencies and the business outcomes they support |
| [15](15-sources-and-method.md)–[16](16-glossary.md) | Reference sources, interpretation limits and terminology |

This is the parent product requirement. More specific requirements may explain local processes,
sectors and regulatory needs without weakening its isolation, authority and historical integrity
principles. It describes desired product capabilities, not current availability or a delivery
commitment.

## Product direction

The foundation is a configurable operational core that people can use and trust on the shop floor.
Depth can grow by domain, sector and risk while preserving the same operational model. Granular
permissions prevent a job title from becoming unrestricted authority; versioned definitions make
changes explainable; and tenant-specific branding and behavior support different organizations
without exposing one customer's identity or information to another.

The operator interface is also a versioned action contract for future artificial intelligence
(AI) agents. Sharing that contract makes assisted operation possible, but does not grant an agent
permission to act. Delegation, scope and accountability remain explicit product responsibilities.

**Conceptual references:** [S01], [S03], [S04], [S05]. The source register and its limits are in
[Sources and method](15-sources-and-method.md).
