# Entidades TypeScript — módulos `identity` e `membership`

`Identity` é global e representa quem autenticou. `TenantMember` é local ao tenant e é o único
sujeito que pode receber concessões. Nenhuma credencial secreta aparece nesses contratos.

```ts
import type { IdentityKind, IdentityId, TenantId, TenantMemberId } from "@shared/access/authorization.types";

export const IDENTITY_STATUS = {
  PENDING: "pending", ACTIVE: "active", SUSPENDED: "suspended", REVOKED: "revoked",
} as const;
export type IdentityStatus = (typeof IDENTITY_STATUS)[keyof typeof IDENTITY_STATUS];

export interface IdentityEntityInterface {
  id: IdentityId;
  kind: IdentityKind;
  status: IdentityStatus;
  providerSubjectId?: string;
  displayName: string;
  verifiedEmail?: string;
  homeTenantId?: TenantId;
  createdAt: Date;
  suspendedAt?: Date;
  updatedAt: Date;
}

export const CREDENTIAL_STATUS = {
  ACTIVE: "active", ROTATED: "rotated", REVOKED: "revoked", EXPIRED: "expired",
} as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUS)[keyof typeof CREDENTIAL_STATUS];

export interface CredentialEntityInterface {
  id: string;
  identityId: IdentityId;
  ownerTenantId: TenantId;
  credentialType: "oidc-client" | "device-certificate" | "api-key-reference";
  externalSecretReference: string;
  fingerprint?: string;
  status: CredentialStatus;
  issuedAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
}

export const MEMBER_STATUS = {
  PENDING_INVITATION: "pending_invitation", PENDING_START: "pending_start", ACTIVE: "active",
  SUSPENDED: "suspended", REVOKED: "revoked", EXPIRED: "expired",
} as const;
export type TenantMemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export interface MembershipAffiliationInterface {
  kind: "employee" | "contractor" | "partner" | "service" | "device" | "agent";
  source: "hris" | "contract" | "manual" | "integration";
  sourceReference: string;
  sponsoringMemberId?: TenantMemberId;
  managerMemberId?: TenantMemberId;
  validFrom: Date;
  validUntil?: Date;
}

export interface TenantMemberEntityInterface {
  id: TenantMemberId;
  tenantId: TenantId;
  identityId: IdentityId;
  status: TenantMemberStatus;
  affiliation: MembershipAffiliationInterface;
  acceptedAt?: Date;
  suspendedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberInvitationEntityInterface {
  id: string;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  providerInvitationReference: string;
  sentByMemberId?: TenantMemberId;
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
}
```

O domínio exige `homeTenantId` para identidades não humanas no MVP e impede que elas sejam
vinculadas a outro tenant. Aceitar convite cria identidade utilizável, não acesso: vigência do
vínculo, concessão ativa e condições operacionais continuam obrigatórias.
