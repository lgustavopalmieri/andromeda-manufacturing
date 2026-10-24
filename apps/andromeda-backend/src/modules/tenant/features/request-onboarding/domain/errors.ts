export abstract class RequestOnboardingError extends Error {}

export class OnboardingOrganizationNameRequiredError extends RequestOnboardingError {
  public readonly name = "OnboardingOrganizationNameRequiredError";
  public constructor() {
    super("Organization name is required.");
  }
}

export class OnboardingOwnerRequiredError extends RequestOnboardingError {
  public readonly name = "OnboardingOwnerRequiredError";
  public constructor() {
    super("Owner name, email, and locale are required.");
  }
}

export class OnboardingOwnerEmailInvalidError extends RequestOnboardingError {
  public readonly name = "OnboardingOwnerEmailInvalidError";
  public constructor() {
    super("Owner email must be valid.");
  }
}

export class OnboardingSettingsRequiredError extends RequestOnboardingError {
  public readonly name = "OnboardingSettingsRequiredError";
  public constructor() {
    super("Country, locale, time zone, and preferred unit system are required.");
  }
}

export class OnboardingAdministrativeContactRequiredError extends RequestOnboardingError {
  public readonly name = "OnboardingAdministrativeContactRequiredError";
  public constructor() {
    super("At least one valid administrative contact email is required.");
  }
}

export class OnboardingPolicyAcceptanceRequiredError extends RequestOnboardingError {
  public readonly name = "OnboardingPolicyAcceptanceRequiredError";
  public constructor() {
    super("Accepted policy version is required.");
  }
}
