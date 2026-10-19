# Módulo `tenant` — entidades, regras e features

## Papel no requisito

`tenant` cria a fronteira lógica da conta, mantém seu ciclo de vida e prova que há um Owner responsável. Ele não concede acesso operacional: isso pertence a `access-governance`.

**Fontes:** [produto 00, “Escopo” e “Premissas vinculantes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md), [produto 03, “Onboarding do tenant e Owner”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md) e [produto 08, cenários 1, 2 e 14](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `Tenant` | Conta isolada e estado que permite ou bloqueia sua utilização. | `request-onboarding`, `activate-tenant`, `suspend-tenant` |
| `OwnerAppointment` | Nomeação rastreável de quem responde pela continuidade da conta. | `provision-owner-invitation`, `appoint-owner`, `transfer-owner` |
| `PolicyAcceptance` | Evidência do aceite da política aplicável pelo Owner convidado. | `request-onboarding`, `activate-tenant` |
| `TenantOnboardingRequest` | Pedido idempotente que une dados iniciais, Owner convidado e resultado. | `request-onboarding`, `activate-tenant` |

## Contratos `entity/`

São contratos TypeScript puros: aliases ficam em arquivos irmãos de `entity/`; a `application` adapta contratos compartilhados para esses primitivos. Não há import externo, ORM, Keycloak ou HTTP aqui.

```ts
export type TenantId = string;
export type TenantMemberId = string;
export type IdentityId = string;

export const TENANT_STATUS = {
  CREATING: "creating", PENDING_ACTIVATION: "pending_activation", ACTIVE: "active",
  SUSPENDED: "suspended", CLOSED: "closed",
} as const;
export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
export interface TenantBrandingInterface { displayName?: string; logoAssetId?: string; terminology?: Readonly<Record<string, string>>; }
export interface TenantSettingsInterface {
  countryCode: string; locale: string; timeZone: string; preferredUnitSystem: string;
  branding: TenantBrandingInterface;
  administrativeContactEmails: readonly string[];
}
export interface TenantEntityInterface {
  id: TenantId; status: TenantStatus; organizationName: string; externalOrganizationIdentifier?: string;
  settings: TenantSettingsInterface; activeAccessPolicyRevisionId: string;
  createdAt: Date; activatedAt?: Date; suspendedAt?: Date; closedAt?: Date; updatedAt: Date;
}

export const OWNER_APPOINTMENT_STATUS = {
  INVITED: "invited", ACTIVE: "active", TRANSFERRED: "transferred", REVOKED: "revoked",
} as const;
export type OwnerAppointmentStatus = (typeof OWNER_APPOINTMENT_STATUS)[keyof typeof OWNER_APPOINTMENT_STATUS];
export interface OwnerAppointmentEntityInterface {
  id: string; tenantId: TenantId; tenantMemberId: TenantMemberId; identityId: IdentityId;
  status: OwnerAppointmentStatus; appointedByMemberId?: TenantMemberId; predecessorAppointmentId?: string;
  reason: string; invitedAt: Date; acceptedAt?: Date; endedAt?: Date;
}
export interface PolicyAcceptanceEntityInterface {
  id: string; tenantId: TenantId; identityId: IdentityId; policyVersion: string; acceptedAt: Date;
  evidenceReference?: string;
}

export const ONBOARDING_STATUS = {
  REQUESTED: "requested", PROVISIONING: "provisioning", PENDING_ACTIVATION: "pending_activation",
  ACTIVATED: "activated", REJECTED: "rejected", FAILED: "failed",
} as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];
export interface TenantOnboardingRequestEntityInterface {
  id: string; correlationId: string; status: OnboardingStatus; tenantId?: TenantId;
  organizationName: string; externalOrganizationIdentifier?: string; requestedSettings: TenantSettingsInterface;
  ownerEmail: string; ownerDisplayName: string; ownerLocale: string; policyAcceptanceVersion: string;
  requestedAt: Date; resolvedAt?: Date; refusalReason?: string;
}
```

## Regras implementáveis

- `request-onboarding` trata `correlationId` como único: repetição devolve o mesmo pedido, sem criar segundo tenant, Owner ou convite ([produto 03, “Dados mínimos”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- A transação inicial cria somente tenant pendente, membro/Owner convidado, política neutra e outbox; recursos, membros adicionais e integrações são negados até `activate-tenant` ([produto 03, “Ciclo de vida”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- Ativação exige convite aceito, identidade verificada, `PolicyAcceptance` com identidade, versão e instante, e `OwnerAppointment` ativo; `active` nunca existe sem Owner ativo ([produto 03, “Resultado obrigatório”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- `appoint-owner`, `transfer-owner`, suspensão ou revogação bloqueiam o tenant e recusam remover o último Owner ativo; transferência registra antecessor, sucessor, motivo e instante ([produto 03, “Continuidade de propriedade”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
- Configurações iniciais são neutras e locais ao novo `tenantId`; nenhum branding, política ou dado de outro tenant pode ser copiado ([produto 03, “Resultado obrigatório”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md)).
