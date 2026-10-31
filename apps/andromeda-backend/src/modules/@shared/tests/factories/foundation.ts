import { createBusinessFixture } from "platform/validation/business-fixture";
import type { BusinessFixtureInterface } from "platform/validation/business-fixture";

export const makeFoundation = (overrides: Partial<BusinessFixtureInterface> = {}): BusinessFixtureInterface => ({
  ...createBusinessFixture(),
  ...overrides,
});
