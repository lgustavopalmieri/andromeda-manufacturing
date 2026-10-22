import { describe, expect, it } from "vitest";
import { makeRecordAuditEventInput } from "@shared/tests/factories/audit-trail/record-event.factory";
import {
  AuditEventActorRequiredError,
  AuditEventCorrelationRequiredError,
  AuditEventOperationRequiredError,
  AuditEventResourceRequiredError,
} from "./errors.js";
import { AuditEventRecord } from "./audit-event-record.js";

interface MakeSutInterface {
  sut: typeof AuditEventRecord;
}

const makeSut = (): MakeSutInterface => ({ sut: AuditEventRecord });

describe("AuditEventRecord", () => {
  describe("when the audit fact has caller-owned nested references", () => {
    it("should create an immutable snapshot without retaining their arrays or objects", () => {
      const { sut } = makeSut();
      const accessGrantIds = ["2ec571bc-b6da-4908-aea7-9768e6059b74"];
      const topologyNodeIds = ["3db9c496-4dcb-4b3e-9f89-531c315db94a"];
      const input = makeRecordAuditEventInput({
        accessGrantIds,
        resource: {
          resourceType: "production-order",
          resourceId: "ac1e18b6-e4d4-41b5-afdc-a84be2f0a1c9",
          topologyNodeIds,
          functionalObjectRefs: [],
        },
      });
      const occurredAt = new Date("2026-10-22T15:00:00.000Z");

      const event = sut.create(input, "3f0df01f-d276-444e-9b53-527c17250133", occurredAt);
      accessGrantIds.push("b00d1434-46e9-4ff0-a1c7-05a49fa8ea64");
      topologyNodeIds.push("a92aefbc-4b34-45ae-aee2-ddf7934a13d4");

      expect(event).toMatchObject({
        id: "3f0df01f-d276-444e-9b53-527c17250133",
        occurredAt,
        operationCode: "production-order:operate",
        accessGrantIds: ["2ec571bc-b6da-4908-aea7-9768e6059b74"],
        resource: { topologyNodeIds: ["3db9c496-4dcb-4b3e-9f89-531c315db94a"] },
      });
    });
  });

  describe("when a required historical reference is missing", () => {
    it.each([
      [
        makeRecordAuditEventInput({ operationCode: "  " }),
        AuditEventOperationRequiredError,
        "Audit event operation code is required.",
      ],
      [
        makeRecordAuditEventInput({ correlationId: "  " }),
        AuditEventCorrelationRequiredError,
        "Audit event correlation id is required.",
      ],
      [
        makeRecordAuditEventInput({ effectiveActor: { identityId: " ", identityKind: "human" } }),
        AuditEventActorRequiredError,
        "Audit event effective actor is required.",
      ],
      [
        makeRecordAuditEventInput({
          resource: {
            resourceType: "",
            resourceId: "order-01",
            topologyNodeIds: [],
            functionalObjectRefs: [],
          },
        }),
        AuditEventResourceRequiredError,
        "Audit event resource is required.",
      ],
    ])("should reject the audit event", (input, ErrorType, expectedMessage) => {
      const { sut } = makeSut();

      expect(() => sut.create(input, "id", new Date())).toThrow(ErrorType);
      expect(() => sut.create(input, "id", new Date())).toThrow(expectedMessage);
    });
  });
});
