export const LOCATION_KIND = {
  PLANT: "plant",
  AREA: "area",
  LINE: "line",
  WAREHOUSE: "warehouse",
} as const;
export type LocationKind = (typeof LOCATION_KIND)[keyof typeof LOCATION_KIND];

/** Actual factory/logistics location, persisted in locations; application owns this hierarchy. */
export interface LocationEntityInterface {
  /** Stable location ID, such as "l1a"; distinct from another tenant's readable L1 code. */
  id: string;
  /** Required tenant ownership; every parent lookup uses the same tenant. */
  tenantId: string;
  /** Readable identifier, such as "L1". */
  code: string;
  /** Determines valid parent kinds; warehouses cannot become line descendants. */
  kind: LocationKind;
  /** Current parent location. Absent for a root plant; its FGA parent is the tenant root. */
  parentLocationId?: string;
}
