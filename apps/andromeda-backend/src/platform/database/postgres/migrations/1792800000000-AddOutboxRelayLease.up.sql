ALTER TABLE outbox_message
  ADD COLUMN lease_token UUID,
  ADD COLUMN lease_expires_at TIMESTAMPTZ;

CREATE INDEX outbox_message_relay_claim_idx
  ON outbox_message (available_at, lease_expires_at, occurred_at)
  WHERE published_at IS NULL;
