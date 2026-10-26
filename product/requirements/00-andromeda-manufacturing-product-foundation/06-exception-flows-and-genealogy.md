# Interruptions, Corrections and Operational Investigation

## Why exceptions belong in the product requirement

A factory rarely follows its planned sequence without interruption. Stoppages, quality findings,
material discrepancies and delayed observations are part of the operation, not missing detail to
be hidden by a successful completion record. Andromeda needs to preserve their context so people
can contain risk, restore work and understand the consequences afterward.

## Downtime, classification and resumption

A machine observation, alarm or operator report can reveal a loss of operating condition or rate.
The product relates the interruption to the asset, order or operation, shift and duration.
Classification may be suggested, but the responsible person supplies the category and justification
when the tenant's policy requires it, including any duration that triggers a required explanation.

The reason for a pause determines who needs to act. Quality, safety, maintenance and material
restrictions lead to their own containment and release responsibilities. Production resumes under
the applicable release condition; a downtime explanation alone cannot clear an unrelated hold.
Changes to classification retain the author, reason, governing version and earlier interpretation.
Indicators can therefore distinguish raw observations, classified losses and unresolved items.

## Quality findings and genealogy

An out-of-limit result, expired inspection or rejected sample identifies an affected unit, lot or
production interval. Containment follows the product and site policy, while a nonconformity connects
the finding to its evidence. Quality may decide on reinspection, rework, use under concession,
scrap or release, with an owner, explanation and separate approval where required.

Genealogy supports the investigation in both directions. Looking backward explains materials,
components and process conditions; looking forward identifies affected production, packaging,
inventory, orders and destinations. Transformation, custody and distribution remain part of the
same investigation. The selected granularity and missing information must be visible rather than
implied to be more precise or complete than the records support. [S09] [S15]

## Material discrepancies

Material availability includes quantity, location, quality status, expiry and approved substitution,
not only a visible balance. Reading a lot or serial identity relates the material to the reservation,
product and production stage. Substitution, additional consumption, return and scrap preserve their
quantity, original unit, reason and genealogy relationship.

A blocked or expired lot remains restricted unless the applicable policy permits a formal
concession. That decision identifies the authorized reason, approver and affected genealogy.
An operator interface shortcut cannot turn restricted material into ordinary available stock.

## Delayed information and loss of connectivity

People need to distinguish information that is received on time, delayed, duplicated, missing,
estimated or corrected. The interface makes stale information recognizable, especially where a
current-state decision could affect safety, quality or material use. A historical observation is
not proof that a resource is still in that condition.

An equipment event may occur at 23:58 and arrive at 00:10. Its occurrence and receipt remain two
separate facts. Reconnection preserves source, occurrence instant, receipt, quality and available
sequence information. A repeated observation is identified without doubling production or an
indicator. Event-time ordering can expose a conflict, but must not conceal it.

The historical shift occurrence and policy effective at the time of the event govern its allocation.
A later calendar change does not move that observation into a different historical shift. This
separation of fact time and record time is consistent with the visibility concepts referenced in
EPCIS, the Electronic Product Code Information Services standard. [S15]

## Human correction and transparent interpretation

A correction is a traceable adjustment to an earlier observation, not an edit or deletion of the
raw evidence. It relates the new interpretation to the original, identifies author, time, reason
and any required approval, and explains its effect on quantities or indicators. Reports preserve
original information, adjustments, recalculation time and the completeness of the underlying data.

This allows an organization to correct a mistake while still explaining the information available
when an earlier decision was made. A critical action depends on confirmation of the current state,
not merely a corrected historical reading.

## Unsafe conditions and incidents

An authorized person can record or escalate an unsafe condition with its location, activity,
potentially exposed people, immediate containment and investigation. The product connects that
information to operational responsibility and local policy. It supports hazard identification,
participation and improvement without replacing emergency response or site authority. [S12]

**Conceptual references:** [S04], [S09], [S11], [S12], [S15].
