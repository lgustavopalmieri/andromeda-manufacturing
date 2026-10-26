# Operational glossary

| Term | Meaning in this requirement |
|---|---|
| Agent | software identity that can query, propose, or execute an action only through explicit delegation |
| Area / line / cell | logical physical levels used to organize resources; may be omitted when they do not exist |
| Asset | physical resource maintained to deliver value: machine, utility, instrument, or relevant component |
| Batch/lot | produced quantity or identifiable material under common conditions; they are not mandatory synonyms |
| BOM / formula | versioned relationship of components/ingredients and quantities to manufacture a product |
| Control | deterministic field/PLC/DCS operation; outside the implicit authority of MES/HMI |
| Dispatch | decision to send a task/order to a resource, team, and execution sequence |
| Genealogy | source, transformation, aggregation, and destination relationships among materials, production, and logistics |
| HMI | human-machine interface that provides context for state and operational actions; it is a versioned contract |
| KPI | quantifiable measure with explicit formula, scope, source, period, and version |
| MES | capabilities to execute, record, and follow production between planning and control |
| MOM | management of production, quality, inventory, and maintenance operations at the operational level |
| Nonconformance | requirement deviation, recorded with containment, decision, and subsequent action |
| Production order | executable commitment to manufacture a quantity/product under defined process and resources |
| OEE | measure composed of availability, performance, and quality; comparable only with the same definition |
| Shift occurrence | concrete, identified, and dated instance of a template; it has planned and actual start/end/duration |
| Operational date | date assigned by versioned policy to the shift/occurrence; may differ from the civil date of a nighttime event |
| OT | operational technology that monitors or interacts with the physical process, including control systems |
| Recipe/routing | versioned definition of how to produce: procedure/parameters or sequence of operations and resources |
| SCADA | supervision, data acquisition, and process/asset visualization, distinct from field control |
| Serial/unit | identifier of an individual instance; allows genealogy at the level of each unit when policy requires it |
| Shift template | recurring and versioned definition of local schedules and expectations; it is not the record of a completed shift |
| Tenant | logically isolated organizational account containing its data, policies, brand, and configurations |
| Traceability | ability to reconstruct the history, application, or location of an object throughout its lifecycle |
| Logistics unit | identifiable packaging/load — for example, a box or pallet — which can contain items/lots and have its own custody/location |
| Version / validity | identification of a definition and the interval/condition in which it can govern a new execution |

## Reading conventions

“Must” indicates a product requirement. “May” indicates a permitted variation or evolution. “Source of
truth” means the system responsible for a defined attribute/fact; it does not imply that other
systems do not store it as a reference. Terms from [S01]–[S04] guide the language, but detailed
modeling will be validated by sector and pilot plant.

**Terminology references:** [S09], [S13], [S14], [S16].
