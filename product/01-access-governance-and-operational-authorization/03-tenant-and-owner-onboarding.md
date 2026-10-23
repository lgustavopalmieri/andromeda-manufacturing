# Tenant and Owner onboarding

## Mandatory result of account creation

Creating a corporate account produces a new logically isolated tenant and, at minimum, one human
Owner identity accountable for it. There is no active operational tenant without an active Owner,
nor an Owner without an explicit relationship with their tenant. Brand, terminology, language,
units, time zone, and policies start empty or with neutral values; they are never copied from another tenant.

## Minimum data to request a tenant

| Information | Business purpose | Quality rule |
|---|---|---|
| Organization name and external identifier, if any | identify account and contract | name may repeat; official identifier follows local policy |
| Primary country/region, language, time zone, and preferred unit | initial presentation and operation | may be supplemented by site later |
| Initial Owner name, corporate email, and language | accountability and invitation | verifiable email; not shared |
| Initial brand and administrative contacts | white-label and communication | changeable only in the created tenant |
| Acceptance of applicable policy | governance and evidence | version, instant, and identity recorded |

The requester receives an unambiguous result: tenant created and pending, activated, or declined
with a reason. A correlated repetition does not accidentally create two tenants/Owners; resolution
preserves the origin correlation.

## Account and Owner lifecycle

| State | Tenant | Initial Owner | Permitted effect |
|---|---|---|---|
| Being created | data being validated | invitation not yet accepted | no operational resource or other member |
| Pending activation | identity created/invited | awaiting verification and acceptance | activation only by the invited Owner |
| Active | usable account | active Owner | governance and new assignments according to policy |
| Suspended | ordinary access interrupted | may be active or suspended | preserves evidence; does not allow operation/integration |
| Closed | account deactivated according to retention | final relationship recorded | no informal reactivation or data reuse |

Rejection, invitation expiration, and suspension preserve history but revoke the ability to act.
Reactivation is a recorded act subject to the tenant's contractual and security policy.

## Owner powers and limits

The Owner has the **account governance** base role: maintain organizational data and branding,
appoint/remove administrators, define access review, administer permitted policy, and initiate
ownership transfer. They may assign roles available in the tenant's own catalog, with scope,
validity, and justification.

The Owner does not by default receive permission to operate HMI, report production, release a lot,
approve a recipe, perform maintenance, read detailed telemetry, or command an asset. These require
their own operational assignment. Even when they hold one, they do not approve a critical act they
created, edited, requested, or performed when segregation is mandatory.

## Ownership continuity

- There must be at least one active Owner; removing, suspending, or transferring the last one is refused.
- Adding a new Owner requires the invitee's explicit acceptance and a record of the granting Owner.
- Transfer requires confirmation by the new Owner; it records predecessor, successor, instant, and reason.
- Recovery of an absent Owner is exceptional, with proof of organizational authority and review.
- The Owner delegates administration but does not create a shared identity or transfer governance
  responsibility without a formal transfer.

**Example:** the director of Metal Norte creates the tenant and appoints Ana as Administrator and
Carlos as Manager of the Campinas Plant. Ana does not open the press HMI; Carlos does not administer
the global account without an assignment of his own.
