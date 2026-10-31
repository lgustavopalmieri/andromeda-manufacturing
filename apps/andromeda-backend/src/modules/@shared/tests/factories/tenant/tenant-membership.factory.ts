import type { TenantMembershipEntityInterface } from "modules/tenant/entity/tenant-membership.entity";

export const makeTenantMembership = (
  overrides: Partial<TenantMembershipEntityInterface> = {},
): TenantMembershipEntityInterface => ({
  tenantId: "ta",
  actorId: "u-actor",
  status: "active",
  ...overrides,
});
