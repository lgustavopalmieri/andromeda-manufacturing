import { describe, expect, it, vi } from "vitest";
import { AUTHORIZATION_DECISION } from "./access.types.js";
import type {
  AuthenticatedIdentityInterface,
  AuthorizationDecisionInterface,
  AuthorizationRequestInterface,
  AuthorizationSubjectInterface,
  ResourceContextInterface,
  TenantId,
} from "./access.types.js";
import { ContextualAuthorizedUsecase } from "./contextual-authorized-usecase.js";
import {
  AuthorizationObligationRequiredError,
  ContextualAuthorizationDeniedError,
} from "./errors.js";
import type {
  AuthorizationSubjectResolverInterface,
  ContextualAuthorizationContextInterface,
  ContextualAuthorizationServiceInterface,
} from "./interfaces.js";
import {
  makeAuthenticatedIdentity,
  makeAuthorizationDecision,
  makeAuthorizationSubject,
  makeContextualAuthorizationContext,
  makeResourceContext,
} from "../tests/factories/access/access.factory";

class AuthorizationSubjectResolverStub implements AuthorizationSubjectResolverInterface {
  public subject: AuthorizationSubjectInterface | null = makeAuthorizationSubject();

  public resolve = async (
    _identity: AuthenticatedIdentityInterface,
    _tenantId: TenantId,
  ): Promise<AuthorizationSubjectInterface | null> => this.subject;
}

class ContextualAuthorizationServiceStub implements ContextualAuthorizationServiceInterface {
  public decision: AuthorizationDecisionInterface = makeAuthorizationDecision();

  public authorize = async (
    _request: AuthorizationRequestInterface,
  ): Promise<AuthorizationDecisionInterface> => this.decision;
}

class ProtectedUsecase extends ContextualAuthorizedUsecase<ResourceContextInterface, string> {
  public context = makeContextualAuthorizationContext();
  public readonly resolveContext = vi.fn(
    async (
      _input: ResourceContextInterface,
      _subject: AuthorizationSubjectInterface,
    ): Promise<ContextualAuthorizationContextInterface> => this.context,
  );
  public readonly handle = vi.fn(async (_input: ResourceContextInterface) => "completed");

  protected async resolveAuthorizationContext(
    input: ResourceContextInterface,
    subject: AuthorizationSubjectInterface,
  ): Promise<ContextualAuthorizationContextInterface> {
    return await this.resolveContext(input, subject);
  }
}

interface MakeSutInterface {
  sut: ProtectedUsecase;
  subjectResolver: AuthorizationSubjectResolverStub;
  authorizationService: ContextualAuthorizationServiceStub;
}

const makeSut = (): MakeSutInterface => {
  const subjectResolver = new AuthorizationSubjectResolverStub();
  const authorizationService = new ContextualAuthorizationServiceStub();
  const sut = new ProtectedUsecase(subjectResolver, authorizationService);

  return { sut, subjectResolver, authorizationService };
};

describe("ContextualAuthorizedUsecase", () => {
  describe("when permitted", () => {
    it("should authorize the trusted subject and resource before executing the effect", async () => {
      const { sut, authorizationService } = makeSut();
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");
      const input = makeResourceContext();
      const identity = makeAuthenticatedIdentity();

      await expect(sut.execute(input, identity, "tenant-01")).resolves.toBe("completed");

      expect(authorizeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: makeAuthorizationSubject(),
          resource: makeResourceContext(),
          operation: "production-order:operate",
          correlationId: "correlation-01",
        }),
      );
      expect(sut.handle).toHaveBeenCalledWith(input);
    });

    it("should pass the complete trusted context required for nested topology and SoD evaluation", async () => {
      const { sut, authorizationService } = makeSut();
      const trustedResource = makeResourceContext({
        resourceType: "hmi-action",
        resourceId: "hmi-action-start-01",
        topologyNodeIds: ["site-01", "area-01", "line-01", "cell-01", "asset-01"],
        functionalObjectRefs: ["order-01", "shift-b"],
        lifecycleState: "released",
        versionId: "hmi-contract-v3",
        assetId: "asset-01",
        productFamilyId: "product-family-01",
        hmiActionCode: "hmi:order:start",
      });
      const history = [
        {
          operation: "hmi:contract:submit",
          effectiveIdentityId: "identity-author-01",
          versionId: "hmi-contract-v3",
        },
        {
          operation: "hmi:contract:approve",
          effectiveIdentityId: "identity-reviewer-01",
          versionId: "hmi-contract-v3",
        },
      ];
      const occurredAt = new Date("2026-10-21T12:03:00.000Z");
      sut.context = makeContextualAuthorizationContext({
        operation: "hmi:order:start",
        resource: trustedResource,
        history,
        occurredAt,
        correlationId: "correlation-hmi-01",
        reason: "scheduled production start",
      });
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).resolves.toBe("completed");

      expect(authorizeSpy).toHaveBeenCalledWith({
        subject: makeAuthorizationSubject(),
        operation: "hmi:order:start",
        resource: trustedResource,
        history,
        occurredAt,
        correlationId: "correlation-hmi-01",
        reason: "scheduled production start",
      });
    });

    it("should send the context resolved from the tenant-scoped resource instead of client-supplied topology", async () => {
      const { sut, authorizationService } = makeSut();
      const untrustedInput = makeResourceContext({
        tenantId: "tenant-foreign",
        resourceId: "asset-foreign",
        topologyNodeIds: ["site-foreign", "line-foreign", "asset-foreign"],
      });
      const trustedResource = makeResourceContext({
        resourceId: "asset-01",
        topologyNodeIds: ["site-01", "line-01", "asset-01"],
      });
      sut.context = makeContextualAuthorizationContext({ resource: trustedResource });
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(untrustedInput, makeAuthenticatedIdentity(), "tenant-01"),
      ).resolves.toBe("completed");

      expect(sut.resolveContext).toHaveBeenCalledWith(untrustedInput, makeAuthorizationSubject());
      expect(authorizeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ resource: trustedResource }),
      );
      expect(authorizeSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ resource: untrustedInput }),
      );
    });

    it("should re-evaluate each execution instead of retaining a previous permit", async () => {
      const { sut, authorizationService } = makeSut();
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).resolves.toBe("completed");

      authorizationService.decision = makeAuthorizationDecision({
        decision: AUTHORIZATION_DECISION.DENY,
      });

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toBeInstanceOf(ContextualAuthorizationDeniedError);

      expect(authorizeSpy).toHaveBeenCalledTimes(2);
      expect(sut.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe("when authorization fails", () => {
    it("should deny without executing the effect when the evaluator denies access", async () => {
      const { sut, authorizationService } = makeSut();
      authorizationService.decision = makeAuthorizationDecision({
        decision: AUTHORIZATION_DECISION.DENY,
        denialCode: "foreign-scope",
      });
      const execution = sut.execute(
        makeResourceContext(),
        makeAuthenticatedIdentity(),
        "tenant-01",
      );

      await expect(execution).rejects.toMatchObject({
        name: ContextualAuthorizationDeniedError.name,
        message: "The requested operation is not permitted.",
      });
      await expect(execution).rejects.not.toHaveProperty("denialCode");
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should require obligations without executing the effect", async () => {
      const { sut, authorizationService } = makeSut();
      const obligations = [
        { code: "signature" as const, parameters: { versionId: "hmi-contract-v3" } },
        { code: "second-approver" as const, parameters: { role: "quality-approver" } },
      ];
      authorizationService.decision = makeAuthorizationDecision({
        decision: AUTHORIZATION_DECISION.CONFIRMATION_REQUIRED,
        obligations,
      });

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toMatchObject(
        new AuthorizationObligationRequiredError(obligations),
      );
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should not enumerate a tenant without an active subject", async () => {
      const { sut, subjectResolver, authorizationService } = makeSut();
      subjectResolver.subject = null;
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-foreign"),
      ).rejects.toThrow("The requested operation is not permitted.");
      expect(authorizeSpy).not.toHaveBeenCalled();
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should not resolve a resource context after the selected tenant cannot resolve a subject", async () => {
      const { sut, subjectResolver, authorizationService } = makeSut();
      subjectResolver.subject = null;
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-foreign"),
      ).rejects.toBeInstanceOf(ContextualAuthorizationDeniedError);

      expect(sut.resolveContext).not.toHaveBeenCalled();
      expect(authorizeSpy).not.toHaveBeenCalled();
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should deny when subject resolution crosses the selected tenant", async () => {
      const { sut, subjectResolver, authorizationService } = makeSut();
      subjectResolver.subject = makeAuthorizationSubject({ tenantId: "tenant-foreign" });
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toThrow("The requested operation is not permitted.");
      expect(authorizeSpy).not.toHaveBeenCalled();
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should not enumerate a resource resolved from another tenant", async () => {
      const { sut, authorizationService } = makeSut();
      sut.context = makeContextualAuthorizationContext({
        resource: makeResourceContext({ tenantId: "tenant-foreign" }),
      });
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toThrow("The requested operation is not permitted.");
      expect(authorizeSpy).not.toHaveBeenCalled();
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should fail closed for an unrecognized evaluator decision", async () => {
      const { sut, authorizationService } = makeSut();
      authorizationService.decision = makeAuthorizationDecision({
        decision: "unrecognized-decision" as never,
        denialCode: "unexpected-evaluator-payload",
      });
      const execution = sut.execute(
        makeResourceContext(),
        makeAuthenticatedIdentity(),
        "tenant-01",
      );

      await expect(execution).rejects.toMatchObject({
        name: ContextualAuthorizationDeniedError.name,
        message: "The requested operation is not permitted.",
      });
      await expect(execution).rejects.not.toHaveProperty("denialCode");

      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should not execute the effect when resolving the trusted resource context fails", async () => {
      const { sut, authorizationService } = makeSut();
      const resolutionError = new Error("Tenant-scoped resource was unavailable.");
      sut.resolveContext.mockRejectedValueOnce(resolutionError);
      const authorizeSpy = vi.spyOn(authorizationService, "authorize");

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toThrow(resolutionError);

      expect(authorizeSpy).not.toHaveBeenCalled();
      expect(sut.handle).not.toHaveBeenCalled();
    });

    it("should not execute the effect when the evaluator is unavailable", async () => {
      const { sut, authorizationService } = makeSut();
      const evaluatorError = new Error("Authorization evaluator was unavailable.");
      vi.spyOn(authorizationService, "authorize").mockRejectedValueOnce(evaluatorError);

      await expect(
        sut.execute(makeResourceContext(), makeAuthenticatedIdentity(), "tenant-01"),
      ).rejects.toThrow(evaluatorError);

      expect(sut.handle).not.toHaveBeenCalled();
    });
  });
});
