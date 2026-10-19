# Módulo `audit-trail` — entidades, regras e features

## Papel no requisito

`audit-trail` é a evidência imutável de decisão, autoria e efeito. Não é log técnico mutável nem concede visibilidade: consulta e exportação também passam pela autorização contextual.

**Fontes:** [produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [produto 06, “Atos especialmente sensíveis”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md), [produto 07, “Auditoria e revisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) e [produto 08, cenários 10–15](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md).

## Entidade e features

| Entidade | Responsabilidade no requisito | Features que a criam ou consultam |
|---|---|---|
| `AuditEvent` | Registro append-only de decisão, mudança ou ato relevante no contexto em que ocorreu. | `record-event`, `list-events`, `export-events` |

`AuditActor` identifica autoria efetiva/patrocinadora; `AuditResource` fixa recurso, escopo topológico e versão sem duplicar seu conteúdo sensível.

## Contratos `entity/`

Aliases pertencem a arquivos irmãos de `entity/`; `application` mapeia o contexto compartilhado e IDs externos antes de gravar o evento. Não há import de `@shared` aqui.

```ts
export type IdentityId = string;
export type PermissionCode = string;
export type ResourceId = string;
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;

export const AUDIT_DECISION = { PERMITTED: "permitted", DENIED: "denied", FAILED: "failed", CHANGED: "changed" } as const;
export type AuditDecision = (typeof AUDIT_DECISION)[keyof typeof AUDIT_DECISION];
export interface AuditActorInterface {
  identityId: IdentityId; tenantMemberId?: TenantMemberId; identityKind: "human" | "service" | "device" | "agent";
}
export interface AuditResourceInterface {
  resourceType: string; resourceId: ResourceId; topologyNodeIds: readonly TopologyNodeId[]; functionalObjectRefs: readonly string[];
  assetId?: TopologyNodeId; lifecycleState?: string; versionId?: string;
}
export interface AuditEventEntityInterface {
  id: string; tenantId: TenantId; occurredAt: Date; operationCode: PermissionCode; decision: AuditDecision;
  effectiveActor: AuditActorInterface; sponsoringActor?: AuditActorInterface; resource: AuditResourceInterface;
  correlationId: string; causationId?: string; accessGrantIds: readonly string[]; policyRevisionId?: string;
  delegationId?: string; emergencyAccessId?: string; credentialId?: string; reason?: string; denialCode?: string;
  beforeDigest?: string; afterDigest?: string; resultReference?: string; origin: "http" | "hmi" | "integration" | "agent" | "worker";
}
```

## Regras implementáveis

- `record-event` é chamado para criação/ativação/suspensão de tenant, convite/aceite, papel, escopo, competência, designação, delegação, exceção, integração, credencial, ação HMI e negação relevante ([produto 07, “Auditoria e revisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Em ação permitida, efeito de negócio, `AuditEvent` e outbox são gravados na mesma transação local; em negação relevante, a decisão é registrada sem revelar recurso estrangeiro ([produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- Evento é somente inserido: aplicativo não atualiza ou apaga. Retenção/WORM físico pode evoluir, mas não muda esta invariável ([produto 07, “Auditoria e revisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- `AuditResource` captura a topologia, ref funcional, ativo, estado e versão vigentes no ato; consulta histórica não recalcula esse contexto depois de mover ativo. `effectiveActor` é quem executou; em ato de agente, `sponsoringActor` identifica humano patrocinador sem falsificar autoria ([produto 02, “Escopo e herança”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `delegationId`, `emergencyAccessId` e `credentialId` explicam a fonte usada; `CredentialUsage` pode apontar para este evento. Ação de agente registra delegação e patrocinador ([produto 07, “Tipos de identidade”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Nunca gravar segredo, token ou conteúdo bruto sensível: `beforeDigest`, `afterDigest` e referências preservam integridade e permitem buscar o módulo proprietário. `list-events`/`export-events` filtram `tenantId` e escopo do auditor ([produto 07, “Auditoria e revisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
