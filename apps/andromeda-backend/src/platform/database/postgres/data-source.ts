import { DataSource } from "typeorm";
import type { DatabaseConfigInterface } from "configs/database";
import { AuditEventOrmEntity } from "./typeorm/entities/audit-event.orm-entity";
import { OutboxMessageOrmEntity } from "./typeorm/entities/outbox-message.orm-entity";
import { CreateAuditTrail1792713600000 } from "./migrations/1792713600000-CreateAuditTrail";
import { AddOutboxRelayLease1792800000000 } from "./migrations/1792800000000-AddOutboxRelayLease";

export interface InitializeDatabaseOptionsInterface {
  runMigrations?: boolean;
}

export const createDataSource = (connection: DatabaseConfigInterface): DataSource =>
  new DataSource({
    type: "postgres",
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password,
    database: connection.database,
    ssl: connection.ssl,
    synchronize: false,
    entities: [AuditEventOrmEntity, OutboxMessageOrmEntity],
    migrations: [CreateAuditTrail1792713600000, AddOutboxRelayLease1792800000000],
  });

export const initializeDatabase = async (
  dataSource: DataSource,
  options: InitializeDatabaseOptionsInterface = {},
): Promise<DataSource> => {
  if (!dataSource.isInitialized) await dataSource.initialize();
  if (options.runMigrations ?? true) await dataSource.runMigrations();
  return dataSource;
};
