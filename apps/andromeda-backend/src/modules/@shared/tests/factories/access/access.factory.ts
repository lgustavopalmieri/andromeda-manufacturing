import {
  AUTHORIZATION_DECISION,
  IDENTITY_KIND,
} from "../../../access/access.types";
import type {
  AuthenticatedIdentityInterface,
  AuthorizationDecisionInterface,
  AuthorizationSubjectInterface,
  ResourceContextInterface,
} from "../../../access/access.types";
import type { ContextualAuthorizationContextInterface } from "../../../access/interfaces";

export const makeAuthenticatedIdentity = (
  overrides: Partial<AuthenticatedIdentityInterface> = {},
): AuthenticatedIdentityInterface => ({
  providerSubjectId: "keycloak-subject-01",
  authenticatedAt: new Date("2026-10-21T12:00:00.000Z"),
  authenticationMethod: "oidc",
  ...overrides,
});

export const makeAuthorizationSubject = (
  overrides: Partial<AuthorizationSubjectInterface> = {},
): AuthorizationSubjectInterface => ({
  identityId: "identity-01",
  tenantId: "tenant-01",
  tenantMemberId: "tenant-member-01",
  kind: IDENTITY_KIND.HUMAN,
  ...overrides,
});

export const makeResourceContext = (
  overrides: Partial<ResourceContextInterface> = {},
): ResourceContextInterface => ({
  tenantId: "tenant-01",
  resourceType: "production-order",
  resourceId: "production-order-01",
  topologyNodeIds: ["asset-01"],
  functionalObjectRefs: [],
  ...overrides,
});

export const makeContextualAuthorizationContext = (
  overrides: Partial<ContextualAuthorizationContextInterface> = {},
): ContextualAuthorizationContextInterface => ({
  operation: "production-order:operate",
  resource: makeResourceContext(),
  history: [],
  occurredAt: new Date("2026-10-21T12:01:00.000Z"),
  correlationId: "correlation-01",
  ...overrides,
});

export const makeAuthorizationDecision = (
  overrides: Partial<AuthorizationDecisionInterface> = {},
): AuthorizationDecisionInterface => ({
  decision: AUTHORIZATION_DECISION.PERMIT,
  grantIds: ["grant-01"],
  policyRevisionId: "policy-revision-01",
  obligations: [],
  ...overrides,
});
