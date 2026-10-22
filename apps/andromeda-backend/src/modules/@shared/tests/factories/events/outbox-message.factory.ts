import type { OutboxMessageInterface } from "@shared/events/outbox";

export const makeOutboxMessage = (
  overrides: Partial<OutboxMessageInterface> = {},
): OutboxMessageInterface => ({
  id: "6e52e58b-aa3e-463e-b7b2-3f12c3d17774",
  tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
  eventName: "production-order.released",
  aggregateType: "production-order",
  aggregateId: "3f0df01f-d276-444e-9b53-527c17250133",
  correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4",
  payload: { productionOrderId: "3f0df01f-d276-444e-9b53-527c17250133", releasedBy: "scheduler" },
  occurredAt: new Date("2026-10-22T15:00:00.000Z"),
  availableAt: new Date("2026-10-22T15:00:00.000Z"),
  attempts: 0,
  ...overrides,
});
