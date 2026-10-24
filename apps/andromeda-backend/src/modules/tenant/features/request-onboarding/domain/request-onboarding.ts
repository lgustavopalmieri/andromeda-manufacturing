import {
  OnboardingAdministrativeContactRequiredError,
  OnboardingOwnerEmailInvalidError,
  OnboardingOrganizationNameRequiredError,
  OnboardingOwnerRequiredError,
  OnboardingPolicyAcceptanceRequiredError,
  OnboardingSettingsRequiredError,
} from "./errors.js";
import {
  OWNER_APPOINTMENT_STATUS,
  ONBOARDING_STATUS,
  TENANT_STATUS,
  type OwnerAppointmentEntityInterface,
  type TenantEntityInterface,
  type TenantOnboardingRequestEntityInterface,
} from "../../../entity/tenant.entity";
import type {
  AccessPolicyRevisionEntityInterface,
  RoleDefinitionEntityInterface,
  RoleRevisionEntityInterface,
} from "../../../../access-governance/entity/access-catalog.entity";
import {
  INITIAL_ACCESS_POLICY_RULES,
  INITIAL_PERMISSION_DEFINITIONS,
  INITIAL_ROLE_PERMISSION_CODES,
  INITIAL_ROLE_TEMPLATES,
} from "./rules.js";
import type {
  InitialRoleInterface,
  RequestOnboardingBootstrapIdentifiersInterface,
  RequestOnboardingBootstrapInterface,
  RequestOnboardingInputProps,
} from "./types.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export class RequestOnboarding {
  public static create(input: RequestOnboardingInputProps): RequestOnboardingInputProps {
    const { externalOrganizationIdentifier, settings, ...request } = input;
    const organizationName = input.organizationName?.trim();
    const ownerEmail = input.ownerEmail?.trim().toLowerCase();
    const ownerDisplayName = input.ownerDisplayName?.trim();
    const ownerLocale = input.ownerLocale?.trim();
    const policyAcceptanceVersion = input.policyAcceptanceVersion?.trim();
    const { countryCode, locale, timeZone, preferredUnitSystem } = settings;

    if (!organizationName) throw new OnboardingOrganizationNameRequiredError();
    if (!ownerEmail || !ownerDisplayName || !ownerLocale) throw new OnboardingOwnerRequiredError();
    if (!emailPattern.test(ownerEmail)) throw new OnboardingOwnerEmailInvalidError();
    if (!countryCode?.trim() || !locale?.trim() || !timeZone?.trim() || !preferredUnitSystem?.trim()) {
      throw new OnboardingSettingsRequiredError();
    }
    if (!policyAcceptanceVersion) throw new OnboardingPolicyAcceptanceRequiredError();

    const administrativeContactEmails = settings.administrativeContactEmails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    if (
      administrativeContactEmails.length === 0 ||
      administrativeContactEmails.some((email) => !emailPattern.test(email))
    ) {
      throw new OnboardingAdministrativeContactRequiredError();
    }

    return {
      ...request,
      organizationName,
      ownerEmail,
      ownerDisplayName,
      ownerLocale,
      policyAcceptanceVersion,
      ...(externalOrganizationIdentifier?.trim()
        ? { externalOrganizationIdentifier: externalOrganizationIdentifier.trim() }
        : {}),
      settings: {
        countryCode: countryCode.trim().toUpperCase(),
        locale: locale.trim(),
        timeZone: timeZone.trim(),
        preferredUnitSystem: preferredUnitSystem.trim(),
        branding: settings.branding.displayName?.trim()
          ? { displayName: settings.branding.displayName.trim() }
          : {},
        administrativeContactEmails: [...new Set(administrativeContactEmails)],
      },
    };
  }

  public static bootstrap(
    input: RequestOnboardingInputProps,
    identifiers: RequestOnboardingBootstrapIdentifiersInterface,
    occurredAt: Date,
  ): RequestOnboardingBootstrapInterface {
    const tenant = RequestOnboarding.createTenant(input, identifiers.tenantId, identifiers.policyRevisionId, occurredAt);
    const request = RequestOnboarding.createRequest(input, identifiers.onboardingRequestId, tenant.id, occurredAt);

    return {
      request,
      tenant,
      policy: RequestOnboarding.createInitialPolicy(tenant.id, identifiers.policyRevisionId, occurredAt),
      roles: [
        RequestOnboarding.createInitialRole(
          tenant.id,
          INITIAL_ROLE_TEMPLATES[0],
          identifiers.accountOwnerRoleDefinitionId,
          identifiers.accountOwnerRoleRevisionId,
          occurredAt,
        ),
        RequestOnboarding.createInitialRole(
          tenant.id,
          INITIAL_ROLE_TEMPLATES[1],
          identifiers.tenantAdministratorRoleDefinitionId,
          identifiers.tenantAdministratorRoleRevisionId,
          occurredAt,
        ),
      ],
      ownerAppointment: RequestOnboarding.createOwnerAppointment(
        input,
        identifiers.ownerAppointmentId,
        tenant.id,
        occurredAt,
      ),
      permissionDefinitions: INITIAL_PERMISSION_DEFINITIONS,
    };
  }

  private static createRequest(
    input: RequestOnboardingInputProps,
    id: string,
    tenantId: string,
    requestedAt: Date,
  ): TenantOnboardingRequestEntityInterface {
    return {
      id,
      correlationId: input.correlationId,
      status: ONBOARDING_STATUS.PENDING_ACTIVATION,
      tenantId,
      organizationName: input.organizationName,
      ...(input.externalOrganizationIdentifier === undefined
        ? {}
        : { externalOrganizationIdentifier: input.externalOrganizationIdentifier }),
      requestedSettings: input.settings,
      ownerEmail: input.ownerEmail,
      ownerDisplayName: input.ownerDisplayName,
      ownerLocale: input.ownerLocale,
      policyAcceptanceVersion: input.policyAcceptanceVersion,
      requestedAt,
    };
  }

  private static createTenant(
    input: RequestOnboardingInputProps,
    id: string,
    activeAccessPolicyRevisionId: string,
    createdAt: Date,
  ): TenantEntityInterface {
    return {
      id,
      status: TENANT_STATUS.PENDING_ACTIVATION,
      organizationName: input.organizationName,
      ...(input.externalOrganizationIdentifier === undefined
        ? {}
        : { externalOrganizationIdentifier: input.externalOrganizationIdentifier }),
      settings: input.settings,
      activeAccessPolicyRevisionId,
      createdAt,
      updatedAt: createdAt,
    };
  }

  private static createInitialPolicy(
    tenantId: string,
    id: string,
    createdAt: Date,
  ): AccessPolicyRevisionEntityInterface {
    return {
      id,
      tenantId,
      version: INITIAL_ACCESS_POLICY_RULES.version,
      status: "effective",
      segregationRules: [],
      operationConditionRules: [],
      directGrantMaximumDurationHours: INITIAL_ACCESS_POLICY_RULES.directGrantMaximumDurationHours,
      emergencyAccessMaximumDurationHours: INITIAL_ACCESS_POLICY_RULES.emergencyAccessMaximumDurationHours,
      reviewIntervalDays: INITIAL_ACCESS_POLICY_RULES.reviewIntervalDays,
      effectiveFrom: createdAt,
      authoredBy: "system",
      publishedBy: "system",
      createdAt,
    };
  }

  private static createInitialRole(
    tenantId: string,
    template: (typeof INITIAL_ROLE_TEMPLATES)[number],
    definitionId: string,
    revisionId: string,
    createdAt: Date,
  ): InitialRoleInterface {
    const definition: RoleDefinitionEntityInterface = {
      id: definitionId,
      tenantId,
      code: template.code,
      displayName: template.displayName,
      origin: "base-template",
      currentPublishedRevisionId: revisionId,
      createdAt,
    };
    const revision: RoleRevisionEntityInterface = {
      id: revisionId,
      tenantId,
      roleDefinitionId: definition.id,
      version: 1,
      status: "published",
      permissionCodes: INITIAL_ROLE_PERMISSION_CODES,
      changeReason: "Initial tenant catalog.",
      authoredBy: "system",
      publishedAt: createdAt,
    };

    return { definition, revision };
  }

  private static createOwnerAppointment(
    input: RequestOnboardingInputProps,
    id: string,
    tenantId: string,
    invitedAt: Date,
  ): OwnerAppointmentEntityInterface {
    return {
      id,
      tenantId,
      invitedEmail: input.ownerEmail,
      invitedDisplayName: input.ownerDisplayName,
      invitedLocale: input.ownerLocale,
      status: OWNER_APPOINTMENT_STATUS.INVITED,
      reason: "Initial tenant owner invitation.",
      invitedAt,
    };
  }
}
