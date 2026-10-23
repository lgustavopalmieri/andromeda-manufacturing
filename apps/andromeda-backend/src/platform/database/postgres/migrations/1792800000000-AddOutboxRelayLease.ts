import type { MigrationInterface, QueryRunner } from "typeorm";
import downSql from "./1792800000000-AddOutboxRelayLease.down.sql?raw";
import upSql from "./1792800000000-AddOutboxRelayLease.up.sql?raw";

export class AddOutboxRelayLease1792800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(upSql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(downSql);
  }
}
