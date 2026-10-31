import type { LocationEntityInterface } from "modules/location/entity/location.entity";

export const makeLocation = (
  overrides: Partial<LocationEntityInterface> = {},
): LocationEntityInterface => ({
  id: "l1a",
  tenantId: "ta",
  code: "L1",
  kind: "plant",
  parentLocationId: null,
  ...overrides,
});
