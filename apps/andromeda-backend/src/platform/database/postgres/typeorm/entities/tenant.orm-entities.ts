import { EntitySchema } from "typeorm";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
} from "modules/tenant/entity/tenant.entity";

export const TenantOrmEntity = new EntitySchema<TenantEntityInterface>({
  name: "Tenant",
  tableName: "tenant",
  columns: {
    id: { type: "uuid", primary: true },
    status: { type: "varchar", length: 32 },
    organizationName: { name: "organization_name", type: "varchar", length: 240 },
    externalOrganizationIdentifier: {
      name: "external_organization_identifier",
      type: "varchar",
      length: 180,
      nullable: true,
    },
    settings: { type: "jsonb" },
    activeAccessPolicyRevisionId: { name: "active_access_policy_revision_id", type: "uuid" },
    createdAt: { name: "created_at", type: "timestamp with time zone" },
    updatedAt: { name: "updated_at", type: "timestamp with time zone" },
  },
});

export const TenantOnboardingRequestOrmEntity = new EntitySchema<TenantOnboardingRequestEntityInterface>({
  name: "TenantOnboardingRequest",
  tableName: "tenant_onboarding_request",
  columns: {
    id: { type: "uuid", primary: true },
    correlationId: { name: "correlation_id", type: "uuid", unique: true },
    status: { type: "varchar", length: 32 },
    tenantId: { name: "tenant_id", type: "uuid" },
    organizationName: { name: "organization_name", type: "varchar", length: 240 },
    externalOrganizationIdentifier: {
      name: "external_organization_identifier",
      type: "varchar",
      length: 180,
      nullable: true,
    },
    requestedSettings: { name: "requested_settings", type: "jsonb" },
    ownerEmail: { name: "owner_email", type: "varchar", length: 320 },
    ownerDisplayName: { name: "owner_display_name", type: "varchar", length: 240 },
    ownerLocale: { name: "owner_locale", type: "varchar", length: 32 },
    policyAcceptanceVersion: { name: "policy_acceptance_version", type: "varchar", length: 120 },
    requestedAt: { name: "requested_at", type: "timestamp with time zone" },
  },
});

export const OwnerAppointmentOrmEntity = new EntitySchema<OwnerAppointmentEntityInterface>({
  name: "OwnerAppointment",
  tableName: "owner_appointment",
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    invitedEmail: { name: "invited_email", type: "varchar", length: 320 },
    invitedDisplayName: { name: "invited_display_name", type: "varchar", length: 240 },
    invitedLocale: { name: "invited_locale", type: "varchar", length: 32 },
    status: { type: "varchar", length: 32 },
    reason: { type: "varchar", length: 2_000 },
    invitedAt: { name: "invited_at", type: "timestamp with time zone" },
  },
});
