# Módulo `access-governance` — catálogo, papéis e política

## Papel no requisito

Este trecho define o vocabulário de operações e as regras versionadas da decisão contextual. Papel agrupa permissões; ele só produz acesso quando uma concessão contextual o referencia, tratada em [06](06-entidades-pedidos-concessoes-e-escopos.md).

**Fontes:** [produto 01, “Linguagem obrigatória”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/01-personas-papeis-e-responsabilidades.md), [produto 02, “Regras estruturantes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [produto 04](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md) e [produto 06, “Segregação mínima”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `PermissionDefinition` | Catálogo global e explícito de operação, recurso e criticidade. | `bootstrap-catalog` |
| `RoleDefinition` | Papel administrável tenant-local, sem escopo ou poder por si só. | `bootstrap-catalog`, `define-role` |
| `RoleRevision` | Snapshot imutável das permissões de um papel para concessões auditáveis. | `publish-role-revision` |
| `AccessPolicyRevision` | Política tenant-local de SoD, condições, prazo e revisão. | `bootstrap-catalog`, `publish-access-policy`, `evaluate-access` |

## Contratos `entity/`

Os aliases pertencem a arquivos irmãos de `entity/`; interfaces de `application` adaptam os contratos compartilhados, preservando este módulo sem import externo.

```ts
export type PermissionCode = string;
export type TenantId = string;
export type TenantMemberId = string;

export interface PermissionDefinitionEntityInterface {
  code: PermissionCode; domain: string; action: string; resourceTypes: readonly string[];
  delegable: boolean; sensitive: boolean; operational: boolean;
}

export const ROLE_STATUS = { DRAFT: "draft", PUBLISHED: "published", RETIRED: "retired" } as const;
export type RoleStatus = (typeof ROLE_STATUS)[keyof typeof ROLE_STATUS];
export interface RoleDefinitionEntityInterface {
  id: string; tenantId: TenantId; code: string; displayName: string;
  origin: "base-template" | "tenant-custom"; currentPublishedRevisionId?: string;
  createdByMemberId: TenantMemberId; createdAt: Date; retiredAt?: Date;
}
export interface RoleRevisionEntityInterface {
  id: string; tenantId: TenantId; roleDefinitionId: string; version: number; status: RoleStatus;
  permissionCodes: readonly PermissionCode[]; changeReason: string; authoredByMemberId: TenantMemberId;
  reviewedByMemberId?: TenantMemberId; publishedAt?: Date; retiredAt?: Date;
}

export const POLICY_REVISION_STATUS = { DRAFT: "draft", EFFECTIVE: "effective", SUPERSEDED: "superseded" } as const;
export type PolicyRevisionStatus = (typeof POLICY_REVISION_STATUS)[keyof typeof POLICY_REVISION_STATUS];
export interface SegregationRuleInterface {
  id: string; leftOperationCodes: readonly PermissionCode[]; rightOperationCodes: readonly PermissionCode[];
  resourceTypes: readonly string[]; requiresDistinctIdentity: boolean; requiresSecondApproval: boolean;
}
export interface OperationConditionRuleInterface {
  operationCodes: readonly PermissionCode[]; requiresCompetency: boolean; requiresAssetAssignment: boolean;
  requiresReason: boolean; requiresHumanConfirmation: boolean;
}
export interface AccessPolicyRevisionEntityInterface {
  id: string; tenantId: TenantId; version: number; status: PolicyRevisionStatus;
  segregationRules: readonly SegregationRuleInterface[]; operationConditionRules: readonly OperationConditionRuleInterface[];
  directGrantMaximumDurationHours: number; emergencyAccessMaximumDurationHours: number; reviewIntervalDays: number;
  effectiveFrom?: Date; authoredByMemberId: TenantMemberId; publishedByMemberId?: TenantMemberId; createdAt: Date;
}
```

## Regras implementáveis

- `bootstrap-catalog` cria somente catálogo de produto e cópias tenant-locais dos papéis-base/política neutra; permissão é operação exata, e consultar não implica exportar ou operar ([produto 04, “Convenção de operações”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md)).
- `define-role` gera rascunho; `publish-role-revision` exige revisão distinta para mudança crítica e nunca altera revisão publicada. Mudança cria nova versão e migração explícita de grants ([produto 02, “Regras estruturantes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `evaluate-access` lê apenas revisão `PUBLISHED`/`EFFECTIVE`; papel não fornece escopo, condição ou exceção sozinho ([produto 01, “Linguagem obrigatória”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/01-personas-papeis-e-responsabilidades.md)).
- `SegregationRule` compara identidade efetiva no mesmo objeto/versão; dois papéis ou telas não resolvem conflito. `OperationConditionRule` impõe competência, designação, motivo ou confirmação quando configurado ([produto 06, “Segregação mínima”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md)).
