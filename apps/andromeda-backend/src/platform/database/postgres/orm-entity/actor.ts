import { EntitySchema } from "typeorm";
import type { ActorEntityInterface } from "modules/identity/entity/actor.entity";

export const ActorOrmEntity = new EntitySchema<ActorEntityInterface>({
  name: "Actor",
  tableName: "actors",
  columns: {
    id: {
      type: "text",
      primary: true,
      nullable: false,
    },
    name: {
      type: "text",
      nullable: false,
    },
    kind: {
      type: "text",
      nullable: false,
    },
    status: {
      type: "text",
      nullable: false,
    },
    ownerActorId: {
      name: "owner_actor_id",
      type: "text",
      nullable: true,
    },
  },
});
