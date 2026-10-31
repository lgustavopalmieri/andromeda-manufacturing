/**
 * Minimal real machine record, persisted in machines; later features add machine details.
 *
 * @property {string} id - Stable identity, such as "m1a"; survives a line reassignment.
 * @property {string} tenantId - Required customer ownership; a foreign machine is never resolved by code alone.
 * @property {string} code - Readable machine code; both A and B may legitimately store "M1".
 * @property {string} locationId - Current business location, such as "l1a"; future inheritance may register corresponding graph parent edges.
 */
export interface MachineEntityInterface {
  id: string;
  tenantId: string;
  code: string;
  locationId: string;
}
