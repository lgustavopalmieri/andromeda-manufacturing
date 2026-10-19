# Contratos compartilhados de autorização

> Esta é a spec de `modules/@shared/access/`: linguagem que módulos precisam trocar, não regra de negócio. Papéis, escopos, SoD e condições pertencem a `access-governance` e às features proprietárias, conforme [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) e [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md).

## Por que este contrato existe

HTTP, HMI, integração e agente precisam formular a mesma pergunta: “este membro pode fazer esta operação neste recurso, agora?”. `@shared/access` é compartilhado porque será usado por mais de dois módulos; não deve receber entidades ORM, regras de tenant ou um catálogo de permissões específico; entidades consumidoras estão em [03](03-entidades-tenant.md) a [10](10-entidades-auditoria.md).

| Contrato | Quem o produz | Quem o usa | Regra que preserva |
|---|---|---|---|
| `AuthenticatedIdentityInterface` | adaptador Keycloak no edge | feature que resolve o membro | Token prova quem autenticou, não poder efetivo. |
| `AuthorizationSubjectInterface` | `identity` + `membership` | avaliador e feature protegida | Sujeito é local ao tenant; não vem do corpo da requisição. |
| `ResourceContextInterface` | módulo dono do recurso | avaliador contextual | Local/ativo/versão/estado são obtidos de dado confiável e tenant-filtrado. |
| `AuthorizationRequestInterface` | application da feature | `ContextualAuthorizationService` | Operação é explícita e contexto temporal é correlacionável. |
| `AuthorizationDecisionInterface` | `access-governance` | application + `audit-trail` | Permitir, negar ou exigir obrigação antes do efeito. |

## Contrato TypeScript proposto

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

## Semântica obrigatória dos campos

- `providerSubjectId` é resolvido pelo token; `identityId` e `tenantMemberId` são resolvidos no backend depois da seleção de tenant. Um chamador não pode escolher o membro de outra pessoa.
- `operation` usa código de negócio do catálogo, nunca verbo HTTP; `consultar`, `exportar`, `aprovar` e `publicar` continuam distintos como exige [P04](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md).
- `topologyNodeIds` e `history` vêm do módulo proprietário: os fatos trazem operação, ator efetivo e versão para SoD; o cliente não informa escopo, estado ou autoria para conquistar acesso.
- `grantIds` explica a decisão para auditoria; não é uma lista para o cliente reutilizar. Uma decisão `DENY` não revela qual recurso, concessão ou condição estrangeira causou a recusa.
- `obligations` transforma permissão condicional em fluxo: até assinatura, confirmação humana ou segundo aprovador ser concluído, a feature não executa o efeito e reavalia na conclusão.

## Regra de uso por feature protegida

1. O adaptador autentica e entrega `AuthenticatedIdentityInterface`; ele não autoriza por papel JWT.
2. A application recebe tenant selecionado por rota/header, valida o vínculo e resolve `AuthorizationSubjectInterface`; `request-onboarding` é a única feature pública pré-tenant.
3. O módulo do recurso monta `ResourceContextInterface` e `history`; a application chama `authorize` antes do efeito.
4. Apenas `PERMIT` permite a transação. `CONFIRMATION_REQUIRED` inicia fluxo de obrigação; `DENY` não toca o efeito.
5. A feature persiste efeito e `AuditEvent` na mesma transação, como detalhado em [11](11-modelo-de-decisao-contextual.md) e [13](13-consistencia-persistencia-e-validacao.md).

O `AuthorizedUsecase` baseado em roles estáticos pode proteger endpoints técnicos sem recurso, mas não é a decisão final de produto. Uma feature usa `ContextualAuthorizedUsecaseInterface.execute(input, identity, tenantId)` na application; o `tenantId` já foi validado no adaptador, pois [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) exige escopo, estado e condições atuais.
