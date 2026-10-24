import type { PermissionDefinitionEntityInterface } from "../../../../access-governance/entity/access-catalog.entity";

export const INITIAL_PERMISSION_DEFINITIONS = [
  {
    code: "organization:manage",
    domain: "organization",
    action: "manage",
    resourceTypes: ["tenant"],
    delegable: true,
    sensitive: true,
    operational: false,
  },
  {
    code: "access:manage",
    domain: "access",
    action: "manage",
    resourceTypes: ["member", "role", "access-policy"],
    delegable: true,
    sensitive: true,
    operational: false,
  },
  {
    code: "access:transfer-owner",
    domain: "access",
    action: "transfer-owner",
    resourceTypes: ["owner-appointment"],
    delegable: false,
    sensitive: true,
    operational: false,
  },
] as const satisfies readonly PermissionDefinitionEntityInterface[];

export const INITIAL_ROLE_TEMPLATES = [
  { code: "account-owner", displayName: "Account Owner" },
  { code: "tenant-administrator", displayName: "Tenant administrator" },
] as const;

export const INITIAL_ROLE_PERMISSION_CODES = INITIAL_PERMISSION_DEFINITIONS.map(({ code }) => code);

export const INITIAL_ACCESS_POLICY_RULES = {
  version: 1,
  directGrantMaximumDurationHours: 168,
  emergencyAccessMaximumDurationHours: 8,
  reviewIntervalDays: 180,
} as const;
