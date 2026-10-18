# Entidades TypeScript — módulo `tenant`

`Tenant` é a fronteira de isolamento. As interfaces são o contrato de `entity/`; transições de
estado, continuidade de Owner e normalização ficam nos domínios das features.

```ts
import type { IdentityId, TenantId, TenantMemberId } from "@shared/access/authorization.types";

export const TENANT_STATUS = {
  CREATING: "creating",
  PENDING_ACTIVATION: "pending_activation",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CLOSED: "closed",
} as const;
export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export interface TenantBrandingInterface {
  displayName?: string;
  logoAssetId?: string;
  terminology?: Readonly<Record<string, string>>;
}

export interface TenantSettingsInterface {
  countryCode: string;
  locale: string;
  timeZone: string;
  preferredUnitSystem: string;
  branding: TenantBrandingInterface;
  administrativeContactEmails: readonly string[];
}

export interface TenantEntityInterface {
  id: TenantId;
  status: TenantStatus;
  organizationName: string;
  externalOrganizationIdentifier?: string;
  settings: TenantSettingsInterface;
  activeAccessPolicyRevisionId: string;
  createdAt: Date;
  activatedAt?: Date;
  suspendedAt?: Date;
  closedAt?: Date;
  updatedAt: Date;
}

export const OWNER_APPOINTMENT_STATUS = {
  INVITED: "invited", ACTIVE: "active", TRANSFERRED: "transferred", REVOKED: "revoked",
} as const;
export type OwnerAppointmentStatus =
  (typeof OWNER_APPOINTMENT_STATUS)[keyof typeof OWNER_APPOINTMENT_STATUS];

export interface OwnerAppointmentEntityInterface {
  id: string;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  identityId: IdentityId;
  status: OwnerAppointmentStatus;
  appointedByMemberId?: TenantMemberId;
  predecessorAppointmentId?: string;
  reason: string;
  invitedAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
}

export const ONBOARDING_STATUS = {
  REQUESTED: "requested", PROVISIONING: "provisioning", PENDING_ACTIVATION: "pending_activation",
  ACTIVATED: "activated", REJECTED: "rejected", FAILED: "failed",
} as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];

export interface TenantOnboardingRequestEntityInterface {
  id: string;
  correlationId: string;
  status: OnboardingStatus;
  tenantId?: TenantId;
  organizationName: string;
  externalOrganizationIdentifier?: string;
  requestedSettings: TenantSettingsInterface;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerLocale: string;
  policyAcceptanceVersion: string;
  requestedAt: Date;
  resolvedAt?: Date;
  refusalReason?: string;
}
```

`correlationId` é único no banco. Repetir a solicitação retorna o mesmo resultado, sem criar
novo tenant, Owner ou convite. A feature de ativação só promove o tenant depois de aceitar convite,
política e nomeação; nenhum recurso operacional é criado no estado pendente.
