import type { LocationEntityInterface } from "modules/location/entity/location.entity";
import type { BusinessFixtureInterface } from "./business-fixture";

export class InvalidBusinessHierarchyError extends Error {
  public readonly name = "InvalidBusinessHierarchyError";

  public constructor() {
    super("Business fixture hierarchy is invalid.");
  }
}

export const validateBusinessHierarchy = (
  fixture: BusinessFixtureInterface,
): LocationEntityInterface[] => {
  const locations = new Map(
    fixture.locations.map((location) => [location.id, location]),
  );
  if (locations.size !== fixture.locations.length)
    throw new InvalidBusinessHierarchyError();

  const ordered: LocationEntityInterface[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (location: LocationEntityInterface): void => {
    if (visiting.has(location.id)) throw new InvalidBusinessHierarchyError();
    if (visited.has(location.id)) return;
    visiting.add(location.id);
    if (!fixture.tenants.some((tenant) => tenant.id === location.tenantId))
      throw new InvalidBusinessHierarchyError();

    if (location.parentLocationId === null) {
      if (location.kind !== "plant") throw new InvalidBusinessHierarchyError();
    } else {
      const parent = locations.get(location.parentLocationId);
      if (!parent || parent.tenantId !== location.tenantId)
        throw new InvalidBusinessHierarchyError();
      visit(parent);
      if (
        !(
          (location.kind === "area" && parent.kind === "plant") ||
          (location.kind === "line" && parent.kind === "area")
        )
      )
        throw new InvalidBusinessHierarchyError();
    }
    visiting.delete(location.id);
    visited.add(location.id);
    ordered.push(location);
  };

  fixture.locations.forEach(visit);
  for (const machine of fixture.machines) {
    const location = locations.get(machine.locationId);
    if (
      !location ||
      location.tenantId !== machine.tenantId ||
      location.kind !== "line"
    ) {
      throw new InvalidBusinessHierarchyError();
    }
  }
  return ordered;
};
