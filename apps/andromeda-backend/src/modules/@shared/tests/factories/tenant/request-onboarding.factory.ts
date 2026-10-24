import type {
  RequestOnboardingBootstrapIdentifiersInterface,
  RequestOnboardingInputProps,
} from "modules/tenant/features/request-onboarding/domain/types";
import {
  ONBOARDING_STATUS,
  type TenantOnboardingRequestEntityInterface,
} from "modules/tenant/entity/tenant.entity";

export const makeRequestOnboardingInput = (
  overrides: Partial<RequestOnboardingInputProps> = {},
): RequestOnboardingInputProps => ({
  correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4",
  organizationName: "Indústria Aurora",
  externalOrganizationIdentifier: "AURORA-01",
  settings: {
    countryCode: "BR",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    preferredUnitSystem: "metric",
    branding: { displayName: "Aurora" },
    administrativeContactEmails: ["admin@aurora.example"],
  },
  ownerEmail: "beatriz@aurora.example",
  ownerDisplayName: "Beatriz Silva",
  ownerLocale: "pt-BR",
  policyAcceptanceVersion: "2026-10",
  ...overrides,
});

export const makeRequestOnboardingBody = (
  overrides: Partial<Omit<RequestOnboardingInputProps, "correlationId">> = {},
): Omit<RequestOnboardingInputProps, "correlationId"> => {
  const { correlationId: _correlationId, ...body } = makeRequestOnboardingInput();
  return { ...body, ...overrides };
};

export const makeRequestOnboardingBootstrapIdentifiers = (
  overrides: Partial<RequestOnboardingBootstrapIdentifiersInterface> = {},
): RequestOnboardingBootstrapIdentifiersInterface => ({
  tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
  policyRevisionId: "e7a0c966-c536-4299-8c62-2dd6ec043f92",
  onboardingRequestId: "3f0df01f-d276-444e-9b53-527c17250133",
  accountOwnerRoleRevisionId: "6e52e58b-aa3e-463e-b7b2-3f12c3d17774",
  accountOwnerRoleDefinitionId: "2ec571bc-b6da-4908-aea7-9768e6059b74",
  tenantAdministratorRoleRevisionId: "3db9c496-4dcb-4b3e-4f89-531c315db94a",
  tenantAdministratorRoleDefinitionId: "9f22549d-f6c3-4c2b-a4de-006443d28602",
  ownerAppointmentId: "c934c678-e91a-4b9a-9de7-0fa1e1d1c57d",
  ...overrides,
});

export const makeTenantOnboardingRequest = (
  overrides: Partial<TenantOnboardingRequestEntityInterface> = {},
): TenantOnboardingRequestEntityInterface => ({
  id: "3f0df01f-d276-444e-9b53-527c17250133",
  correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4",
  status: ONBOARDING_STATUS.PENDING_ACTIVATION,
  tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
  organizationName: "Indústria Aurora",
  externalOrganizationIdentifier: "AURORA-01",
  requestedSettings: makeRequestOnboardingInput().settings,
  ownerEmail: "beatriz@aurora.example",
  ownerDisplayName: "Beatriz Silva",
  ownerLocale: "pt-BR",
  policyAcceptanceVersion: "2026-10",
  requestedAt: new Date("2026-10-23T22:00:00.000Z"),
  ...overrides,
});
