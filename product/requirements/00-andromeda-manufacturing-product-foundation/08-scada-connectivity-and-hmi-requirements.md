# Asset Supervision, Connectivity and the Operator Interface

## Operational problem and value

A signal without a machine, unit, quality indication or relevant production context can mislead
rather than inform. An operational screen with unclear action effects can create the same problem.
Andromeda needs to turn equipment observations into understandable context while keeping human and
machine authority explicit.

SCADA means supervisory control and data acquisition. In this product it connects observation,
state, alarms, trends and history to the human-machine interface (HMI), helping people identify
what needs attention and what they are allowed to do.

## Understand the connected resource

An asset or device has an operational identity, manufacturer and model, location, capabilities,
signals and units, expected data quality, connection state and responsible owner. Received
telemetry and events retain their source, occurrence time, quality and asset context, together
with the order or operational state when that relationship is known.

Industrial environments use different protocols and connectors. The product needs to preserve the
meaning of the information exchanged rather than assume that a connection alone makes signals
comparable. OPC Unified Architecture and MQTT are examples of industrial communication contexts
that may coexist; their use depends on the operating environment. [S05]

Raw signals remain distinguishable from derived states. A calculated running state, for example,
has a versioned and explainable derivation. Connectivity can be enabled or disabled for an asset
and reviewed after relevant configuration or credential changes. A source without authority or
outside the organization's scope cannot contribute as though it were trusted operational evidence.

## A configurable HMI and a shared action contract

An HMI definition describes context, visible elements, data, instructions, alarms, actions,
validations, prerequisites, effects, confirmations and exception handling. Accessibility and
localization belong to that definition. It is versioned so the organization can explain the
interface and actions that governed a particular execution.

The operator sees the detail needed for the task; a supervisor may see wider operational context.
Both remain within granted scope. Typical actions include reporting production, requesting or
confirming a start, pausing or closing the order representation, explaining downtime, declaring
loss, recording an inspection and requesting support. The meaning and evidence of the action are
explicit, rather than inferred from a button label.

Attention hierarchy, consistent navigation, intentional use of color, actionable alarms, feedback
and controlled change help people respond without unnecessary ambiguity. These are HMI principles,
not a prescribed screen layout. [S06]

The same action definition is understandable to future AI agents. Autonomous execution is not
implicitly enabled by making it available: the agent needs an active identity, permission,
delegated scope, approval policy and an attributable record, including any required human
confirmation. A delegation can be revoked.

## Alarms and commands

An alarm describes a condition requiring attention, with severity, asset, occurrence time,
acknowledgment, owner and escalation policy. It is more than an undifferentiated notification.
A command is available only under permitted state and authority, leaves an end-to-end record and
has a recognizable outcome: confirmed success, rejection, timeout or failure.

The product must not present physical execution as confirmed without a response from the
corresponding authority. Distinguishing a request from confirmation protects operational trust
and keeps supervision separate from deterministic or safety control.

**Conceptual references:** [S05], [S06], [S07], [S08].
