import type { MachineEntityInterface } from "modules/machine/entity/machine.entity";

export const makeMachine = (
  overrides: Partial<MachineEntityInterface> = {},
): MachineEntityInterface => ({
  id: "m1a",
  tenantId: "ta",
  code: "M1",
  locationId: "l1a",
  ...overrides,
});
