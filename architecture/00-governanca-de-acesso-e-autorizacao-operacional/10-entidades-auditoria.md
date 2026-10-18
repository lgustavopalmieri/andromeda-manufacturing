# Entidades TypeScript — módulo `audit-trail`

Auditoria registra decisão e autoria efetiva. O módulo não é um log de aplicação mutável: expõe
consulta autorizada e recebe somente inclusão transacional para atos relevantes.

```ts
import type { IdentityId, PermissionCode, ResourceId, TenantId, TenantMemberId } from "@shared/access/authorization.types";

export const AUDIT_DECISION = {
  PERMITTED: "permitted", DENIED: "denied", FAILED: "failed", CHANGED: "changed",
} as const;
export type AuditDecision = (typeof AUDIT_DECISION)[keyof typeof AUDIT_DECISION];

export interface AuditActorInterface {
  identityId: IdentityId;
  tenantMemberId?: TenantMemberId;
  identityKind: "human" | "service" | "device" | "agent";
}

export interface AuditResourceInterface {
  resourceType: string;
  resourceId: ResourceId;
  topologyNodeIds: readonly string[];
  versionId?: string;
}

export interface AuditEventEntityInterface {
  id: string;
  tenantId: TenantId;
  occurredAt: Date;
  operationCode: PermissionCode;
  decision: AuditDecision;
  effectiveActor: AuditActorInterface;
  sponsoringActor?: AuditActorInterface;
  resource: AuditResourceInterface;
  correlationId: string;
  causationId?: string;
  accessGrantIds: readonly string[];
  policyRevisionId?: string;
  delegationId?: string;
  emergencyAccessId?: string;
  reason?: string;
  denialCode?: string;
  beforeDigest?: string;
  afterDigest?: string;
  resultReference?: string;
  origin: "http" | "hmi" | "integration" | "agent" | "worker";
}
```

O evento guarda identidade que executou, não a do delegante em seu lugar. Para ação de agente,
`effectiveActor` é o agente e `sponsoringActor` identifica humano patrocinador. O conteúdo bruto
permanece no módulo proprietário; os digests/referências evitam replicar dado sensível no trilho.
Tentativas negadas relevantes e qualquer ato sensível entram na mesma trilha, com retenção e acesso
protegidos pelo avaliador contextual.
