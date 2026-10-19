# Módulos `delegation` e `emergency-access` — entidades, regras e features

## Papel no requisito

São fontes derivadas, temporárias e auditáveis de autoridade. Não alteram `AccessGrant`, não copiam papéis e são reavaliadas junto da fonte em cada ato.

**Fontes:** [produto 06, “Segregação mínima” e “Atos especialmente sensíveis”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md), [produto 07, “Delegação” e “Emergência e exceção”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md), [produto 08, cenários 10, 11 e 15](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) e [produto 10, critério 4](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `Delegation` | Cobertura finita de permissões delegáveis derivadas de um grant fonte. | `create/accept/revoke-delegation` |
| `EmergencyAccess` | Elevação mínima para incidente ou continuidade de governança, com revisão posterior. | `request/authorize/notify/revoke/review-emergency-access` |

`DelegationScopeSelector` e `DelegationConstraints` são shapes locais compatíveis com [06](06-entidades-pedidos-concessoes-e-escopos.md). A `application` os adapta a partir do grant fonte; `entity/` não importa outro módulo.

## Contratos `entity/`

```ts
export type DelegatedPermissionCode = string;
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;
export interface DelegationScopeSelectorInterface {
  anchorKind: "tenant" | "topology-node" | "functional-object";
  anchorReference: TenantId | TopologyNodeId | string;
  includesDescendants: boolean;
  excludedTopologyNodeIds: readonly TopologyNodeId[];
}
export interface DelegationConstraintsInterface {
  shiftTemplateIds: readonly string[]; productFamilyIds: readonly string[]; assetIds: readonly TopologyNodeId[];
  hmiActionCodes: readonly string[]; requiredCompetencyCodes: readonly string[];
}

export const DELEGATION_STATUS = {
  PROPOSED: "proposed", PENDING_ACCEPTANCE: "pending_acceptance", ACTIVE: "active",
  SUSPENDED: "suspended", EXPIRED: "expired", REVOKED: "revoked",
} as const;
export type DelegationStatus = (typeof DELEGATION_STATUS)[keyof typeof DELEGATION_STATUS];
export const DELEGATION_EXECUTION_MODE = {
  PROPOSE_ONLY: "propose_only", HUMAN_CONFIRMATION: "human_confirmation", LOW_RISK_AUTOMATIC: "low_risk_automatic",
} as const;
export type DelegationExecutionMode = (typeof DELEGATION_EXECUTION_MODE)[keyof typeof DELEGATION_EXECUTION_MODE];
export interface DelegationEntityInterface {
  id: string; tenantId: TenantId; sourceAccessGrantId: string; delegatorMemberId: TenantMemberId; delegateMemberId: TenantMemberId;
  permissionCodes: readonly DelegatedPermissionCode[]; scopes: readonly DelegationScopeSelectorInterface[]; constraints: DelegationConstraintsInterface;
  executionMode: DelegationExecutionMode; status: DelegationStatus; requiresAcceptance: boolean; approvedByMemberId?: TenantMemberId;
  justification: string; validFrom: Date; validUntil: Date; acceptedAt?: Date; revokedAt?: Date; createdAt: Date;
}

export const EMERGENCY_ACCESS_STATUS = { REQUESTED: "requested", ACTIVE: "active", EXPIRED: "expired", REVOKED: "revoked", REVIEWED: "reviewed" } as const;
export type EmergencyAccessStatus = (typeof EMERGENCY_ACCESS_STATUS)[keyof typeof EMERGENCY_ACCESS_STATUS];
export interface EmergencyAccessNotificationInterface {
  recipientMemberId: TenantMemberId; purpose: "owner" | "reviewer"; sentAt: Date;
}
export interface EmergencyAccessEntityInterface {
  id: string; tenantId: TenantId; subjectMemberId: TenantMemberId; permissionCodes: readonly DelegatedPermissionCode[];
  scopes: readonly DelegationScopeSelectorInterface[]; constraints: DelegationConstraintsInterface; status: EmergencyAccessStatus;
  requestedByMemberId: TenantMemberId; authorizedByMemberId?: TenantMemberId; reviewerMemberId: TenantMemberId;
  incidentReference: string; justification: string; requestedAt: Date; validFrom: Date; expiresAt: Date;
  notifications: readonly EmergencyAccessNotificationInterface[]; revokedAt?: Date; reviewedAt?: Date; reviewOutcome?: string;
}
```

## Regras implementáveis

- `delegation/create` exige concessão fonte ativa no mesmo tenant e destinatário ativo. Permissões, escopos, restrições e prazo são subconjuntos do grant; cada permissão precisa ser delegável ([produto 07, “Delegação e cobertura temporária”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Se política exigir, `accept` e `approvedByMemberId` precedem `ACTIVE`; perda do grant fonte, competência, vínculo ou condição relevante suspende/encerra a delegação ([produto 07, “Delegação e cobertura temporária”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Owner, transferência de propriedade, política de acesso, credencial, autoaprovação de conflito e atos proibidos pela política não são delegáveis. Líder provisionador só efetiva pacote/range formalmente delegado e nunca concede a si ([produto 10, critério 4](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md)).
- Para agente, `executionMode` é obrigatório: propor, exigir confirmação humana ou executar baixo risco. Agente jamais herda autoridade do patrocinador e o ato registra ambos ([produto 08, cenário 11](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md)).
- `request-emergency-access` cria somente `REQUESTED`; `authorize` exige `authorizedByMemberId`, concede o mínimo com incidente, motivo, revisor, escopo e prazo, e publica a notificação para Owner/revisor. `notify` registra destinatário/instante sem expor dado além do necessário ([produto 07, “Emergência e exceção”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Exceção expira automaticamente, não renova silenciosamente e `review` permanece pendente até conclusão. Ela não ignora segurança física, qualidade, EHS ou segregação ([produto 07, “Emergência e exceção”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
