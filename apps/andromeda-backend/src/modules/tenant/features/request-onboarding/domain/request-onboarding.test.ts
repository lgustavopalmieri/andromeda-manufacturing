import { describe, expect, it } from "vitest";
import {
  makeRequestOnboardingBootstrapIdentifiers,
  makeRequestOnboardingInput,
} from "@shared/tests/factories/tenant/request-onboarding.factory";
import {
  OnboardingAdministrativeContactRequiredError,
  OnboardingOwnerEmailInvalidError,
  OnboardingOrganizationNameRequiredError,
  OnboardingOwnerRequiredError,
  OnboardingPolicyAcceptanceRequiredError,
  OnboardingSettingsRequiredError,
} from "./errors.js";
import { RequestOnboarding } from "./request-onboarding.js";

interface MakeSutInterface {
  sut: typeof RequestOnboarding;
}

const makeSut = (): MakeSutInterface => ({ sut: RequestOnboarding });

describe("RequestOnboarding", () => {
  describe("when the public request is valid", () => {
    it("should normalize the tenant and Owner data before provisioning", () => {
      const { sut } = makeSut();

      const result = sut.create(
        makeRequestOnboardingInput({
          organizationName: "  Indústria Aurora  ",
          ownerEmail: "  BEATRIZ@AURORA.EXAMPLE  ",
          ownerDisplayName: "  Beatriz Silva  ",
          settings: {
            ...makeRequestOnboardingInput().settings,
            countryCode: " br ",
            branding: { displayName: "  Aurora  " },
            administrativeContactEmails: ["  ADMIN@AURORA.EXAMPLE "],
          },
        }),
      );

      expect(result).toMatchObject({
        organizationName: "Indústria Aurora",
        ownerEmail: "beatriz@aurora.example",
        ownerDisplayName: "Beatriz Silva",
        settings: {
          countryCode: "BR",
          branding: { displayName: "Aurora" },
          administrativeContactEmails: ["admin@aurora.example"],
        },
      });
    });

    it("should omit blank optional organization and branding values without retaining caller-owned data", () => {
      const { sut } = makeSut();

      const result = sut.create(
        makeRequestOnboardingInput({
          externalOrganizationIdentifier: "   ",
          settings: {
            ...makeRequestOnboardingInput().settings,
            branding: { displayName: "   " },
            administrativeContactEmails: ["ADMIN@AURORA.EXAMPLE", "admin@aurora.example"],
          },
        }),
      );

      expect(result.externalOrganizationIdentifier).toBeUndefined();
      expect(result.settings).toMatchObject({
        branding: {},
        administrativeContactEmails: ["admin@aurora.example"],
      });
    });
  });

  describe("when bootstrapping a new tenant", () => {
    it("should create only the pending tenant, neutral access catalog, invited Owner, and correlated request", () => {
      const { sut } = makeSut();
      const occurredAt = new Date("2026-10-23T22:00:00.000Z");
      const input = sut.create(makeRequestOnboardingInput());
      const identifiers = makeRequestOnboardingBootstrapIdentifiers();

      const bootstrap = sut.bootstrap(input, identifiers, occurredAt);

      expect(bootstrap.request).toEqual(
        expect.objectContaining({
          id: identifiers.onboardingRequestId,
          correlationId: input.correlationId,
          tenantId: identifiers.tenantId,
          status: "pending_activation",
          requestedAt: occurredAt,
        }),
      );
      expect(bootstrap.tenant).toEqual(
        expect.objectContaining({
          id: identifiers.tenantId,
          status: "pending_activation",
          activeAccessPolicyRevisionId: identifiers.policyRevisionId,
          settings: input.settings,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        }),
      );
      expect(bootstrap.policy).toEqual(
        expect.objectContaining({
          id: identifiers.policyRevisionId,
          tenantId: identifiers.tenantId,
          version: 1,
          status: "effective",
          segregationRules: [],
          operationConditionRules: [],
          directGrantMaximumDurationHours: 168,
          emergencyAccessMaximumDurationHours: 8,
          reviewIntervalDays: 180,
          effectiveFrom: occurredAt,
        }),
      );
      expect(bootstrap.ownerAppointment).toEqual(
        expect.objectContaining({
          id: identifiers.ownerAppointmentId,
          tenantId: identifiers.tenantId,
          status: "invited",
          invitedEmail: input.ownerEmail,
          invitedAt: occurredAt,
        }),
      );
      expect(bootstrap.roles).toEqual([
        {
          definition: expect.objectContaining({
            id: identifiers.accountOwnerRoleDefinitionId,
            tenantId: identifiers.tenantId,
            code: "account-owner",
            currentPublishedRevisionId: identifiers.accountOwnerRoleRevisionId,
          }),
          revision: expect.objectContaining({
            id: identifiers.accountOwnerRoleRevisionId,
            tenantId: identifiers.tenantId,
            roleDefinitionId: identifiers.accountOwnerRoleDefinitionId,
            status: "published",
          }),
        },
        {
          definition: expect.objectContaining({
            id: identifiers.tenantAdministratorRoleDefinitionId,
            tenantId: identifiers.tenantId,
            code: "tenant-administrator",
            currentPublishedRevisionId: identifiers.tenantAdministratorRoleRevisionId,
          }),
          revision: expect.objectContaining({
            id: identifiers.tenantAdministratorRoleRevisionId,
            tenantId: identifiers.tenantId,
            roleDefinitionId: identifiers.tenantAdministratorRoleDefinitionId,
            status: "published",
          }),
        },
      ]);
      expect(bootstrap.permissionDefinitions).toEqual([
        expect.objectContaining({ code: "organization:manage", operational: false }),
        expect.objectContaining({ code: "access:manage", operational: false }),
        expect.objectContaining({ code: "access:transfer-owner", operational: false }),
      ]);
      expect(bootstrap.roles.flatMap(({ revision }) => revision.permissionCodes)).not.toContain(
        "hmi:operate",
      );
    });
  });

  describe("when mandatory onboarding information is missing", () => {
    it.each([
      [makeRequestOnboardingInput({ organizationName: " " }), OnboardingOrganizationNameRequiredError, "Organization name is required."],
      [makeRequestOnboardingInput({ ownerEmail: " " }), OnboardingOwnerRequiredError, "Owner name, email, and locale are required."],
      [makeRequestOnboardingInput({ ownerLocale: " " }), OnboardingOwnerRequiredError, "Owner name, email, and locale are required."],
      [
        makeRequestOnboardingInput({ settings: { ...makeRequestOnboardingInput().settings, countryCode: " " } }),
        OnboardingSettingsRequiredError,
        "Country, locale, time zone, and preferred unit system are required.",
      ],
      [
        makeRequestOnboardingInput({ settings: { ...makeRequestOnboardingInput().settings, locale: " " } }),
        OnboardingSettingsRequiredError,
        "Country, locale, time zone, and preferred unit system are required.",
      ],
      [
        makeRequestOnboardingInput({ settings: { ...makeRequestOnboardingInput().settings, timeZone: " " } }),
        OnboardingSettingsRequiredError,
        "Country, locale, time zone, and preferred unit system are required.",
      ],
      [
        makeRequestOnboardingInput({ settings: { ...makeRequestOnboardingInput().settings, preferredUnitSystem: " " } }),
        OnboardingSettingsRequiredError,
        "Country, locale, time zone, and preferred unit system are required.",
      ],
      [
        makeRequestOnboardingInput({ policyAcceptanceVersion: " " }),
        OnboardingPolicyAcceptanceRequiredError,
        "Accepted policy version is required.",
      ],
    ])("should reject the request", (input, ErrorType, expectedMessage) => {
      const { sut } = makeSut();

      expect(() => sut.create(input)).toThrow(ErrorType);
      expect(() => sut.create(input)).toThrow(expectedMessage);
    });
  });

  describe("when contact emails cannot support an accountable invitation", () => {
    it.each([
      [makeRequestOnboardingInput({ ownerEmail: "beatriz-at-aurora.example" }), OnboardingOwnerEmailInvalidError],
      [
        makeRequestOnboardingInput({
          settings: { ...makeRequestOnboardingInput().settings, administrativeContactEmails: [] },
        }),
        OnboardingAdministrativeContactRequiredError,
      ],
      [
        makeRequestOnboardingInput({
          settings: {
            ...makeRequestOnboardingInput().settings,
            administrativeContactEmails: ["not-an-email"],
          },
        }),
        OnboardingAdministrativeContactRequiredError,
      ],
    ])("should reject the request", (input, ErrorType) => {
      const { sut } = makeSut();

      expect(() => sut.create(input)).toThrow(ErrorType);
    });
  });
});
