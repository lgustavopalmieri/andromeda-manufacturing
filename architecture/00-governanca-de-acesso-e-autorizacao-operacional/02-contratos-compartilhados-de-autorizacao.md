# Shared authorization contracts

> This is the spec for `modules/@shared/access/`: language modules must exchange, not a business rule. Roles, scopes, SoD, and conditions belong to `access-governance` and owning features, according to [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) and [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md).

## Why this contract exists

HTTP, HMI, integration, and agent must ask the same question: “can this member perform this operation on this resource now?”. `@shared/access` is shared because more than two modules will use it; it must not receive ORM entities, tenant rules, or a specific permission catalog; consuming entities are in [03](03-entidades-tenant.md) through [10](10-entidades-auditoria.md).

| Contract | Producer | Consumer | Rule preserved |
|---|---|---|---|
| `AuthenticatedIdentityInterface` | Keycloak adapter at the edge | feature resolving the member | The token proves who authenticated, not effective power. |
| `AuthorizationSubjectInterface` | `identity` + `membership` | evaluator and protected feature | Subject is tenant-local; it does not come from the request body. |
| `ResourceContextInterface` | resource-owning module | contextual evaluator | Location/asset/version/state come from trusted, tenant-filtered data. |
| `AuthorizationRequestInterface` | feature application | `ContextualAuthorizationService` | Operation is explicit and temporal context is correlatable. |
| `AuthorizationDecisionInterface` | `access-governance` | application + `audit-trail` | Permit, deny, or require an obligation before the effect. |

## Proposed TypeScript contract

```ts
export type TenantId = string;
export type IdentityId = string;
export type TenantMemberId = string;
export type ResourceId = string;
export type TopologyNodeId = string;
export type PermissionCode = string;
export type OperationCode = PermissionCode;
export const IDENTITY_KIND = { HUMAN: "human", SERVICE: "service", DEVICE: "device", AGENT: "agent" } as const;
export type IdentityKind = (typeof IDENTITY_KIND)[keyof typeof IDENTITY_KIND];
export interface AuthenticatedIdentityInterface {
  providerSubjectId: string;
  authenticatedAt: Date;
  authenticationMethod?: string;
}
export interface AuthorizationSubjectInterface {
  identityId: IdentityId;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  kind: IdentityKind;
}
export interface ResourceContextInterface {
  tenantId: TenantId;
  resourceType: string;
  resourceId: ResourceId;
  topologyNodeIds: readonly TopologyNodeId[];
  functionalObjectRefs: readonly string[];
  lifecycleState?: string;
  versionId?: string;
  assetId?: TopologyNodeId;
  productFamilyId?: string;
  hmiActionCode?: string;
}
export interface AuthorizationHistoryFactInterface {
  operation: OperationCode;
  effectiveIdentityId: IdentityId;
  versionId?: string;
}
export interface AuthorizationRequestInterface {
  subject: AuthorizationSubjectInterface;
  operation: OperationCode;
  resource: ResourceContextInterface;
  history: readonly AuthorizationHistoryFactInterface[];
  occurredAt: Date;
  correlationId: string;
  reason?: string;
}
export const AUTHORIZATION_DECISION = { PERMIT: "permit", DENY: "deny", CONFIRMATION_REQUIRED: "confirmation_required" } as const;
export type AuthorizationDecision = (typeof AUTHORIZATION_DECISION)[keyof typeof AUTHORIZATION_DECISION];
export interface AuthorizationObligationInterface {
  code: "audit" | "reason" | "human-confirmation" | "signature" | "second-approver"; parameters?: Readonly<Record<string, string>>;
}
export interface AuthorizationDecisionInterface {
  decision: AuthorizationDecision;
  denialCode?: string;
  grantIds: readonly string[];
  policyRevisionId: string;
  obligations: readonly AuthorizationObligationInterface[];
}
export interface ContextualAuthorizationServiceInterface { authorize(request: AuthorizationRequestInterface): Promise<AuthorizationDecisionInterface>; }
export interface ContextualAuthorizedUsecaseInterface<TInput, TOutput> {
  execute(input: TInput, identity: AuthenticatedIdentityInterface, tenantId: TenantId): Promise<TOutput>;
}
```

## Required semantics of fields

- `providerSubjectId` is resolved from the token; `identityId` and `tenantMemberId` are resolved in the backend after tenant selection. A caller cannot choose another person’s member.
- `operation` uses a business code from the catalog, never an HTTP verb; `view`, `export`, `approve`, and `publish` remain distinct as required by [P04](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md).
- `topologyNodeIds` and `history` come from the owning module: facts bring operation, effective actor, and version for SoD; the client does not supply scope, state, or authorship to gain access.
- `grantIds` explains the decision for audit; it is not a list the client can reuse. A `DENY` decision does not reveal which foreign resource, grant, or condition caused the refusal.
- `obligations` turns conditional permission into a flow: until signature, human confirmation, or a second approver is completed, the feature does not execute the effect and re-evaluates on completion.

## Usage rule for a protected feature

1. The adapter authenticates and delivers `AuthenticatedIdentityInterface`; it does not authorize by JWT role.
2. The application receives the route/header-selected tenant, validates affiliation, and resolves `AuthorizationSubjectInterface`; `request-onboarding` is the only public pre-tenant feature.
3. The resource module builds `ResourceContextInterface` and `history`; the application calls `authorize` before the effect.
4. Only `PERMIT` allows the transaction. `CONFIRMATION_REQUIRED` starts an obligation flow; `DENY` does not touch the effect.
5. The feature persists the effect and `AuditEvent` in the same transaction, as detailed in [11](11-modelo-de-decisao-contextual.md) and [13](13-consistencia-persistencia-e-validacao.md).

The static-role-based `AuthorizedUsecase` can protect technical endpoints without a resource, but it is not the final product decision. A feature uses `ContextualAuthorizedUsecaseInterface.execute(input, identity, tenantId)` in application; `tenantId` has already been validated by the adapter because [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) requires current scope, state, and conditions.
