# Architecture Context for an Epic

Architect creates or updates a technical context document such as
`architecture/00-context-name.md` when needed for the assigned design. Read the
pointed requirements, epic overview and selected feature file as read-only sources.
Do not create, edit or deliver a product epic, including its tracking information.
Keep this document at the architectural level; detailed tasks belong in the one
selected feature package's Tasks document in `architecture/specs/`. An architecture
request alone does not authorize a batch of specs or a spec without a source feature.
Use the current [authorization context](../../../../architecture/00-authorization-platform-context.md)
as the orientation/reading-map model, adapting its domain content to this assignment.

## Required content

1. **Sources and current state.** Link the actual epic, relevant features and source
   requirements. Describe code, platform capabilities, accepted ADRs and measured
   evidence that exist today. Distinguish proposals and skill examples from implemented facts.
2. **Business problem and drivers.** Explain the operational pain, critical outcomes,
   boundaries and incremental product goal. Identify security, consistency, latency
   and availability drivers; label unknown traffic or capacity assumptions.
3. **Bounded contexts and ownership.** Name modules, aggregates, entities and value
   objects, their responsibilities and important invariants. Explain tenant/resource
   ownership and cross-module collaboration without aggregating independent use cases.
4. **Interaction and consistency.** Show the relevant request/event flow, authority
   boundary, transaction boundaries and consistency expectations. Use a small diagram
   when it clarifies the flow. Consult the modular skill's auth, events, persistence
   or listing references when those concerns apply.
5. **Architecture options and tradeoffs.** Explain candidate patterns, alternatives,
   dependencies, operational cost and why the selected proposal fits this problem.
   Accepted decisions must link to their ADR; an unapproved spec remains a proposal.
6. **Technical risks and validation.** Identify hot paths, shared contention hot spots,
   traffic/cardinality, dependency failures, authorization freshness, data growth,
   observability and failure recovery as relevant. Link the selected spec's concrete
   risks and experiments rather than claim unmeasured scale or invent service targets.
   Connect database choices to queries, indexes/uniqueness, tenant filters, transaction
   isolation, contention, migration and recovery. Link complementary technical tests
   as well as product acceptance; Backend supplies their later execution evidence.
7. **Delivery map.** Link product feature → canonical package (Requirements → Design
   → Tasks) → approved ADR → Tasks execution evidence. Identify the package revision,
   approved scope and whole-feature completion separately. List unresolved
   prerequisites and the next bounded scope; this map does not authorize drafting
   later specs or starting their implementation.

Use a table for the delivery map with one row per known feature dependency. A spec
or ADR cell without an existing document must say `Not created`, rather than link to
a nonexistent file or pretend a decision has been accepted. Keep future work visible
without producing its specifications.

## Boundaries

The modular architecture skill governs code placement and dependency direction.
Document any proposed deviation, reason and impact in the selected spec for approval;
do not silently replace that architecture. Generic technology capability is not
evidence that a broker, outbox relay, transaction port or authorization adapter is
already implemented in this repository.

Keep minimum entity scope tied to actual use cases. Full code for a new/changed
entity belongs in the selected package's Design document, which becomes its approved
engineering reference. Link that contract instead of maintaining conflicting copies
across architecture documents.

When an accepted decision changes, update the architecture context to reference the
superseding ADR while preserving the earlier record and its rationale. The context
is a living map, not approval to rewrite product behavior.
