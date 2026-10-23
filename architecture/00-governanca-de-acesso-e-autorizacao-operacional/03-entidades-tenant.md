# `tenant` module — entities, rules, and features

## Role in the requirement

`tenant` creates the logical account boundary, maintains its lifecycle, and proves that there is a responsible Owner. It does not grant operational access: that belongs to `access-governance`.

**Sources:** [product 00, “Scope” and “Binding assumptions”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md), [product 03, “Tenant and Owner onboarding”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md), and [product 08, scenarios 1, 2, and 14](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md).

## Entities and features

| Entity | Responsibility in the requirement | Features that create or change it |
|---|---|---|
| `Tenant` | Isolated account and state that permits or blocks its use. | `request-onboarding`, `activate-tenant`, `suspend-tenant` |
| `OwnerAppointment` | Traceable appointment of who is responsible for account continuity. | `provision-owner-invitation`, `appoint-owner`, `transfer-owner` |
| `PolicyAcceptance` | Evidence of acceptance of the applicable policy by the invited Owner. | `request-onboarding`, `activate-tenant` |
| `TenantOnboardingRequest` | Idempotent request that joins initial data, invited Owner, and outcome. | `request-onboarding`, `activate-tenant` |

## `entity/` contracts

They are pure TypeScript contracts: aliases are in sibling `entity/` files; `application` adapts shared contracts to these primitives. There is no external import, ORM, Keycloak, or HTTP here.

```ts
export type TenantId = string;
export type TenantMemberId = string;
export type IdentityId = string;

export const TENANT_STATUS = {
  CREATING: "creating", PENDING_ACTIVATION: "pending_activation", ACTIVE: "active",
  SUSPENDED: "suspended", CLOSED: "closed",
} as const;
export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
export interface TenantBrandingInterface { displayName?: string; logoAssetId?: string; terminology?: Readonly<Record<string, string>>; }
export interface TenantSettingsInterface {
  countryCode: string; locale: string; timeZone: string; preferredUnitSystem: string;
  branding: TenantBrandingInterface;
  administrativeContactEmails: readonly string[];
}
export interface TenantEntityInterface {
  id: TenantId; status: TenantStatus; organizationName: string; externalOrganizationIdentifier?: string;
  settings: TenantSettingsInterface; activeAccessPolicyRevisionId: string;
  createdAt: Date; activatedAt?: Date; suspendedAt?: Date; closedAt?: Date; updatedAt: Date;
}

export const OWNER_APPOINTMENT_STATUS = {
  INVITED: "invited", ACTIVE: "active", TRANSFERRED: "transferred", REVOKED: "revoked",
} as const;
export type OwnerAppointmentStatus = (typeof OWNER_APPOINTMENT_STATUS)[keyof typeof OWNER_APPOINTMENT_STATUS];
export interface OwnerAppointmentEntityInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; identityId: IdentityId;
  status: OwnerAppointmentStatus; appointedByMemberId?: TenantMemberId; predecessorAppointmentId?: string;
  reason: string; invitedAt: Date; acceptedAt?: Date; endedAt?: Date;
}
export interface PolicyAcceptanceEntityInterface {
  id: string; tenantId: TenantId; identityId: IdentityId; policyVersion: string; acceptedAt: Date;
  evidenceReference?: string;
}

export const ONBOARDING_STATUS = {
  REQUESTED: "requested", PROVISIONING: "provisioning", PENDING_ACTIVATION: "pending_activation",
  ACTIVATED: "activated", REJECTED: "rejected", FAILED: "failed",
} as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];
export interface TenantOnboardingRequestEntityInterface {
  id: string; correlationId: string; status: OnboardingStatus; tenantId?: TenantId;
  organizationName: string; externalOrganizationIdentifier?: string; requestedSettings: TenantSettingsInterface;
  ownerEmail: string; ownerDisplayName: string; ownerLocale: string; policyAcceptanceVersion: string;
  requestedAt: Date; resolvedAt?: Date; refusalReason?: string;
}
```

## Implementable rules

- `request-onboarding` treats `correlationId` as unique: repetition returns the same request without creating a second tenant, Owner, or invitation ([product 03, “Minimum data”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- The initial transaction creates only a pending tenant, invited member/Owner, neutral policy, and outbox; resources, additional members, and integrations are denied until `activate-tenant` ([product 03, “Lifecycle”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- Activation requires an accepted invitation, verified identity, `PolicyAcceptance` with identity, version, and instant, and an active `OwnerAppointment`; `active` never exists without an active Owner ([product 03, “Required outcome”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- `appoint-owner`, `transfer-owner`, suspension, or revocation block the tenant and refuse to remove the last active Owner; transfer records predecessor, successor, reason, and instant ([product 03, “Ownership continuity”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- Initial settings are neutral and local to the new `tenantId`; no branding, policy, or data from another tenant may be copied ([product 03, “Required outcome”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
