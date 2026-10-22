import type {
  AuthenticatedIdentityInterface,
  AuthorizationDecisionInterface,
  AuthorizationHistoryFactInterface,
  AuthorizationRequestInterface,
  AuthorizationSubjectInterface,
  OperationCode,
  ResourceContextInterface,
  TenantId,
} from "./access.types.js";

export interface ContextualAuthorizationServiceInterface {
  authorize(request: AuthorizationRequestInterface): Promise<AuthorizationDecisionInterface>;
}

export interface AuthorizationSubjectResolverInterface {
  resolve(
    identity: AuthenticatedIdentityInterface,
    tenantId: TenantId,
  ): Promise<AuthorizationSubjectInterface | null>;
}

export interface ContextualAuthorizationContextInterface {
  operation: OperationCode;
  resource: ResourceContextInterface;
  history: readonly AuthorizationHistoryFactInterface[];
  occurredAt: Date;
  correlationId: string;
  reason?: string;
}

export interface ContextualAuthorizedUsecaseInterface<TInput, TOutput> {
  execute(
    input: TInput,
    identity: AuthenticatedIdentityInterface,
    tenantId: TenantId,
  ): Promise<TOutput>;
}
