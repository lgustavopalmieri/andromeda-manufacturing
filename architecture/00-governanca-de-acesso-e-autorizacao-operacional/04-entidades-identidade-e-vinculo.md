# Módulos `identity` e `membership` — entidades, regras e features

## Papel no requisito

`Identity` responde **quem** autenticou; `TenantMember` responde **em qual tenant** aquela identidade tem vínculo. Somente o membro ativo pode receber concessão, portanto identidade ou convite nunca são sinônimos de acesso.

**Fontes:** [produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [produto 07, “Tipos de identidade”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md), [produto 09, “Verbos diferentes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) e [produto 10, critérios 1, 8 e 10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `Identity` | Sujeito individual humano, serviço, dispositivo ou agente resolvido pelo provedor. | `resolve-identity` |
| `Credential` | Referência, escopo e ciclo de vida da credencial externa, sem seu segredo. | `resolve-identity`, `issue/rotate/revoke/review-credential` |
| `CredentialUsage` | Evidência de cada uso ou recusa de credencial, ligada à trilha de auditoria. | `resolve-identity`, `audit-trail/record-event` |
| `TenantMember` | Vínculo, fonte de afiliação, patrocinador e vigência dentro de um tenant. | `register-member`, `suspend-member`, `revoke-member` |
| `MembershipAffiliation` | Histórico da fonte, gestor e período de emprego, contrato ou parceria do membro. | `record-affiliation`, `change-affiliation`, `end-affiliation` |
| `MemberInvitation` | Meio rastreável de aceite do vínculo, não uma concessão. | `invite-member`, `accept-invitation` |

## Contratos `entity/`

Os aliases são locais a `entity/`; a `application` traduz o sujeito autenticado e códigos do catálogo. Assim este núcleo não importa `@shared`, Keycloak ou outro módulo.

```ts
export type IdentityId = string;
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;
export type CredentialOperationCode = string;
export type IdentityKind = "human" | "service" | "device" | "agent";

export const IDENTITY_STATUS = { PENDING: "pending", ACTIVE: "active", SUSPENDED: "suspended", REVOKED: "revoked" } as const;
export type IdentityStatus = (typeof IDENTITY_STATUS)[keyof typeof IDENTITY_STATUS];
export interface IdentityEntityInterface {
  id: IdentityId; kind: IdentityKind; status: IdentityStatus; providerSubjectId?: string;
  displayName: string; verifiedEmail?: string; homeTenantId?: TenantId;
  createdAt: Date; suspendedAt?: Date; updatedAt: Date;
}

export const CREDENTIAL_STATUS = { ACTIVE: "active", ROTATED: "rotated", REVOKED: "revoked", EXPIRED: "expired" } as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUS)[keyof typeof CREDENTIAL_STATUS];
export interface CredentialScopeInterface {
  operationCodes: readonly CredentialOperationCode[]; topologyNodeIds: readonly TopologyNodeId[];
  functionalObjectReferences: readonly string[];
}
export interface CredentialEntityInterface {
  id: string; identityId: IdentityId; ownerTenantId: TenantId;
  credentialType: "oidc-client" | "device-certificate" | "api-key-reference";
  externalSecretReference: string; fingerprint?: string; scopes: readonly CredentialScopeInterface[];
  status: CredentialStatus; issuedAt: Date; validFrom: Date; expiresAt?: Date; rotationDueAt?: Date; reviewDueAt?: Date;
  rotatedAt?: Date; revokedAt?: Date;
}
export interface CredentialUsageEntityInterface {
  id: string; tenantId: TenantId; credentialId: string; identityId: IdentityId;
  occurredAt: Date; outcome: "accepted" | "rejected"; operationCode?: CredentialOperationCode; resourceReference?: string; correlationId: string;
  auditEventId?: string;
}

export const MEMBER_STATUS = {
  PENDING_INVITATION: "pending_invitation", PENDING_START: "pending_start", ACTIVE: "active",
  SUSPENDED: "suspended", REVOKED: "revoked", EXPIRED: "expired",
} as const;
export type TenantMemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];
export interface MembershipAffiliationInterface {
  kind: "employee" | "contractor" | "partner" | "service" | "device" | "agent";
  source: "hris" | "contract" | "manual" | "integration"; sourceReference: string;
  sponsoringMemberId?: TenantMemberId; managerMemberId?: TenantMemberId; validFrom: Date; validUntil?: Date;
}
export const AFFILIATION_STATUS = { ACTIVE: "active", SUPERSEDED: "superseded", ENDED: "ended" } as const;
export type MembershipAffiliationStatus = (typeof AFFILIATION_STATUS)[keyof typeof AFFILIATION_STATUS];
export interface MembershipAffiliationEntityInterface extends MembershipAffiliationInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; status: MembershipAffiliationStatus;
  recordedAt: Date; endedAt?: Date;
}
export interface TenantMemberEntityInterface {
  id: TenantMemberId; tenantId: TenantId; identityId: IdentityId; status: TenantMemberStatus;
  affiliation: MembershipAffiliationInterface; acceptedAt?: Date; suspendedAt?: Date; revokedAt?: Date;
  createdAt: Date; updatedAt: Date;
}
export interface MemberInvitationEntityInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; providerInvitationReference: string;
  sentByMemberId?: TenantMemberId; expiresAt: Date; acceptedAt?: Date; revokedAt?: Date;
}
```

## Regras implementáveis

- `resolve-identity` associa o sujeito autenticado ao `providerSubjectId`, mas só identidade ativa, `TenantMember` ativo e tenant selecionado passam a primeira condição de autorização ([produto 02, condições 1–3](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `record-affiliation`, `change-affiliation` e `end-affiliation` preservam fonte, patrocinador, gestor e vigência; mudança encerra/supera a afiliação anterior e não cria papel nem acesso ([produto 09, “Verbos diferentes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md)).
- Há no máximo uma afiliação `ACTIVE` por membro; o snapshot `TenantMember.affiliation` precisa coincidir com ela. O domínio não ativa membro fora de sua vigência.
- `accept-invitation` habilita identidade e vínculo, mas não ativa grant antes de início, concessão e condições exigidas ([produto 10, critério 1](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md)).
- Suspensão, revogação, expiração de vínculo ou fim de contrato bloqueiam a próxima ação e encerram delegações dependentes, preservando autoria anterior ([produto 10, critérios 8 e 10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md)).
- Identidade humana é individual; não humana tem privilégio mínimo. No MVP, `homeTenantId` é obrigatório para não humanas e impede vínculo em outro tenant ([produto 07, “Tipos de identidade”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
- Credencial guarda apenas referência externa/impressão digital; sua vigência, escopos, rotação, revisão e cada uso são reavaliados e auditados. Seu escopo apenas restringe o grant da identidade, nunca o amplia ([produto 07, “Tipos de identidade”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md)).
