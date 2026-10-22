CREATE TABLE audit_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  operation_code VARCHAR(180) NOT NULL,
  decision VARCHAR(16) NOT NULL CHECK (decision IN ('permitted', 'denied', 'failed', 'changed')),
  effective_actor JSONB NOT NULL,
  sponsoring_actor JSONB,
  resource JSONB NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  access_grant_ids UUID[] NOT NULL DEFAULT '{}',
  policy_revision_id UUID,
  delegation_id UUID,
  emergency_access_id UUID,
  credential_id UUID,
  reason VARCHAR(2000),
  denial_code VARCHAR(160),
  before_digest VARCHAR(128),
  after_digest VARCHAR(128),
  result_reference VARCHAR(500),
  origin VARCHAR(16) NOT NULL CHECK (origin IN ('http', 'hmi', 'integration', 'agent', 'worker'))
);

CREATE INDEX audit_event_tenant_occurred_at_idx ON audit_event (tenant_id, occurred_at DESC);

CREATE TABLE outbox_message (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event_name VARCHAR(180) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  correlation_id UUID NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  available_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  CONSTRAINT outbox_message_tenant_event_deduplication_unique UNIQUE (tenant_id, id)
);

CREATE INDEX outbox_message_pending_idx ON outbox_message (available_at, occurred_at)
  WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_append_only
BEFORE UPDATE OR DELETE ON audit_event
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
