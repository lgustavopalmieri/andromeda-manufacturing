# Requirements — security, auditing, and change control

## Access and isolation

- Every query, action, file, telemetry item, notification, and integration must be associated with
  a tenant and authorized before revealing content or producing an effect.
- Permissions must be granular by action and scope; temporary grant, delegation, expiration,
  revocation, and periodic review are part of the product. Roles are manageable shortcuts, not
  substitutes for the contextual decision.
- Human, service, and agent identities are distinct. Device and integration credentials have an
  owner, minimum scope, expiration/rotation, state, and usage record.

## Auditing and integrity

- Critical events include, at a minimum: identity, tenant, object/scope, action, before/after or
  result, instant, origin, reason, approval, and correlation. Audit logs are queryable by those
  with permission and protected against silent alteration.
- There must be a trail for changes to definitions, permissions, policies, master data, quality
  decisions, downtime reasons, integrations, and HMI actions. Execution references immutable versions.
- Every electronic signature/attestation required by tenant/industry identifies the signatory, the
  meaning of the act, signed content, instant, and linkage to the record; specific regulatory
  requirements are configured and validated in later scopes.

## Controlled change

- Configurations are draft, review, approval, publication/effectiveness, replacement, and
  controlled reversal. High-risk changes require impact assessment, approval, and a rollback plan.
- Forms, rules, and HMI have simulation/validation before publication and are not changed in the
  middle of an execution without an explicit policy. A started order preserves the initially applied version.
- White-label and local variants inherit only what the tenant standard permits; they must identify
  the difference and responsible party, not become an ungoverned copy.

## OT security

The product must be designed and operated considering OT-specific availability, reliability, and
physical safety, with shared responsibility among asset owner, supplier, and integrator. ISA/IEC
62443 and NIST SP 800-82 are risk and lifecycle references [S07] [S08]. This requirement does not
by itself declare compliance/certification.

**References:** [S07], [S08], [S01], [S06].
