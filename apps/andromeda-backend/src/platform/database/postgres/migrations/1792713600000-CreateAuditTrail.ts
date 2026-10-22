import type { MigrationInterface, QueryRunner } from "typeorm";
import downSql from "./1792713600000-CreateAuditTrail.down.sql?raw";
import upSql from "./1792713600000-CreateAuditTrail.up.sql?raw";

export class CreateAuditTrail1792713600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(upSql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(downSql);
  }
}
