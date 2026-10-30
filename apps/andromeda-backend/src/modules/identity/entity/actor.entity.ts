export const ACTOR_KIND = {
  HUMAN: "human",
  SERVICE: "service",
  AGENT: "agent",
} as const;
export type ActorKind = (typeof ACTOR_KIND)[keyof typeof ACTOR_KIND];
export const ACTOR_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type ActorStatus = (typeof ACTOR_STATUS)[keyof typeof ACTOR_STATUS];

/** Stable platform identity, persisted in actors; contains no login credentials or permissions. */
export interface ActorEntityInterface {
  /** Identifies the person/service/agent, such as "u-operator"; DUAL has one such ID. */
  id: string;
  /** Display/fixture name; does not grant a role, tenant membership or operation. */
  name: string;
  /** Distinguishes a human from an accountable service/agent identity. */
  kind: ActorKind;
  /** Business-directory lifecycle projection; authorization uses the persisted FGA actor-enabled gate without reading this row. */
  status: ActorStatus;
  /** Required by domain validation for service/agent identities; absent for ordinary humans. */
  ownerActorId?: string;
}
