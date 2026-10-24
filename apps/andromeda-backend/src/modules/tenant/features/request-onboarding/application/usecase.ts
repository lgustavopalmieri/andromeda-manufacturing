import {
  AUDIT_DECISION,
  type AuditEventEntityInterface,
} from "../../../../audit-trail/entity/audit-event.entity";
import type { OutboxMessageInterface } from "@shared/events/outbox";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
} from "../../../entity/tenant.entity";
import { RequestOnboarding } from "../domain/request-onboarding.js";
import type {
  RequestOnboardingInputProps,
  RequestOnboardingOutputProps,
} from "../domain/types.js";
import type {
  OnboardingClockInterface,
  OnboardingIdGeneratorInterface,
  RequestOnboardingTransactionContextInterface,
  RequestOnboardingTransactionInterface,
} from "./interfaces.js";

export class RequestOnboardingUsecase {
  public constructor(
    private readonly transaction: RequestOnboardingTransactionInterface,
    private readonly idGenerator: OnboardingIdGeneratorInterface,
    private readonly clock: OnboardingClockInterface,
  ) {}

  public async execute(input: RequestOnboardingInputProps): Promise<RequestOnboardingOutputProps> {
    const normalized = RequestOnboarding.create(input);

    return await this.transaction.run(async (context) => {
      await context.onboardingRequests.lockByCorrelationId(normalized.correlationId);
      const existing = await context.onboardingRequests.findByCorrelationId(normalized.correlationId);
      if (existing) return existing;

      const createdAt = this.clock.now();
      const bootstrap = RequestOnboarding.bootstrap(
        normalized,
        {
          tenantId: this.idGenerator.generate(),
          policyRevisionId: this.idGenerator.generate(),
          onboardingRequestId: this.idGenerator.generate(),
          accountOwnerRoleRevisionId: this.idGenerator.generate(),
          accountOwnerRoleDefinitionId: this.idGenerator.generate(),
          tenantAdministratorRoleRevisionId: this.idGenerator.generate(),
          tenantAdministratorRoleDefinitionId: this.idGenerator.generate(),
          ownerAppointmentId: this.idGenerator.generate(),
        },
        createdAt,
      );
      const auditEvent = this.createAuditEvent(bootstrap.tenant, bootstrap.request, createdAt);

      await context.tenants.insert(bootstrap.tenant);
      await context.onboardingRequests.insert(bootstrap.request);
      await context.accessCatalog.ensurePermissionDefinitions(bootstrap.permissionDefinitions);
      await context.accessCatalog.insertPolicy(bootstrap.policy);
      for (const role of bootstrap.roles) await context.accessCatalog.insertRole(role.definition, role.revision);
      await context.ownerAppointments.insert(bootstrap.ownerAppointment);
      await context.auditEvents.insert(auditEvent);
      await context.outbox.enqueue(
        this.createOnboardingOutboxMessage(bootstrap.request, bootstrap.tenant, createdAt),
      );
      await context.outbox.enqueue(
        this.createInvitationOutboxMessage(bootstrap.request, bootstrap.ownerAppointment, createdAt),
      );

      return bootstrap.request;
    });
  }

  private createAuditEvent(
    tenant: TenantEntityInterface,
    request: TenantOnboardingRequestEntityInterface,
    occurredAt: Date,
  ): AuditEventEntityInterface {
    return {
      id: this.idGenerator.generate(),
      tenantId: tenant.id,
      occurredAt,
      operationCode: "tenant:request-onboarding",
      decision: AUDIT_DECISION.PERMITTED,
      effectiveActor: { identityId: "system", identityKind: "service" },
      resource: {
        resourceType: "tenant-onboarding-request",
        resourceId: request.id,
        topologyNodeIds: [],
        functionalObjectRefs: [],
      },
      correlationId: request.correlationId,
      accessGrantIds: [],
      policyRevisionId: tenant.activeAccessPolicyRevisionId,
      origin: "http",
    };
  }

  private createOnboardingOutboxMessage(
    request: TenantOnboardingRequestEntityInterface,
    tenant: TenantEntityInterface,
    occurredAt: Date,
  ): OutboxMessageInterface {
    return {
      id: this.idGenerator.generate(),
      tenantId: tenant.id,
      eventName: "tenant.onboarding-requested",
      aggregateType: "tenant-onboarding-request",
      aggregateId: request.id,
      correlationId: request.correlationId,
      payload: { onboardingRequestId: request.id, tenantId: tenant.id },
      occurredAt,
      availableAt: occurredAt,
      attempts: 0,
    };
  }

  private createInvitationOutboxMessage(
    request: TenantOnboardingRequestEntityInterface,
    owner: OwnerAppointmentEntityInterface,
    occurredAt: Date,
  ): OutboxMessageInterface {
    return {
      id: this.idGenerator.generate(),
      tenantId: owner.tenantId,
      eventName: "tenant.owner-invitation-provision-requested",
      aggregateType: "owner-appointment",
      aggregateId: owner.id,
      correlationId: request.correlationId,
      payload: { ownerAppointmentId: owner.id, onboardingRequestId: request.id },
      occurredAt,
      availableAt: occurredAt,
      attempts: 0,
    };
  }
}
