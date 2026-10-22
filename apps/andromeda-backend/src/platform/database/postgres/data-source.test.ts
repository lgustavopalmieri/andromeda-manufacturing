import { describe, expect, it } from "vitest";
import type { DatabaseConfigInterface } from "configs/database";
import { createDataSource } from "./data-source.js";

const databaseConfig: DatabaseConfigInterface = {
  host: "postgres.internal",
  port: 5432,
  username: "andromeda",
  password: "secret",
  database: "manufacturing",
  ssl: true,
  runMigrationsOnBoot: false,
};

interface MakeSutInterface {
  sut: ReturnType<typeof createDataSource>;
}

const makeSut = (): MakeSutInterface => ({ sut: createDataSource(databaseConfig) });

describe("createDataSource", () => {
  describe("when configuring the PostgreSQL data source", () => {
    it("should register the audit and outbox schemas with migrations rather than synchronize", () => {
      const { sut } = makeSut();

      expect(sut.options).toMatchObject({
        type: "postgres",
        host: "postgres.internal",
        port: 5432,
        synchronize: false,
      });
      expect(sut.entityMetadatas).toEqual([]);
      expect(sut.options.entities).toHaveLength(2);
      expect(sut.options.migrations).toHaveLength(1);
    });
  });
});
