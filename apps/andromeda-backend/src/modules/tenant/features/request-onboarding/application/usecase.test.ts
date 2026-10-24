import { describe, expect, it, vi } from "vitest";
import type { AuditEventEntityInterface } from "../../../../audit-trail/entity/audit-event.entity";
import type { OutboxMessageInterface } from "@shared/events/outbox";
import {
  makeRequestOnboardingInput,
  makeTenantOnboardingRequest,
} from "@shared/tests/factories/tenant/request-onboarding.factory";
import { OnboardingOrganizationNameRequiredError } from "../domain/errors.js";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
} from "../../../entity/tenant.entity";
import type {
  RequestOnboardingTransactionContextInterface,
  RequestOnboardingTransactionInterface,
} from "./interfaces.js";
import { RequestOnboardingUsecase } from "./usecase.js";

class TransactionStub implements RequestOnboardingTransactionInterface {
  public readonly onboardingRequests = {
    lockByCorrelationId: vi.fn(async (_correlationId: string) => undefined),
    findByCorrelationId: vi.fn(async (_correlationId: string) => null as TenantOnboardingRequestEntityInterface | null),
    insert: vi.fn(async (_request: TenantOnboardingRequestEntityInterface) => undefined),
  };
  public readonly tenants = { insert: vi.fn(async (_tenant: TenantEntityInterface) => undefined) };
  public readonly ownerAppointments = {
    insert: vi.fn(async (_appointment: OwnerAppointmentEntityInterface) => undefined),
  };
  public readonly accessCatalog = {
    ensurePermissionDefinitions: vi.fn(async (_definitions: readonly object[]) => undefined),
    insertPolicy: vi.fn(async (_policy: object) => undefined),
    insertRole: vi.fn(async (_definition: object, _revision: object) => undefined),
  };
  public readonly auditEvents = { insert: vi.fn(async (_event: AuditEventEntityInterface) => undefined) };
  public readonly outbox = { enqueue: vi.fn(async (_message: OutboxMessageInterface) => undefined) };
  public readonly runSpy = vi.fn();

  public async run<T>(
    work: (context: RequestOnboardingTransactionContextInterface) => Promise<T>,
  ): Promise<T> {
    this.runSpy();
    return await work(this as unknown as RequestOnboardingTransactionContextInterface);
  }
}

interface MakeSutOptionsInterface {
  existingRequest?: TenantOnboardingRequestEntityInterface | null;
}

interface MakeSutInterface {
  sut: RequestOnboardingUsecase;
  transaction: TransactionStub;
}

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const transaction = new TransactionStub();
  transaction.onboardingRequests.findByCorrelationId.mockResolvedValue(options.existingRequest ?? null);
  const ids = [
    "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
    "e7a0c966-c536-4299-8c62-2dd6ec043f92",
    "3f0df01f-d276-444e-9b53-527c17250133",
    "6e52e58b-aa3e-463e-b7b2-3f12c3d17774",
    "2ec571bc-b6da-4908-aea7-9768e6059b74",
    "3db9c496-4dcb-4b3e-9f89-531c315db94a",
    "ac1e18b6-e4d4-41b5-afdc-a84be2f0a1c9",
    "9f22549d-f6c3-4c2b-a4de-006443d28602",
    "c934c678-e91a-4b9a-9de7-0fa1e1d1c57d",
    "5f4d6bb2-0e99-4c44-8a04-63cb9849ee6a",
    "1a0e021e-1c8d-4c66-b46e-c3ed286eb33a",
  ];
  const sut = new RequestOnboardingUsecase(
    transaction,
    { generate: vi.fn(() => ids.shift() ?? crypto.randomUUID()) },
    { now: () => new Date("2026-10-23T22:00:00.000Z") },
  );
  return { sut, transaction };
};

describe("RequestOnboardingUsecase", () => {
  describe("when a new public onboarding request is valid", () => {
    it("should atomically create the pending tenant, catalog, Owner invitation, audit event, and outbox facts", async () => {
      const { sut, transaction } = makeSut();

      const request = await sut.execute(makeRequestOnboardingInput());

      expect(request).toMatchObject({
        tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
        status: "pending_activation",
      });
      expect(transaction.onboardingRequests.lockByCorrelationId).toHaveBeenCalledWith(
        "a0cf0d99-7306-4cda-8418-963e831033d4",
      );
      expect(transaction.tenants.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: request.tenantId,
          activeAccessPolicyRevisionId: "e7a0c966-c536-4299-8c62-2dd6ec043f92",
          status: "pending_activation",
        }),
      );
      expect(transaction.accessCatalog.ensurePermissionDefinitions).toHaveBeenCalledTimes(1);
      expect(transaction.accessCatalog.insertPolicy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "e7a0c966-c536-4299-8c62-2dd6ec043f92", tenantId: request.tenantId }),
      );
      expect(transaction.accessCatalog.insertRole).toHaveBeenCalledTimes(2);
      expect(transaction.accessCatalog.insertRole).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: request.tenantId, code: "account-owner" }),
        expect.objectContaining({ tenantId: request.tenantId, permissionCodes: [
          "organization:manage",
          "access:manage",
          "access:transfer-owner",
        ] }),
      );
      expect(transaction.ownerAppointments.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: request.tenantId,
          status: "invited",
          invitedEmail: request.ownerEmail,
        }),
      );
      expect(transaction.auditEvents.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: request.tenantId,
          operationCode: "tenant:request-onboarding",
          correlationId: request.correlationId,
          effectiveActor: { identityId: "system", identityKind: "service" },
          resource: expect.objectContaining({ resourceId: request.id }),
        }),
      );
      expect(transaction.outbox.enqueue).toHaveBeenCalledTimes(2);
      expect(transaction.outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "tenant.onboarding-requested",
          tenantId: request.tenantId,
          correlationId: request.correlationId,
          payload: { onboardingRequestId: request.id, tenantId: request.tenantId },
        }),
      );
      expect(transaction.outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventName: "tenant.owner-invitation-provision-requested", tenantId: request.tenantId }),
      );
      expect(transaction.accessCatalog.ensurePermissionDefinitions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ code: "organization:manage", operational: false }),
          expect.objectContaining({ code: "access:manage", operational: false }),
          expect.objectContaining({ code: "access:transfer-owner", operational: false }),
        ]),
      );
    });
  });

  describe("when the correlation was already accepted", () => {
    it("should return the prior request without creating another tenant or invitation", async () => {
      const existingRequest = makeTenantOnboardingRequest();
      const { sut, transaction } = makeSut({ existingRequest });

      await expect(sut.execute(makeRequestOnboardingInput())).resolves.toBe(existingRequest);

      expect(transaction.tenants.insert).not.toHaveBeenCalled();
      expect(transaction.accessCatalog.ensurePermissionDefinitions).not.toHaveBeenCalled();
      expect(transaction.accessCatalog.insertPolicy).not.toHaveBeenCalled();
      expect(transaction.accessCatalog.insertRole).not.toHaveBeenCalled();
      expect(transaction.ownerAppointments.insert).not.toHaveBeenCalled();
      expect(transaction.auditEvents.insert).not.toHaveBeenCalled();
      expect(transaction.outbox.enqueue).not.toHaveBeenCalled();
    });

    it("should preserve the first request when a correlated retry changes the submitted organization", async () => {
      const existingRequest = makeTenantOnboardingRequest({ organizationName: "Indústria Aurora" });
      const { sut, transaction } = makeSut({ existingRequest });

      await expect(
        sut.execute(makeRequestOnboardingInput({ organizationName: "Organização divergente" })),
      ).resolves.toBe(existingRequest);

      expect(transaction.onboardingRequests.lockByCorrelationId).toHaveBeenCalledWith(existingRequest.correlationId);
      expect(transaction.onboardingRequests.insert).not.toHaveBeenCalled();
      expect(transaction.tenants.insert).not.toHaveBeenCalled();
    });
  });

  describe("when validation or a transactional write fails", () => {
    it("should reject invalid input before opening the transaction", async () => {
      const { sut, transaction } = makeSut();

      await expect(sut.execute(makeRequestOnboardingInput({ organizationName: " " }))).rejects.toThrow(
        OnboardingOrganizationNameRequiredError,
      );

      expect(transaction.runSpy).not.toHaveBeenCalled();
      expect(transaction.onboardingRequests.lockByCorrelationId).not.toHaveBeenCalled();
    });

    it("should stop provisioning and surface the persistence error without emitting outbox facts", async () => {
      const { sut, transaction } = makeSut();
      const error = new Error("tenant insert failed");
      transaction.tenants.insert.mockRejectedValue(error);

      await expect(sut.execute(makeRequestOnboardingInput())).rejects.toBe(error);

      expect(transaction.onboardingRequests.insert).not.toHaveBeenCalled();
      expect(transaction.accessCatalog.ensurePermissionDefinitions).not.toHaveBeenCalled();
      expect(transaction.ownerAppointments.insert).not.toHaveBeenCalled();
      expect(transaction.auditEvents.insert).not.toHaveBeenCalled();
      expect(transaction.outbox.enqueue).not.toHaveBeenCalled();
    });

    it("should not enqueue external work when recording the mandatory audit fact fails", async () => {
      const { sut, transaction } = makeSut();
      transaction.auditEvents.insert.mockRejectedValue(new Error("audit insert failed"));

      await expect(sut.execute(makeRequestOnboardingInput())).rejects.toThrow("audit insert failed");

      expect(transaction.outbox.enqueue).not.toHaveBeenCalled();
    });
  });
});
