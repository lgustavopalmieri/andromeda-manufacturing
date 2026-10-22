import { AUDIT_DECISION, type AuditEventEntityInterface } from "../../../../audit-trail/entity/audit-event.entity";
import type { RecordAuditEventInputProps } from "../../../../audit-trail/features/record-event/domain/types";

export const makeAuditEventEntity = (
  overrides: Partial<AuditEventEntityInterface> = {},
): AuditEventEntityInterface => ({
  id: "3f0df01f-d276-444e-9b53-527c17250133",
  tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
  occurredAt: new Date("2026-10-22T15:00:00.000Z"),
  operationCode: "production-order:operate",
  decision: AUDIT_DECISION.PERMITTED,
  effectiveActor: { identityId: "9f22549d-f6c3-4c2b-a4de-006443d28602", identityKind: "human" },
  resource: {
    resourceType: "production-order",
    resourceId: "ac1e18b6-e4d4-41b5-afdc-a84be2f0a1c9",
    topologyNodeIds: ["3db9c496-4dcb-4b3e-9f89-531c315db94a"],
    functionalObjectRefs: [],
  },
  correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4",
  accessGrantIds: ["2ec571bc-b6da-4908-aea7-9768e6059b74"],
  origin: "hmi",
  ...overrides,
});

export const makeRecordAuditEventInput = (
  overrides: Partial<RecordAuditEventInputProps> = {},
): RecordAuditEventInputProps => {
  const { id: _id, occurredAt: _occurredAt, ...input } = makeAuditEventEntity();
  return { ...input, ...overrides };
};
