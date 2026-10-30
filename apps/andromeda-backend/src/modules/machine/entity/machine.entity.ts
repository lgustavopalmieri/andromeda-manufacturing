/** Minimal real machine record, persisted in machines; later features add machine details. */
export interface MachineEntityInterface {
  /** Stable identity, such as "m1a"; survives a line reassignment. */
  id: string;
  /** Required customer ownership; a foreign machine is never resolved by code alone. */
  tenantId: string;
  /** Readable machine code; both A and B may legitimately store "M1". */
  code: string;
  /** Current business location, such as "l1a"; future inheritance may register corresponding graph parent edges. */
  locationId: string;
}
