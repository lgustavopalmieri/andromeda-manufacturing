import type { DataSource } from "typeorm";
import { SystemClock } from "platform/clock/system-clock";
import { TypeormTransactionRunner } from "platform/database/postgres/typeorm/typeorm-transaction-runner";
import { CryptoUuidGenerator } from "platform/identifiers/crypto-uuid-generator";
import { RecordAuditEventTransactionManager } from "./outbound/typeorm/record-audit-event-transaction-manager";
import { RecordAuditEventUsecase } from "./application/usecase";

export class RecordAuditEventWire {
  public static provideUsecase(dataSource: DataSource): RecordAuditEventUsecase {
    return new RecordAuditEventUsecase(
      new RecordAuditEventTransactionManager(new TypeormTransactionRunner(dataSource)),
      new CryptoUuidGenerator(),
      new SystemClock(),
    );
  }
}
