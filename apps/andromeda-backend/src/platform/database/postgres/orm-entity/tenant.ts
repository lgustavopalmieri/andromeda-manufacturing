import { EntitySchema } from "typeorm";
import type { TenantEntityInterface } from "modules/tenant/entity/tenant.entity";

export const TenantOrmEntity = new EntitySchema<TenantEntityInterface>({
  name: "Tenant",
  tableName: "tenants",
  columns: {
    id: {
      type: "text",
      primary: true,
      nullable: false,
    },
    code: {
      type: "text",
      nullable: false,
    },
  },
});
