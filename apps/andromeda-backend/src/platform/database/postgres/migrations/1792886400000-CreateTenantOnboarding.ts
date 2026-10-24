import type { MigrationInterface, QueryRunner } from "typeorm";
import downSql from "./1792886400000-CreateTenantOnboarding.down.sql?raw";
import upSql from "./1792886400000-CreateTenantOnboarding.up.sql?raw";

export class CreateTenantOnboarding1792886400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(upSql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(downSql);
  }
}
