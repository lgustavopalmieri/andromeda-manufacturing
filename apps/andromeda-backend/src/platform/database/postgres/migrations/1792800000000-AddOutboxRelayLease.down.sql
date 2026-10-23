DROP INDEX IF EXISTS outbox_message_relay_claim_idx;

ALTER TABLE outbox_message
  DROP COLUMN IF EXISTS lease_expires_at,
  DROP COLUMN IF EXISTS lease_token;
