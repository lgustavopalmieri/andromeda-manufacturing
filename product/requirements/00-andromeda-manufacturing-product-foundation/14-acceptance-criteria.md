# Foundation acceptance criteria

The examples are observable and must guide later refinement. "Authorized" always means
authenticated, in the correct tenant, and with the applicable contextual permission.

1. **Isolation:** given two tenants and a user from A, when they query, search, export, or invoke
   an integration, then they receive/affect only A's resources, including by direct identifier.
2. **Physical scope:** given an operator authorized only for Line 1, when they view the queue or HMI,
   then they neither view nor execute an order, signal, or action from Line 2.
3. **Executed version:** given an order started with recipe/routing/HMI V1, when V2 is published,
   then the order keeps V1 and a new execution uses V2 only after it becomes effective and is released.
4. **Auditable change:** given a changed quality limit or permission, when it is saved/published,
   then its author, instant, before/after, reason, approval, and scope are queryable.
5. **ERP flow:** given an accepted order, when it is executed and closed, then performance
   confirmation identifies source order, good quantity/loss, state, and a unique occurrence; a
   retransmission does not double the quantity.
6. **Correct material:** given a blocked or expired lot, when someone tries to consume it, then the
   action is refused or follows an authorized grant with reason, approver, and genealogy linkage.
7. **Genealogy:** given a shipped product/lot, when Quality starts an investigation, then it queries
   linked inputs, transformations, resources, parameters/results, and destinations.
8. **Downtime:** given a stopped asset state, when the duration reaches the justification policy,
   then the responsible party records category/reason; a later change preserves fact and history.
9. **HMI:** given a qualified operator and a prepared order, when they open the station, then they
   see only permitted context, instructions, signals, alarms, and actions; each action explicitly
   returns success, rejection, timeout, or failure.
10. **Connectivity:** given a late/duplicate equipment event, when it is processed, then the record
    indicates quality/ordering and the KPI is not counted twice.
11. **Quality:** given an out-of-limit result, when recorded, then the policy contains the affected
    scope and prevents release until a traceable decision by an authorized person.
12. **KPI:** given a displayed OEE, when a manager opens the detail, then they see formula/version,
    period, planned time, availability, performance, quality, and its constituent events/orders.
13. **White-label/global:** given a site in another country, when it accesses the product, then its
    language, time zone, unit, and terminology follow its configuration without changing source data or another site.
14. **Future agent:** given an agent without explicit delegation, when it requests an operational
    action, then it is refused. Given active delegation, execution records agent identity, policy,
    preconditions, result, and any human confirmation.
15. **Security:** given a user without change permission or an out-of-scope integration, when they
    attempt an action through a screen or alternative channel, then the platform denies it and
    records the attempt according to policy without revealing sensitive content.

16. **Night shift:** given a 22:00–06:00 template at the site and a "start date" policy, when the
    10 June occurrence is materialized and an event occurs at 02:00 on 11 June, then both remain in
    the same occurrence, the operational date is 10 June, and the shift report does not divide the
    result at midnight; the civil report, if used, is identified as the site's civil calendar.
17. **Policy change:** given the prior overnight occurrence allocated by start date, when the tenant
    changes policy to end date, then only new occurrences use the new version; the prior occurrence,
    its events, and KPI retain queryable historical allocation.
18. **DST:** given a 22:00–06:00 local shift crossing a one-hour advance in the site's IANA time
    zone, when the occurrence is created, then its planned duration remains that of the template and
    its actual duration is calculated from instants (one hour shorter); when clocks move back one
    hour, it is one hour longer. The report displays time zone/offset, occurrence, and duration used,
    without using an ambiguous abbreviation or assuming eight hours.
19. **Late event/correction:** given a machine event occurring at 23:58 and received at 00:10, when
    accepted, then it preserves both instants, origin, quality, and occurrence allocation by event
    instant. Given a manual correction, it references the raw event, has author/reason, and produces
    visible adjustment/reprocessing without deleting the original or duplicating the KPI.
20. **KPI by intersection:** given downtime from 21:55 to 22:10 across two occurrences, when it
    calculates availability by shift, then it allocates five minutes to the first and ten to the
    second through actual intersection, keeping KPI formula, calendar, policy, and version visible.
21. **Traceability granularity:** given one product configured by lot and another by serial number,
    when consumed/produced, then the first queries genealogy by lot without requiring a serial number
    and the second retains relationship by instance; both record quantity/UOM, order/operation, and resource.
22. **Transformation genealogy:** given two input lots are mixed, part of the product is reworked,
    and units are aggregated into a pallet, when Quality queries any input, product, or pallet, then
    it traces transformation, split/merge, rework, and aggregation/disaggregation backward/forward,
    with declared location/custody, process version, and coverage/gaps.
23. **Disposition:** given an item/lot is relabeled, returned, or scrapped, when the action occurs,
    then it retains the prior identity/relationship, destination/disposition, actual quantity, and
    reason; a future search does not treat the item as missing or as available for shipment without release.

**Bases:** [S01], [S04], [S06], [S07], [S09], [S13], [S14], [S15], [S16].
