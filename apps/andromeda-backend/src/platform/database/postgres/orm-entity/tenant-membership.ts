import { EntitySchema } from "typeorm";
import type { TenantMembershipEntityInterface } from "modules/tenant/entity/tenant-membership.entity";

export const TenantMembershipOrmEntity = new EntitySchema<TenantMembershipEntityInterface>({
  name: "TenantMembership",
  tableName: "tenant_memberships",
  columns: {
    tenantId: {
      name: "tenant_id",
      type: "text",
      primary: true,
      nullable: false,
    },
    actorId: {
      name: "actor_id",
      type: "text",
      primary: true,
      nullable: false,
    },
    status: {
      type: "text",
      nullable: false,
    },
  },
});
