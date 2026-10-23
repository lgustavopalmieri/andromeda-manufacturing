# Lifecycle scenarios and verifiable criteria

The criteria below complement [08](08-scenarios-and-acceptance-criteria.md). “Active” means a
valid assignment, not merely an identity that accepted an invitation. Roles and actions remain
subject to the catalog in [04](04-permission-and-role-catalog.md) and the conditions in
[05](05-assignments-scopes-and-assets.md).

## Everyday cases

| Real situation | Business decision and example |
|---|---|
| Operator hiring | HR reports that Ana starts in Production on 3 May; the production manager sponsors Operator for Filling 3/shift B; training confirms E-03 certification; the local admin grants, invites, and schedules the start. The leader assigns her to E-03 only after that. |
| New area manager | The site manager sponsors the Area Manager role for the new Cutting-area leader. The site administrator grants it within the Cutting scope; she may sponsor the team and fulfill approvals her assignment permits, but does not gain access to Filling or HMI by default. |
| Line/site/job transfer | The current or destination manager records the change, and the new manager sponsors the destination profile. The provisioner ends/reviews the old scope and grants the new one only after applicable competency. There is no automatic “migration” of all powers. |
| Vacation | A leader requests coverage by Beatriz on Line 2, night shift, for ten days. The admin grants a temporary assignment and, during its validity, the leader assigns her to eligible assets. At the end, the assignment and designation cease to have effect. |
| Termination or leave | HR/HRIS reports the effective date/time; assignments are suspended or revoked according to policy, including delegations and future sessions. Earlier facts preserve author and evidence. |
| Contract maintenance worker | The contract owner records company, term, and sponsor; maintenance sponsors the assets; competency/EHS confirms requirements; the local admin grants maintenance only on contracted assets. Contract end ends access. |

## Given/When/Then criteria

1. **Identity is not access.** Given HR has recorded Paulo as a future employee, when the
   invitation is accepted before hiring, then Paulo may complete identity verification but does not
   view data or act until start date, granted assignment, and competency conditions are met.
2. **Newly hired operator.** Given a sponsored request for Ana to operate E-03 on shift B and a
   current certification, when the Filling Line access administrator grants the approved role/scope,
   then Ana acts only on E-03/B; the leader may schedule her but does not give her E-04.
3. **Leadership without elevation.** Given Lívia is the Line 1 leader without an access assignment,
   when she tries to invite, grant Operator, or create an assignment, then it is denied. When she
   assigns an operator already authorized for Line 1 to their shift, then the designation is recorded and valid.
4. **Delegated provisioning leader.** Given Lívia has a current delegation to provision Operator
   only on Line 1, when a sponsored request, valid relationship, and confirmed competency exist,
   then she may grant the approved package within the permitted term. When she tries to grant it to
   herself, a Line 2 person, or an approving Quality role, then it is denied and the attempt is audited.
5. **Area manager.** Given a newly hired manager with Cutting Area scope, when they query their
   area and sponsor a subordinate's access to a Cutting line, then they may do so according to
   policy. When they try to grant directly or query the Filling Line without an assignment, then it is denied.
6. **Role change.** Given an operator transferred from Filling/South Site to Cutting/North Site,
   when the new manager sponsors the change, then old access is reviewed/ended and new access
   activates only after Cutting authorization and competency. During transition, the two scopes do not implicitly combine.
7. **Temporary coverage.** Given a technician covering vacation from 10 to 20 June, when the
   administrator grants a temporary package and scope, then the leader assigns her only in that
   interval. On 21 June, a setup attempt is denied unless there is a new valid assignment.
8. **Effective termination.** Given an effective termination reported by the relationship source,
   when the person attempts a new action after the defined instant, then it is denied even with an
   open session; their delegations also end and history is not erased.
9. **HR without implicit authority.** Given an HR analyst who recorded a hiring, when they try to
   grant Operator without a provisioner assignment, then it is denied. Given that analyst has a
   formal HR Operations delegation for South Site, then they fulfill only approved requests in the South.
10. **Limited contractor.** Given a contractor whose contract ends on 31 August, when that date
    arrives without validated renewal, then their roles, designations, and delegations expire; the
    sponsor cannot extend them merely by changing the schedule.
11. **Periodic review.** Given an unused Operator assignment or one nearing review, when the
    manager receives the review, then they confirm, reduce, or request revocation with a reason. If
    confirmation does not occur within the policy period, the configured consequence applies and remains auditable.

Every grant, role change, designation, suspension, revocation, and exception decision must retain
relationship source, sponsor, approver when required, provisioner, scope, validity, and reason.
The separation preserves the no-self-elevation principle in [06](06-state-rules-and-segregation.md)
and review/auditing in [07](07-identities-delegation-exceptions-and-auditing.md).
