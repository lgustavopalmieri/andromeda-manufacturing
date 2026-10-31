/**
 * One customer organization. Persisted in the application's tenants table.
 *
 * @property {string} id - Stable customer ID, such as "ta"; scopes every tenant-owned record.
 * @property {string} code - Human-readable seed/customer code, such as "A"; never an authorization ID.
 */
export interface TenantEntityInterface {
  id: string;
  code: string;
}
