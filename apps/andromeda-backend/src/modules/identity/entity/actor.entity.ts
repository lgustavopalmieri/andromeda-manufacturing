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

/**
 * Stable platform identity, persisted in actors; contains no login credentials or permissions.
 *
 * @property {string} id - Identifies the person/service/agent, such as "u-operator"; DUAL has one such ID.
 * @property {string} name - Display/fixture name; does not grant a role, tenant membership or operation.
 * @property {ActorKind} kind - Distinguishes a human from an accountable service/agent identity.
 * @property {ActorStatus} status - Business-directory lifecycle projection; authorization uses the persisted FGA actor-enabled gate without reading this row.
 * @property {string|null} ownerActorId - Non-null owner required by domain validation for service/agent identities; null when no owner is assigned.
 */
export interface ActorEntityInterface {
  id: string;
  name: string;
  kind: ActorKind;
  status: ActorStatus;
  ownerActorId: string | null;
}
