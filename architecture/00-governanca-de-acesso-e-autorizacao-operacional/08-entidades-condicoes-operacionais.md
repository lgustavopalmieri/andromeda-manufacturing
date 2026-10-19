# Módulos `competency`, `work-schedule` e `asset-assignment` — entidades, regras e features

## Papel no requisito

São módulos secundários e deliberadamente simples: provam condições operacionais para uma ação sobre ativo. Nenhum cria permissão, substitui grant ou autoriza um recurso fora de escopo.

**Fontes:** [produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [produto 05, “Regra especial para atuar sobre um ativo”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [produto 09, “Regra de decisão e ativação”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) e [produto 10, critérios 2, 3 e 7](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `CompetencyEvidence` | Evidência de treinamento/certificação aplicável ao membro. | `record-evidence`, `validate-evidence`, `revoke-evidence` |
| `ShiftTemplate` | Regra local de turno por site. | `define-shift` |
| `ShiftOccurrence` | Instante materializado de turno usado pela decisão. | `materialize-occurrence` |
| `AssetAssignment` | Designação temporária de pessoa para alvo de ativo e propósito. | `assign-asset`, `suspend-assignment`, `end-assignment` |

`AssetAssignmentTarget` representa lista nominada **ou** classe aprovada dentro de um recorte físico; o tipo impede tratar ambos como acesso amplo.

## Contratos `entity/`

Os aliases ficam em arquivos irmãos de `entity/`; a `application` converte identificadores vindos de outros módulos, sem import de `@shared` neste núcleo.

```ts
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;

export const COMPETENCY_STATUS = { PENDING: "pending", VALID: "valid", EXPIRED: "expired", REVOKED: "revoked" } as const;
export type CompetencyStatus = (typeof COMPETENCY_STATUS)[keyof typeof COMPETENCY_STATUS];
export interface CompetencyEvidenceEntityInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; competencyCode: string; status: CompetencyStatus;
  validatedByMemberId: TenantMemberId; sourceReference: string; validFrom: Date; validUntil?: Date; revokedAt?: Date;
}
export interface ShiftTemplateEntityInterface {
  id: string; tenantId: TenantId; siteNodeId: TopologyNodeId; code: string;
  localStartTime: string; localEndTime: string; timeZone: string; operationalDatePolicy: "start-date" | "end-date";
  activeFrom: Date; activeUntil?: Date;
}
export interface ShiftOccurrenceEntityInterface {
  id: string; tenantId: TenantId; shiftTemplateId: string; siteNodeId: TopologyNodeId; operationalDate: string;
  startedAt: Date; endedAt: Date; plannedDurationMinutes: number; actualDurationMinutes: number;
}

export const ASSET_ASSIGNMENT_PURPOSE = { OPERATE: "operate", SETUP: "setup", MAINTAIN: "maintain", INSPECT: "inspect", SUPERVISE: "supervise" } as const;
export type AssetAssignmentPurpose = (typeof ASSET_ASSIGNMENT_PURPOSE)[keyof typeof ASSET_ASSIGNMENT_PURPOSE];
export const ASSET_ASSIGNMENT_STATUS = { SCHEDULED: "scheduled", ACTIVE: "active", SUSPENDED: "suspended", ENDED: "ended" } as const;
export type AssetAssignmentStatus = (typeof ASSET_ASSIGNMENT_STATUS)[keyof typeof ASSET_ASSIGNMENT_STATUS];
export type AssetAssignmentTargetInterface =
  | { kind: "named-assets"; assetNodeIds: readonly TopologyNodeId[] }
  | { kind: "asset-class"; assetClass: string; topologyScopeNodeIds: readonly TopologyNodeId[] };
export interface AssetAssignmentEntityInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; target: AssetAssignmentTargetInterface;
  shiftTemplateId?: string; purpose: AssetAssignmentPurpose; status: AssetAssignmentStatus;
  validFrom: Date; validUntil?: Date; assignedByMemberId: TenantMemberId; reason: string; createdAt: Date; endedAt?: Date;
}
```

## Regras implementáveis

- `evaluate-access` exige grant, escopo e operação primeiro; depois exige competência, turno e/ou designação somente quando política ou perfil do ativo determinar. Estas evidências nunca suprem permissão ausente ([produto 05, “Regra especial”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
- `validate-evidence` só satisfaz código de competência quando status é `VALID` no instante da ação. Suspensão, revogação e vencimento negam o próximo ato, sem apagar sua autoria anterior ([produto 10, critério 7](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md)).
- `materialize-occurrence` resolve turno pelo instante e fuso do site, nunca pelo relógio do navegador. `ShiftTemplate` e ocorrência devem pertencer ao mesmo tenant/site do recurso ([produto 02, condição 5](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `assign-asset` requer alvo não vazio: lista só cobre IDs declarados; classe só cobre ativos cuja classe e recorte físico coincidem. Ação real ainda precisa passar pelo grant e pelo escopo do recurso ([produto 05, “Regra especial”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
- Propósito precisa ser compatível com a operação; trocar classe, criticidade, local ou competência do ativo agenda revisão de designações. Líder pode designar trabalho já autorizado, mas não concede papel ([produto 09, “Verbos diferentes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md)).
