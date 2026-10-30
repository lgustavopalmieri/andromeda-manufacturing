/** One customer organization. Persisted in the application's tenants table. */
export interface TenantEntityInterface {
  /** Stable customer ID, such as "ta"; scopes every tenant-owned record. */
  id: string;
  /** Human-readable seed/customer code, such as "A"; never an authorization ID. */
  code: string;
}
