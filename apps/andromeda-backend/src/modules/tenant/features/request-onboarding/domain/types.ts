import type {
  AccessPolicyRevisionEntityInterface,
  PermissionDefinitionEntityInterface,
  RoleDefinitionEntityInterface,
  RoleRevisionEntityInterface,
} from "../../../../access-governance/entity/access-catalog.entity";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
  TenantSettingsInterface,
} from "../../../entity/tenant.entity";

export interface RequestOnboardingInputProps {
  correlationId: string;
  organizationName: string;
  externalOrganizationIdentifier?: string;
  settings: TenantSettingsInterface;
  ownerEmail: string;
  ownerDisplayName: string;
  ownerLocale: string;
  policyAcceptanceVersion: string;
}

export type RequestOnboardingOutputProps = TenantOnboardingRequestEntityInterface;

export interface RequestOnboardingBootstrapIdentifiersInterface {
  tenantId: string;
  onboardingRequestId: string;
  policyRevisionId: string;
  ownerAppointmentId: string;
  accountOwnerRoleDefinitionId: string;
  accountOwnerRoleRevisionId: string;
  tenantAdministratorRoleDefinitionId: string;
  tenantAdministratorRoleRevisionId: string;
}

export interface InitialRoleInterface {
  definition: RoleDefinitionEntityInterface;
  revision: RoleRevisionEntityInterface;
}

export interface RequestOnboardingBootstrapInterface {
  request: TenantOnboardingRequestEntityInterface;
  tenant: TenantEntityInterface;
  policy: AccessPolicyRevisionEntityInterface;
  roles: readonly InitialRoleInterface[];
  ownerAppointment: OwnerAppointmentEntityInterface;
  permissionDefinitions: readonly PermissionDefinitionEntityInterface[];
}
