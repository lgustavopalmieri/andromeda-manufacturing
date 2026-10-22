export class AuditEventOperationRequiredError extends Error {
  public constructor() {
    super("Audit event operation code is required.");
    this.name = "AuditEventOperationRequiredError";
  }
}

export class AuditEventCorrelationRequiredError extends Error {
  public constructor() {
    super("Audit event correlation id is required.");
    this.name = "AuditEventCorrelationRequiredError";
  }
}

export class AuditEventActorRequiredError extends Error {
  public constructor() {
    super("Audit event effective actor is required.");
    this.name = "AuditEventActorRequiredError";
  }
}

export class AuditEventResourceRequiredError extends Error {
  public constructor() {
    super("Audit event resource is required.");
    this.name = "AuditEventResourceRequiredError";
  }
}
