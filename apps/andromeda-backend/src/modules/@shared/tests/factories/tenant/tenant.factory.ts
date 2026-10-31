import type { TenantEntityInterface } from "modules/tenant/entity/tenant.entity";

export const makeTenant = (
  overrides: Partial<TenantEntityInterface> = {},
): TenantEntityInterface => ({
  id: "ta",
  code: "A",
  ...overrides,
});
