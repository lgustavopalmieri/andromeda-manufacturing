import { runtimeConfigSchema } from "./schema";
import { RuntimeConfigurationError } from "./error";
import type { RuntimeConfigInterface } from "./interface";

export const loadRuntimeConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfigInterface => {
  const result = runtimeConfigSchema.safeParse({
    http: {
      port: environment.PORT,
    },
    database: {
      host: environment.DATABASE_HOST,
      port: environment.DATABASE_PORT,
      username: environment.DATABASE_USER,
      password: environment.DATABASE_PASSWORD,
      database: environment.DATABASE_NAME,
      ssl: environment.DATABASE_SSL,
      logging: environment.DATABASE_LOGGING,
    },
    runMigrationsOnBoot: environment.RUN_MIGRATIONS_ON_BOOT,
    enableAuthorizationValidation: environment.ENABLE_AUTHORIZATION_VALIDATION,
  });

  if (!result.success) {
    throw new RuntimeConfigurationError(
      result.error.issues.map((issue) => issue.path.join(".")),
    );
  }

  return {
    ...result.data,
    http: {
      host: "127.0.0.1",
      port: result.data.http.port,
    },
  };
};
