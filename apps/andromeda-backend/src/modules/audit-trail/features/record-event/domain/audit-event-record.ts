import type { AuditEventEntityInterface } from "../../../entity/audit-event.entity";
import {
  AuditEventActorRequiredError,
  AuditEventCorrelationRequiredError,
  AuditEventOperationRequiredError,
  AuditEventResourceRequiredError,
} from "./errors.js";
import type { RecordAuditEventInputProps } from "./types.js";

export class AuditEventRecord {
  public static create(
    input: RecordAuditEventInputProps,
    id: string,
    occurredAt: Date,
  ): AuditEventEntityInterface {
    this.assertRequired(input);

    return {
      id,
      tenantId: input.tenantId,
      occurredAt,
      operationCode: input.operationCode.trim(),
      decision: input.decision,
      effectiveActor: { ...input.effectiveActor },
      ...(input.sponsoringActor === undefined ? {} : { sponsoringActor: { ...input.sponsoringActor } }),
      resource: {
        ...input.resource,
        topologyNodeIds: [...input.resource.topologyNodeIds],
        functionalObjectRefs: [...input.resource.functionalObjectRefs],
      },
      correlationId: input.correlationId,
      ...(input.causationId === undefined ? {} : { causationId: input.causationId }),
      accessGrantIds: [...input.accessGrantIds],
      ...(input.policyRevisionId === undefined ? {} : { policyRevisionId: input.policyRevisionId }),
      ...(input.delegationId === undefined ? {} : { delegationId: input.delegationId }),
      ...(input.emergencyAccessId === undefined
        ? {}
        : { emergencyAccessId: input.emergencyAccessId }),
      ...(input.credentialId === undefined ? {} : { credentialId: input.credentialId }),
      ...(input.reason === undefined ? {} : { reason: input.reason }),
      ...(input.denialCode === undefined ? {} : { denialCode: input.denialCode }),
      ...(input.beforeDigest === undefined ? {} : { beforeDigest: input.beforeDigest }),
      ...(input.afterDigest === undefined ? {} : { afterDigest: input.afterDigest }),
      ...(input.resultReference === undefined ? {} : { resultReference: input.resultReference }),
      origin: input.origin,
    };
  }

  private static assertRequired(input: RecordAuditEventInputProps): void {
    if (!input.operationCode.trim()) throw new AuditEventOperationRequiredError();
    if (!input.correlationId.trim()) throw new AuditEventCorrelationRequiredError();
    if (!input.effectiveActor.identityId.trim()) throw new AuditEventActorRequiredError();
    if (!input.resource.resourceType.trim() || !input.resource.resourceId.trim()) {
      throw new AuditEventResourceRequiredError();
    }
  }
}
