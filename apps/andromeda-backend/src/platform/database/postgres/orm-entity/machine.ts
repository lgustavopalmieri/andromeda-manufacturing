import { EntitySchema } from "typeorm";
import type { MachineEntityInterface } from "modules/machine/entity/machine.entity";

export const MachineOrmEntity = new EntitySchema<MachineEntityInterface>({
  name: "Machine",
  tableName: "machines",
  columns: {
    id: {
      type: "text",
      primary: true,
      nullable: false,
    },
    tenantId: {
      name: "tenant_id",
      type: "text",
      nullable: false,
    },
    code: {
      type: "text",
      nullable: false,
    },
    locationId: {
      name: "location_id",
      type: "text",
      nullable: false,
    },
  },
});
