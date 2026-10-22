import { describe, expect, it } from "vitest";
import { loadDatabaseConfig } from "./database.js";

interface MakeSutInterface {
  sut: typeof loadDatabaseConfig;
}

const makeSut = (): MakeSutInterface => ({ sut: loadDatabaseConfig });

describe("loadDatabaseConfig", () => {
  describe("when all database variables are valid", () => {
    it("should parse the database connection and explicit migration policy", () => {
      const { sut } = makeSut();

      expect(
        sut({
          DATABASE_HOST: "postgres.internal",
          DATABASE_PORT: "5432",
          DATABASE_USER: "andromeda",
          DATABASE_PASSWORD: "secret",
          DATABASE_NAME: "manufacturing",
          DATABASE_SSL: "true",
          RUN_MIGRATIONS_ON_BOOT: "true",
        }),
      ).toEqual({
        host: "postgres.internal",
        port: 5432,
        username: "andromeda",
        password: "secret",
        database: "manufacturing",
        ssl: true,
        runMigrationsOnBoot: true,
      });
    });
  });

  describe("when the database variables are incomplete or unsafe", () => {
    it("should reject the configuration", () => {
      const { sut } = makeSut();

      expect(() => sut({ DATABASE_HOST: "postgres" })).toThrow();
      expect(() =>
        sut({
        DATABASE_HOST: "postgres.internal",
        DATABASE_PORT: "invalid",
        DATABASE_USER: "andromeda",
        DATABASE_PASSWORD: "secret",
        DATABASE_NAME: "manufacturing",
        }),
      ).toThrow();
    });
  });
});
