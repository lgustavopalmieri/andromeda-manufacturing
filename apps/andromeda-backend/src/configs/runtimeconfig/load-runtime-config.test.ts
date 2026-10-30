import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRuntimeConfig } from "./load-runtime-config";
import { RuntimeConfigurationError } from "./error";

interface MakeSutOptions {
  environment?: NodeJS.ProcessEnv;
  useProcessEnvironment?: boolean;
}

interface MakeSutInterface {
  sut: () => ReturnType<typeof loadRuntimeConfig>;
  environment: NodeJS.ProcessEnv;
}

const makeSut = (options: MakeSutOptions = {}): MakeSutInterface => {
  const environment: NodeJS.ProcessEnv = {
    PORT: "3000",
    DATABASE_HOST: "localhost",
    DATABASE_PORT: "5432",
    DATABASE_USER: "fixture-user",
    DATABASE_PASSWORD: "fixture-password",
    DATABASE_NAME: "fixture-database",
    ...options.environment,
  };

  return {
    sut: options.useProcessEnvironment
      ? () => loadRuntimeConfig()
      : () => loadRuntimeConfig(environment),
    environment,
  };
};

afterEach(() => vi.unstubAllEnvs());

describe("loadRuntimeConfig", () => {
  describe("when the required settings are valid", () => {
    it("should return typed HTTP and database settings with safe defaults", () => {
      const { sut } = makeSut();

      expect(sut()).toEqual({
        http: {
          host: "127.0.0.1",
          port: 3000,
        },
        database: {
          host: "localhost",
          port: 5432,
          username: "fixture-user",
          password: "fixture-password",
          database: "fixture-database",
          ssl: false,
          logging: false,
        },
        runMigrationsOnBoot: true,
        enableAuthorizationValidation: false,
      });
    });

    it.each(["1", "65535"])("should accept the port boundary %s", (port) => {
      const { sut } = makeSut({
        environment: {
          PORT: port,
          DATABASE_PORT: port,
        },
      });

      expect(sut().http.port).toBe(Number(port));
      expect(sut().database.port).toBe(Number(port));
    });

    it("should preserve the exact password including intentional whitespace", () => {
      const { sut } = makeSut({
        environment: {
          DATABASE_PASSWORD: " fixture-password ",
        },
      });

      expect(sut().database.password).toBe(" fixture-password ");
    });

    it("should read the current process environment when no source is supplied", () => {
      const { sut, environment } = makeSut({
        useProcessEnvironment: true,
      });
      for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value);
      for (const key of ["DATABASE_SSL", "DATABASE_LOGGING", "RUN_MIGRATIONS_ON_BOOT", "ENABLE_AUTHORIZATION_VALIDATION"]) {
        vi.stubEnv(key, undefined);
      }

      expect(sut().http.port).toBe(3000);
      vi.stubEnv("PORT", "3001");
      expect(sut().http.port).toBe(3001);
    });

    it("should ignore unrelated provider settings and client identity assertions", () => {
      const { sut } = makeSut({
        environment: {
          KEYCLOAK_BASE_URL: "invalid",
          AWS_REGION: "",
          OPENFGA_API_URL: "invalid",
          ACTOR_ID: "untrusted-actor",
          TENANT_ID: "untrusted-tenant",
        },
      });

      expect(Object.keys(sut())).toEqual([
        "http", "database", "runMigrationsOnBoot", "enableAuthorizationValidation",
      ]);
    });

    it("should leave its environment source unchanged", () => {
      const { sut, environment } = makeSut();
      const original = {
        ...environment,
      };

      sut();

      expect(environment).toEqual(original);
    });
  });

  describe("when an explicit boolean setting is supplied", () => {
    it.each(["true", "false"])("should parse the literal %s without truthiness coercion", (value) => {
      const { sut } = makeSut({
        environment: {
          DATABASE_SSL: value,
          DATABASE_LOGGING: value,
          RUN_MIGRATIONS_ON_BOOT: value,
          ENABLE_AUTHORIZATION_VALIDATION: value,
        },
      });
      const expected = value === "true";

      expect(sut()).toMatchObject({
        database: {
          ssl: expected,
          logging: expected,
        },
        runMigrationsOnBoot: expected,
        enableAuthorizationValidation: expected,
        http: {
          host: "127.0.0.1",
        },
      });
    });
  });

  describe("when a required setting is missing or blank", () => {
    it.each([
      ["PORT", "http.port"],
      ["DATABASE_HOST", "database.host"],
      ["DATABASE_PORT", "database.port"],
      ["DATABASE_USER", "database.username"],
      ["DATABASE_PASSWORD", "database.password"],
      ["DATABASE_NAME", "database.database"],
    ])("should reject incomplete %s safely", (key, field) => {
      for (const value of [undefined, "", "   "]) {
        const { sut } = makeSut({
          environment: {
            [key]: value,
          },
        });

        expect(sut).toThrow(RuntimeConfigurationError);
        expect(sut).toThrow(`Invalid runtime configuration: ${field}.`);
      }
    });
  });

  describe("when a port has an invalid value", () => {
    it.each(["0", "65536", "-1", "1.5", "1e3", "0x10", "3000suffix", "NaN", "Infinity", " 3000 "])(
      "should reject %s for both services",
      (value) => {
        const { sut } = makeSut({
          environment: {
            PORT: value,
            DATABASE_PORT: value,
          },
        });

        expect(sut).toThrow(RuntimeConfigurationError);
        expect(sut).toThrow("Invalid runtime configuration: http.port, database.port.");
      },
    );
  });

  describe("when a boolean has an invalid value", () => {
    it.each(["", "TRUE", "FALSE", "1", "0", "yes", "false "])("should reject the nonliteral %s", (value) => {
      const { sut } = makeSut({
        environment: {
          DATABASE_SSL: value,
          DATABASE_LOGGING: value,
          RUN_MIGRATIONS_ON_BOOT: value,
          ENABLE_AUTHORIZATION_VALIDATION: value,
        },
      });

      expect(sut).toThrow(RuntimeConfigurationError);
      expect(sut).toThrow(
        "Invalid runtime configuration: database.ssl, database.logging, runMigrationsOnBoot, enableAuthorizationValidation.",
      );
    });
  });

  describe("when configuration contains sensitive invalid values", () => {
    it("should report field names without retaining input values or validation causes", () => {
      const secret = "postgres://fixture-user:synthetic-secret@localhost/database";
      const { sut } = makeSut({
        environment: {
          PORT: secret,
          DATABASE_HOST: secret,
        },
      });

      try {
        sut();
        expect.fail("Expected configuration to be rejected");
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeConfigurationError);
        expect((error as Error).message).toBe("Invalid runtime configuration: http.port, database.host.");
        expect(String(error)).not.toContain(secret);
        expect(JSON.stringify(error)).not.toContain(secret);
        expect((error as Error).cause).toBeUndefined();
      }
    });
  });
});
