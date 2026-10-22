import { AUTHORIZATION_DECISION } from "./access.types.js";
import type {
  AuthenticatedIdentityInterface,
  AuthorizationDecisionInterface,
  AuthorizationRequestInterface,
  AuthorizationSubjectInterface,
  TenantId,
} from "./access.types.js";
import {
  AuthorizationObligationRequiredError,
  ContextualAuthorizationDeniedError,
} from "./errors.js";
import type {
  AuthorizationSubjectResolverInterface,
  ContextualAuthorizationContextInterface,
  ContextualAuthorizationServiceInterface,
  ContextualAuthorizedUsecaseInterface,
} from "./interfaces.js";

export abstract class ContextualAuthorizedUsecase<TInput, TOutput>
  implements ContextualAuthorizedUsecaseInterface<TInput, TOutput>
{
  public constructor(
    private readonly subjectResolver: AuthorizationSubjectResolverInterface,
    private readonly authorizationService: ContextualAuthorizationServiceInterface,
  ) {}

  public async execute(
    input: TInput,
    identity: AuthenticatedIdentityInterface,
    tenantId: TenantId,
  ): Promise<TOutput> {
    const subject = await this.subjectResolver.resolve(identity, tenantId);

    if (!subject || subject.tenantId !== tenantId) {
      throw new ContextualAuthorizationDeniedError();
    }

    const context = await this.resolveAuthorizationContext(input, subject);

    if (context.resource.tenantId !== tenantId) {
      throw new ContextualAuthorizationDeniedError();
    }

    const decision = await this.authorizationService.authorize(
      this.createAuthorizationRequest(subject, context),
    );

    this.assertPermitted(decision);
    return await this.handle(input);
  }

  protected abstract resolveAuthorizationContext(
    input: TInput,
    subject: AuthorizationSubjectInterface,
  ): Promise<ContextualAuthorizationContextInterface>;

  protected abstract handle(input: TInput): Promise<TOutput>;

  private createAuthorizationRequest(
    subject: AuthorizationSubjectInterface,
    context: ContextualAuthorizationContextInterface,
  ): AuthorizationRequestInterface {
    return {
      subject,
      operation: context.operation,
      resource: context.resource,
      history: context.history,
      occurredAt: context.occurredAt,
      correlationId: context.correlationId,
      ...(context.reason === undefined ? {} : { reason: context.reason }),
    };
  }

  private assertPermitted(decision: AuthorizationDecisionInterface): void {
    if (decision.decision === AUTHORIZATION_DECISION.PERMIT) return;

    if (decision.decision === AUTHORIZATION_DECISION.CONFIRMATION_REQUIRED) {
      throw new AuthorizationObligationRequiredError(decision.obligations);
    }

    throw new ContextualAuthorizationDeniedError();
  }
}
