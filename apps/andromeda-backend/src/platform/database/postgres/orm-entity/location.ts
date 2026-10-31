import { EntitySchema } from "typeorm";
import type { LocationEntityInterface } from "modules/location/entity/location.entity";

export const LocationOrmEntity = new EntitySchema<LocationEntityInterface>({
  name: "Location",
  tableName: "locations",
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
    kind: {
      type: "text",
      nullable: false,
    },
    parentLocationId: {
      name: "parent_location_id",
      type: "text",
      nullable: true,
    },
  },
});

