import type { ActorEntityInterface } from "modules/identity/entity/actor.entity";

export const makeActor = (overrides: Partial<ActorEntityInterface> = {}): ActorEntityInterface => ({
  id: "u-actor",
  name: "Actor",
  kind: "human",
  status: "active",
  ownerActorId: null,
  ...overrides,
});
