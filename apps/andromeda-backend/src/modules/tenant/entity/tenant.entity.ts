export type TenantId = string;

export const TENANT_STATUS = {
  PENDING_ACTIVATION: "pending_activation",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  CLOSED: "closed",
} as const;

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export interface TenantBrandingInterface {
  displayName?: string;
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
  updatedAt: Date;
}

export const OWNER_APPOINTMENT_STATUS = {
  INVITED: "invited",
  ACTIVE: "active",
  TRANSFERRED: "transferred",
  REVOKED: "revoked",
} as const;

export type OwnerAppointmentStatus =
  (typeof OWNER_APPOINTMENT_STATUS)[keyof typeof OWNER_APPOINTMENT_STATUS];

export interface OwnerAppointmentEntityInterface {
  id: string;
  tenantId: TenantId;
  invitedEmail: string;
  invitedDisplayName: string;
  invitedLocale: string;
  status: OwnerAppointmentStatus;
  reason: string;
  invitedAt: Date;
}

export const ONBOARDING_STATUS = {
  PENDING_ACTIVATION: "pending_activation",
  ACTIVATED: "activated",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];

export interface TenantOnboardingRequestEntityInterface {
  id: string;
  correlationId: string;
  status: OnboardingStatus;
  tenantId: TenantId;
  organizationName: string;
  externalOrganizationIdentifier?: string;
  requestedSettings: TenantSettingsInterface;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerLocale: string;
  policyAcceptanceVersion: string;
  requestedAt: Date;
}
