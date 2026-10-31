import type { ActorEntityInterface } from "modules/identity/entity/actor.entity";
import type { LocationEntityInterface } from "modules/location/entity/location.entity";
import type { MachineEntityInterface } from "modules/machine/entity/machine.entity";
import type { TenantEntityInterface } from "modules/tenant/entity/tenant.entity";
import type { TenantMembershipEntityInterface } from "modules/tenant/entity/tenant-membership.entity";

export interface BusinessFixtureInterface {
  tenants: TenantEntityInterface[];
  actors: ActorEntityInterface[];
  memberships: TenantMembershipEntityInterface[];
  locations: LocationEntityInterface[];
  machines: MachineEntityInterface[];
}

export const createBusinessFixture = (): BusinessFixtureInterface => ({
  tenants: [
    {
      id: "ta",
      code: "A",
    },
    {
      id: "tb",
      code: "B",
    },
  ],
  actors: [...[
    "operator",
    "owner",
    "none",
    "disabled",
    "dual",
    "outsider",
    "b-operator",
  ].map((name): ActorEntityInterface => ({
    id: `u-${name}`,
    name: name.toUpperCase(),
    kind: "human",
    status: "active",
    ownerActorId: null,
  })), {
    id: "u-service",
    name: "SERVICE",
    kind: "service",
    status: "active",
    ownerActorId: "u-owner",
  }, {
    id: "u-agent",
    name: "AGENT",
    kind: "agent",
    status: "active",
    ownerActorId: "u-owner",
  }],
  memberships: [
    {
      tenantId: "ta",
      actorId: "u-operator",
      status: "active",
    },
    {
      tenantId: "ta",
      actorId: "u-owner",
      status: "active",
    },
    {
      tenantId: "ta",
      actorId: "u-none",
      status: "active",
    },
    {
      tenantId: "ta",
      actorId: "u-disabled",
      status: "suspended",
    },
    {
      tenantId: "ta",
      actorId: "u-dual",
      status: "active",
    },
    {
      tenantId: "tb",
      actorId: "u-b-operator",
      status: "active",
    },
    {
      tenantId: "tb",
      actorId: "u-dual",
      status: "active",
    },
  ],
  locations: [
    {
      id: "p1a",
      tenantId: "ta",
      code: "P1",
      kind: "plant",
      parentLocationId: null,
    },
    {
      id: "p1b",
      tenantId: "tb",
      code: "P1",
      kind: "plant",
      parentLocationId: null,
    },
    {
      id: "a1a",
      tenantId: "ta",
      code: "A1",
      kind: "area",
      parentLocationId: "p1a",
    },
    {
      id: "a1b",
      tenantId: "tb",
      code: "A1",
      kind: "area",
      parentLocationId: "p1b",
    },
    {
      id: "l1a",
      tenantId: "ta",
      code: "L1",
      kind: "line",
      parentLocationId: "a1a",
    },
    {
      id: "l1b",
      tenantId: "tb",
      code: "L1",
      kind: "line",
      parentLocationId: "a1b",
    },
  ],
  machines: [
    {
      id: "m1a",
      tenantId: "ta",
      code: "M1",
      locationId: "l1a",
    },
    {
      id: "m2a",
      tenantId: "ta",
      code: "M2",
      locationId: "l1a",
    },
    {
      id: "m1b",
      tenantId: "tb",
      code: "M1",
      locationId: "l1b",
    },
  ],
});
