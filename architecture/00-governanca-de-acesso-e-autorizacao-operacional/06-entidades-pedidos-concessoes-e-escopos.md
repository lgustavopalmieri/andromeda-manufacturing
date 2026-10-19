# Módulo `access-governance` — pedidos, concessões e escopos

## Papel no requisito

Este trecho materializa a atribuição contextual: une membro, permissões/papel, escopo, vigência, restrições e decisão. `AccessGrant` é a única autoridade ordinária efetiva; `AccessRequest` apenas expressa necessidade aprovada ou recusada.

**Fontes:** [produto 02, “Decisão de acesso” e “Escopo e herança”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [produto 05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [produto 06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) e [produto 09, “Regra de decisão e ativação”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `AccessRequest` | Necessidade patrocinada, ainda sem poder de agir. | `propose-access`, `decide-access-request` |
| `AccessGrant` | Atribuição efetiva, com papel/permissão, limites e ciclo de vida. | `grant-access`, `suspend-grant`, `revoke-grant`, `evaluate-access` |
| `AccessReviewTask` | Revisão periódica de concessão privilegiada, ativa ou próxima do fim. | `review-grants` |

`ScopeSelector` ancora o alcance físico/funcional; `GrantConstraints` adiciona turno, produto, ativo, ação HMI e competência sem criar permissão nova.

## Contratos `entity/`

Os aliases pertencem a arquivos irmãos de `entity/`; a entrada/saída compartilhada é adaptada em `application`, sem importar `@shared` neste núcleo.

```ts
export type PermissionCode = string;
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;

export interface ScopeSelectorInterface {
  anchorKind: "tenant" | "topology-node" | "functional-object";
  anchorReference: TenantId | TopologyNodeId | string;
  includesDescendants: boolean;
  excludedTopologyNodeIds: readonly TopologyNodeId[];
}
export interface GrantConstraintsInterface {
  shiftTemplateIds: readonly string[]; productFamilyIds: readonly string[]; assetIds: readonly TopologyNodeId[];
  hmiActionCodes: readonly string[]; requiredCompetencyCodes: readonly string[];
}

export const ACCESS_REQUEST_STATUS = { PROPOSED: "proposed", APPROVED: "approved", REJECTED: "rejected", FULFILLED: "fulfilled", CANCELLED: "cancelled" } as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUS)[keyof typeof ACCESS_REQUEST_STATUS];
export interface AccessRequestEntityInterface {
  id: string; tenantId: TenantId; subjectMemberId: TenantMemberId; requestedRoleRevisionId?: string;
  requestedPermissionCodes: readonly PermissionCode[]; scopes: readonly ScopeSelectorInterface[]; constraints: GrantConstraintsInterface;
  validFrom: Date; validUntil?: Date; sponsoredByMemberId: TenantMemberId; approvedByMemberId?: TenantMemberId;
  status: AccessRequestStatus; justification: string; createdAt: Date; decidedAt?: Date;
}

export const ACCESS_GRANT_STATUS = { SCHEDULED: "scheduled", ACTIVE: "active", SUSPENDED: "suspended", EXPIRED: "expired", REVOKED: "revoked" } as const;
export type AccessGrantStatus = (typeof ACCESS_GRANT_STATUS)[keyof typeof ACCESS_GRANT_STATUS];
export interface AccessGrantEntityInterface {
  id: string; tenantId: TenantId; subjectMemberId: TenantMemberId; source: "role-revision" | "direct-exception";
  roleRevisionId?: string; directPermissionCodes: readonly PermissionCode[]; scopes: readonly ScopeSelectorInterface[];
  constraints: GrantConstraintsInterface; delegablePermissionCodes: readonly PermissionCode[]; status: AccessGrantStatus;
  validFrom: Date; validUntil?: Date; nextReviewAt?: Date; grantedByMemberId: TenantMemberId; approvedByMemberId?: TenantMemberId;
  requestId?: string; justification: string; suspendedReason?: string; revokedReason?: string; createdAt: Date; endedAt?: Date;
}

export const ACCESS_REVIEW_STATUS = { PENDING: "pending", CONFIRMED: "confirmed", REDUCED: "reduced", REVOKED: "revoked", OVERDUE: "overdue" } as const;
export type AccessReviewStatus = (typeof ACCESS_REVIEW_STATUS)[keyof typeof ACCESS_REVIEW_STATUS];
export interface AccessReviewTaskEntityInterface {
  id: string; tenantId: TenantId; accessGrantId: string; reviewerMemberId: TenantMemberId;
  dueAt: Date; status: AccessReviewStatus; decisionReason?: string; decidedAt?: Date;
}
```

## Regras implementáveis

- `propose-access` registra patrocinador, motivo, escopo mínimo, vigência e condições; proposta não autoriza. `decide-access-request` aplica autoridade, competência e segregação antes de aprovar ([produto 09, “Regra de decisão e ativação”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md)).
- `grant-access` materializa somente pedido aprovado, em revisão publicada e dentro da autoridade do concedente. `source: "direct-exception"` exige `approvedByMemberId`, justificativa e `validUntil`; o domínio também exige ao menos uma permissão direta e nunca o converte em papel informal ([produto 05, “Administração de atribuições”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
- Para `source: "role-revision"`, `roleRevisionId` é obrigatório e `directPermissionCodes` fica vazio; o inverso vale para exceção. A interface não é união discriminada para preservar evolução, mas a feature rejeita estados mistos ou incompletos.
- `evaluate-access` considera apenas grant ativo, membro/tenant válidos, permissão exata, recurso do mesmo tenant, escopo alcançado e todas as restrições. Ausência ou suspensão prevalece sobre soma de grants ([produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- Escopo nunca amplia acesso: âncora de ativo não revela irmãos; descendentes só contam para topologia atual e exclusões são obrigatórias. Restrição vazia não inventa poder ([produto 05, “Tipos de escopo”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
- Suspensão, revogação, expiração e `review-grants` afetam a próxima ação, preservam fatos anteriores e não admitem renovação silenciosa ([produto 05, “Administração de atribuições”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
