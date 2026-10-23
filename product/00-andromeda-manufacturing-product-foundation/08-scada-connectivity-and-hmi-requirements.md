# Requirements — SCADA, connectivity, and HMI

## Connectivity and operational observability

- Must register asset/device, manufacturer/model, location, capabilities, signals, units,
  expected data quality, connection state, and operational owner.
- Must acquire telemetry and events from industrial sources, associating origin, timestamp,
  quality, asset context, and correlation with order/state when available.
- Must support protocols and connectors according to the environment, prioritizing semantic
  interoperability. OPC UA covers everything from sensors and actuators to MES and ERP [S05]; MQTT may coexist.
- Must represent machine state, alarm/event, trend, and history, and distinguish raw signal
  from derived state. Every derivation rule is versioned and explainable.
- Must allow connectivity to be enabled/disabled by asset and reviewed when configuration
  or credential changes; an unauthorized source or one outside the tenant scope is rejected.

## Configurable HMI and action contract

- The screen is composed of versioned definitions: context, widgets, data, instructions, alarms,
  actions, validations, pre/postconditions, confirmation, exceptions, and accessibility/localization.
- Must present the task at the role's level of detail: the operator sees what is needed to decide;
  the supervisor sees additional context; each sees only the granted scope.
- Actions include at least reporting/confirming production, starting/pausing/closing an order
  representation, justifying downtime, declaring loss, recording inspection, and requesting support — always with
  a contracted effect and evidence of the result.
- Must adopt high-performance HMI principles: attention hierarchy, consistent navigation,
  intentional use of color, actionable alarm, feedback, and change management [S06].
- The same contract must make a consumable format available to a future agent; autonomous execution is
  prohibited until identity, permission, scope, approval policy, and record are active.

## Alarms and commands

An alarm is not merely a notification: it has severity, condition, asset, timestamp, acknowledgment,
owner, and escalation policy. A command appears only if permission and state
allow it, leaves an end-to-end trail, and returns unambiguous confirmation, timeout, or failure. The
platform does not declare that a command was executed without confirmation from the corresponding authority.

**References:** [S05], [S06], [S07], [S08].
