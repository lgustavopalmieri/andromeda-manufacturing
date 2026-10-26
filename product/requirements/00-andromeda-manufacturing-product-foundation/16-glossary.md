# Shared Operational Vocabulary

## Why these definitions matter

Different plants and systems may use the same word for different operational facts. This glossary
states the meaning used in this requirement so readers can discuss the capabilities without
assuming a particular software design or local organizational chart. Tenant terminology can vary,
but the relationships behind the terms need to remain understandable.

| Term | Meaning in this requirement |
| --- | --- |
| Agent | A software identity that can query, propose or execute an action only within explicit authority and delegation |
| Area, line and cell | Optional physical or organizational levels used to describe where work and resources belong |
| Asset | A physical resource that delivers operational value, such as a machine, utility, instrument or component |
| Batch or lot | An identifiable quantity produced or received under common conditions; the two terms need not be synonyms in every process |
| Bill of materials (BOM) or formula | The versioned components or ingredients and quantities needed for a product |
| Calendar | The site's operating-time context, including local schedules, working periods and relevant policy |
| Control | Deterministic physical-process operation by a programmable logic controller (PLC), distributed control system (DCS) or safety instrumented system (SIS), outside the implicit authority of a supervisory screen |
| Dispatch | Assigning a task or order to a resource, team and execution sequence |
| Disposition | The authorized decision about how material or production may be used, reworked, returned, released or discarded |
| Environment, health and safety (EHS) | Operational responsibilities concerning hazards, people, safe work and environmental conditions |
| Genealogy | The relationships connecting material origin, transformations, production, aggregation and destination |
| Human-machine interface (HMI) | The operator's view of context and actions, governed by a versioned definition of meaning and authority |
| Key performance indicator (KPI) | A measure with an explicit purpose, formula, scope, sources, period and governing version |
| Logistics unit | An identifiable package or load, such as a box, pallet or container, which may contain units or lots and have its own custody and location |
| Manufacturing execution (MES) | Capabilities that guide, execute, record and follow production between enterprise planning and physical control |
| Manufacturing operations management (MOM) | Coordination of production, quality, inventory and maintenance at the operational level |
| Nonconformity | A deviation from an applicable product or process requirement, with related containment, decision and follow-up |
| Operational date | The date assigned to a shift occurrence by a versioned policy; it can differ from the civil date of an observation during a night shift |
| Operational technology (OT) | Technology that observes or interacts with a physical process, including industrial control systems |
| Overall equipment effectiveness (OEE) | An indicator combining availability, performance and quality, interpretable only with its underlying definitions and planned time |
| Production order | A commitment to produce a defined quantity and product under a governing process and resource context |
| Recipe or routing | A versioned description of how to produce, through procedures and parameters or a sequence of operations and resources |
| Shift occurrence | A particular identified shift at a site and date, with planned and actual times and a relationship to its template and policies |
| Shift template | A recurring, versioned description of local schedules and expectations, rather than evidence that a shift was worked |
| Supervisory control and data acquisition (SCADA) | Observation, context and visualization of processes or assets, distinct from deterministic field control |
| Tenant | An isolated organizational space for its information, policies, identities, branding and configuration |
| Traceability | The ability to reconstruct an object's history, use or location across its relevant lifecycle |
| Unit and serial | A unit is an individual instance; a serial identifies an instance when the product's policy requires that granularity |
| Version and effective period | The identity of a definition and the interval or conditions in which it may govern new work |

## Reading the product language

A product requirement expresses a needed capability or essential rule; it does not state that the
capability has already been delivered. “Must” identifies a required product behavior, while “may”
identifies a permitted variation or future possibility. Neither word assigns work to a schedule.

The system of record or source of truth is the designated authority for a particular fact or
attribute. Other systems may retain references to that fact without becoming competing owners.
Local definitions and sector obligations need to be made explicit rather than assumed from a
shared term.

The vocabulary is informed by [S01]–[S04] and the identification and time references [S09], [S13],
[S14] and [S16]. The complete catalog is in [Sources and method](15-sources-and-method.md).
