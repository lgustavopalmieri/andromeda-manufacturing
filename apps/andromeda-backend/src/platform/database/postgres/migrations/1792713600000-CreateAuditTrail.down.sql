DROP TRIGGER IF EXISTS audit_event_append_only ON audit_event;
DROP FUNCTION IF EXISTS prevent_audit_event_mutation();
DROP TABLE IF EXISTS outbox_message;
DROP TABLE IF EXISTS audit_event;
