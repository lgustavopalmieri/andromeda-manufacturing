import type { MigrationInterface, QueryRunner } from "typeorm";
import { readMigrationSql } from "platform/database/postgres/read-migration-sql";

export class Foundation1793318400000 implements MigrationInterface {
  readonly name = "Foundation1793318400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(readMigrationSql(import.meta.url, "0001-foundation.up.sql"));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(readMigrationSql(import.meta.url, "0001-foundation.down.sql"));
  }
}
