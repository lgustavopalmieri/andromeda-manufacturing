export const LOCATION_KIND = {
  PLANT: "plant",
  AREA: "area",
  LINE: "line",
  WAREHOUSE: "warehouse",
} as const;
export type LocationKind = (typeof LOCATION_KIND)[keyof typeof LOCATION_KIND];

/**
 * Actual factory/logistics location, persisted in locations; application owns this hierarchy.
 *
 * @property {string} id - Stable location ID, such as "l1a"; distinct from another tenant's readable L1 code.
 * @property {string} tenantId - Required tenant ownership; every parent lookup uses the same tenant.
 * @property {string} code - Readable identifier, such as "L1".
 * @property {LocationKind} kind - Determines valid parent kinds; warehouses cannot become line descendants.
 * @property {string|null} parentLocationId - Current parent location. Null for a root plant; its FGA parent is the tenant root.
 */
export interface LocationEntityInterface {
  id: string;
  tenantId: string;
  code: string;
  kind: LocationKind;
  parentLocationId: string | null;
}
