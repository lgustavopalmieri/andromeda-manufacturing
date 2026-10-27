# EP-00-F05 — Prepare and Apply Machine Setup

## Description and Value

Being allowed to operate one machine must not imply authority to change every setup parameter or publish a reusable definition. This feature validates preparation and application of a versioned setup on a specific machine, distinguishing ordinary values from critical values and validating compatibility before recording an applied configuration for the platform’s next order-start check.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Define and govern how a product is made](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#define-and-govern-how-a-product-is-made).
- Requirement: [Govern operational changes](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#govern-operational-changes).

This delivery exercises granular setup authority and version compatibility. It does not build a dynamic form editor or rule execution engine.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

Seeded setup/form versions contain two representative fields: ordinary `target speed` and critical `pressure limit`, each with an explicit fixture unit and allowed range. A draft configuration references its form version, machine, product revision and tenant. Accepted saving/application retains the actual minimal configuration, applied machine/order reference, values and governing versions required by F06. The application state is a platform prerequisite, while physical application to equipment remains deferred or explicitly simulated. No equipment command or physical interlock change is delivered, and physical machine readiness is not confirmed.

The saved configuration, applied reference and parameter permissions are the first setup capability. Later form/rule behavior and equipment effects continue these protected operations under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F05-US01 — Prepare a Configuration for One Machine

As a process engineer, I want to save setup values for my assigned machine so that an authorized setup operator can apply the intended configuration. A-ENGINEER reads the permitted form version for A-M1, enters allowed ordinary values and saves a new draft configuration revision. The action leaves the referenced form unchanged. Editing a critical value, reusing a B template or silently moving the setup to A-M2 requires additional authority and must not succeed through draft-save permission.

### EP-00-F05-US02 — Apply Only a Compatible and Authorized Setup

As a setup operator, I want to apply a saved compatible configuration governed by an effective published form/template to A-M1 so that the order can proceed with an identifiable version. A-SETUP selects the permitted configuration and sees the recorded platform application and the equipment effect still deferred. Applying it requires current machine-specific apply authority and permission to use that template. The saved configuration instance needs no separate publication workflow in this package; its governing definition must be effective. A-SUPERVISOR may receive a separate critical-value grant in an isolated scenario, but that grant cannot bypass a frozen critical setting or incompatible product version.

## Permission and Scope Matrix

| Action | Proposed grant | Separate boundary |
| --- | --- | --- |
| Read form/setup | A-ENGINEER and A-SETUP for A-M1 versions within F02. | No permission to edit the form definition or another machine. |
| Save ordinary setup draft | A-ENGINEER for A-M1; A-DELEGATE may grant it within its F01 ceiling. | Critical changes and application remain separate. |
| Apply setup | A-SETUP for A-M1 with template-use authority. | A-M2, template publication and critical changes are not implied. |
| Change critical parameter | Separately seeded A-SUPERVISOR authority on A-M1. | Requires ordinary operation authority as relevant and cannot bypass frozen-state restrictions. |
| Use a reusable setup version | Explicit permitted template and machine/product/site context. | Reading a template does not make it generally applicable. |

## Business Rules

### EP-00-F05-BR01 — Setup Is Bound to Real Resources

Each read, save or apply action needs the relevant grant on the actual machine in the active tenant. Template-use authority and machine authority must both apply to the same requested operation. A grant to prepare A-M1 setup does not cover A-M2 or confer rights on the referenced form's definition.

### EP-00-F05-BR02 — Field Sensitivity Is Part of Authority

Ordinary value editing and critical value changes are distinct permissions. A critical change is determined against the recorded machine/order setup baseline, not a caller's claim that the value is unchanged. A saved instance retaining the already approved critical value may be applied without critical-change authority; replacing that value requires it whether changed directly, copied from a template or supplied through a saved draft. An actor cannot hide a critical change in an otherwise permitted ordinary update. A setup action is refused as a whole if any requested field change lacks authority.

### EP-00-F05-BR03 — Version and Compatibility Are Mandatory

Application accepts a complete saved configuration instance, including one saved as a draft by the engineer, under separate apply authority. Its governing form/template must be an effective approved/published version compatible with the machine model, location and selected product revision. A draft instance is distinct from a draft definition: draft or replaced-for-new-use definitions are not applied to new work. Invalid ranges or units are visible prerequisite failures for an authorized reader, not permissions that can be granted around. The fixture policy freezes critical setting changes for running orders; a critical-change grant does not bypass that restriction.

### EP-00-F05-BR04 — Changes Create Attributable Versions

Saving creates a setup revision and applying records the exact configuration/form/product versions used. A new template/form revision does not overwrite a running order's pinned setup. Live adjustment and publication workflows for setup definitions are excluded; seeded versions represent their approved states.

### EP-00-F05-BR05 — Apply Checks Current Authority and Gives Honest Feedback

Current grants, membership, machine assignment, version and state are evaluated at acceptance. Prior form access or a prior successful setup is insufficient after effective revocation. Missing/indeterminate authority yields no ready state or partial parameter change. Evidence states the requested fields, protected versions, actor, actual retained application and any downstream effect still simulated within F02's visibility boundary.

## Acceptance Criteria

### EP-00-F05-AC01 — Save Without Applying or Editing Definitions

Story: US01. Rules: BR01, BR04. A-ENGINEER saves allowed target-speed values for A-M1 as a new draft revision. The form definition is unchanged and the setup is not applied. A request to apply using only draft-save authority is refused.

### EP-00-F05-AC02 — Apply a Compatible Version

Story: US02. Rules: BR01, BR03–BR05. A-SETUP with A-M1 apply and template-use authority selects the compatible effective version. Acceptance retains the actual configuration/form/product revisions and applied reference used by F06; it identifies the equipment effect still deferred and confirms no physical setting or interlock change.

### EP-00-F05-AC03 — Refuse Sibling and Cross-Tenant Use

Story: US01–US02. Rule: BR01. A-M1 save/apply rights do not permit A-M2 setup. An A template cannot be applied to B-M1, and a B template cannot be used on A-M1, even when names or models match. Changing a displayed location does not alter the actual machine's authority boundary.

### EP-00-F05-AC04 — Protect Critical Fields Through Every Path

Story: US01–US02. Rule: BR02. A-ENGINEER or A-SETUP lacking critical-change authority cannot change pressure limit directly or through a copied template/draft. A mixed ordinary-and-critical request is refused without accepting only the ordinary part. The separately authorized supervisor variant succeeds only when all other prerequisites permit it.

### EP-00-F05-AC05 — Refuse Incompatible or Frozen Configuration

Story: US02. Rules: BR02–BR03. An authorized apply actor cannot use a wrong machine-model/site/product version, an invalid unit/range, a draft version or a new critical setting on a running order. The visible outcome distinguishes invalid prerequisites from missing authority without exposing restricted template content.

### EP-00-F05-AC06 — Preserve Versions Already Used

Story: US02. Rules: BR03–BR04. A running order remains linked to setup version 1 after version 2 becomes effective for new work. Applying version 2 through an ordinary new-setup action does not rewrite the running order or its original parameter evidence.

### EP-00-F05-AC07 — Recheck After Revocation and Dependency Failure

Story: US01–US02. Rule: BR05. A setup form opened before effective apply revocation cannot later produce a ready result. Unavailable/indeterminate authorization creates no partial configuration or readiness claim. Recovery requires current authority and current compatible versions.

### EP-00-F05-AC08 — Mirror Tenant B Independently

Story: US01–US02. Rules: BR01, BR04–BR05. B-ENGINEER and B-SETUP prepare/apply a B-M1-compatible configuration with B versions and grants. The outcome retains B branding/context only; an A operator or DUAL's B start grant cannot substitute for B setup authority.

## Dependencies and Pending Decisions

Depends on F01–F02, seeded versioned definitions and minimal machine/product context. F06 consumes the actual retained applied-setup reference; the downstream equipment effect remains deferred. Parameter classification, frozen critical settings and no live adjustment are concrete proposed initial product boundaries requiring review. There are no blocking scope questions; a complete setup form/rule designer is excluded.
