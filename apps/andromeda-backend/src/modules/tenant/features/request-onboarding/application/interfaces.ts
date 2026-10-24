import type {
  AccessPolicyRevisionEntityInterface,
  PermissionDefinitionEntityInterface,
  RoleDefinitionEntityInterface,
  RoleRevisionEntityInterface,
} from "../../../../access-governance/entity/access-catalog.entity";
import type { AuditEventEntityInterface } from "../../../../audit-trail/entity/audit-event.entity";
import type { OutboxMessageEnqueuerInterface } from "@shared/events/outbox";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
} from "../../../entity/tenant.entity";
import type { RequestOnboardingInputProps, RequestOnboardingOutputProps } from "../domain/types.js";

export interface RequestOnboardingUsecaseInterface {
  execute(input: RequestOnboardingInputProps): Promise<RequestOnboardingOutputProps>;
}

export interface OnboardingIdGeneratorInterface {
  generate(): string;
}

export interface OnboardingClockInterface {
  now(): Date;
}

export interface TenantOnboardingRequestRepositoryInterface {
  lockByCorrelationId(correlationId: string): Promise<void>;
  findByCorrelationId(correlationId: string): Promise<TenantOnboardingRequestEntityInterface | null>;
  insert(request: TenantOnboardingRequestEntityInterface): Promise<void>;
}

export interface RequestOnboardingTransactionContextInterface {
  onboardingRequests: TenantOnboardingRequestRepositoryInterface;
  tenants: { insert(tenant: TenantEntityInterface): Promise<void> };
  ownerAppointments: { insert(appointment: OwnerAppointmentEntityInterface): Promise<void> };
  accessCatalog: {
    ensurePermissionDefinitions(definitions: readonly PermissionDefinitionEntityInterface[]): Promise<void>;
    insertPolicy(policy: AccessPolicyRevisionEntityInterface): Promise<void>;
    insertRole(definition: RoleDefinitionEntityInterface, revision: RoleRevisionEntityInterface): Promise<void>;
  };
  auditEvents: { insert(event: AuditEventEntityInterface): Promise<void> };
  outbox: OutboxMessageEnqueuerInterface;
}

export interface RequestOnboardingTransactionInterface {
  run<T>(work: (context: RequestOnboardingTransactionContextInterface) => Promise<T>): Promise<T>;
}
