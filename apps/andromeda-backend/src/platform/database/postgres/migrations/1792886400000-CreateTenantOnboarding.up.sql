CREATE TABLE tenant (
  id UUID PRIMARY KEY,
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending_activation', 'active', 'suspended', 'closed')),
  organization_name VARCHAR(240) NOT NULL,
  external_organization_identifier VARCHAR(180),
  settings JSONB NOT NULL,
  active_access_policy_revision_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE tenant_onboarding_request (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending_activation', 'activated', 'rejected', 'failed')),
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  organization_name VARCHAR(240) NOT NULL,
  external_organization_identifier VARCHAR(180),
  requested_settings JSONB NOT NULL,
  owner_email VARCHAR(320) NOT NULL,
  owner_display_name VARCHAR(240) NOT NULL,
  owner_locale VARCHAR(32) NOT NULL,
  policy_acceptance_version VARCHAR(120) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE access_policy_revision (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  version INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('effective')),
  segregation_rules JSONB NOT NULL,
  operation_condition_rules JSONB NOT NULL,
  direct_grant_maximum_duration_hours INTEGER NOT NULL CHECK (direct_grant_maximum_duration_hours > 0),
  emergency_access_maximum_duration_hours INTEGER NOT NULL CHECK (emergency_access_maximum_duration_hours > 0),
  review_interval_days INTEGER NOT NULL CHECK (review_interval_days > 0),
  effective_from TIMESTAMPTZ NOT NULL,
  authored_by VARCHAR(32) NOT NULL,
  published_by VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, version)
);

CREATE TABLE permission_definition (
  code VARCHAR(180) PRIMARY KEY,
  domain VARCHAR(80) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_types JSONB NOT NULL,
  delegable BOOLEAN NOT NULL,
  sensitive BOOLEAN NOT NULL,
  operational BOOLEAN NOT NULL
);

CREATE TABLE role_definition (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  code VARCHAR(120) NOT NULL,
  display_name VARCHAR(180) NOT NULL,
  origin VARCHAR(32) NOT NULL CHECK (origin IN ('base-template', 'tenant-custom')),
  current_published_revision_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE role_revision (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  role_definition_id UUID NOT NULL REFERENCES role_definition(id),
  version INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('published')),
  permission_codes JSONB NOT NULL,
  change_reason VARCHAR(2000) NOT NULL,
  authored_by VARCHAR(32) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  UNIQUE (role_definition_id, version)
);

CREATE TABLE owner_appointment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id),
  invited_email VARCHAR(320) NOT NULL,
  invited_display_name VARCHAR(240) NOT NULL,
  invited_locale VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('invited', 'active', 'transferred', 'revoked')),
  reason VARCHAR(2000) NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX owner_appointment_tenant_status_idx ON owner_appointment (tenant_id, status);
