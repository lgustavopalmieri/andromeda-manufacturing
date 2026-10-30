export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REMOVED: "removed",
} as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

/** One actor's participation in one tenant; persisted under a unique tenantId/actorId key. */
export interface TenantMembershipEntityInterface {
  /** Customer this membership belongs to; changing A never changes the independent B row. */
  tenantId: string;
  /** Foreign key to the global actor, such as "u-dual". */
  actorId: string;
  /** Business-directory membership projection; current authorization uses persisted graph membership and enabled gates. */
  status: MembershipStatus;
}
