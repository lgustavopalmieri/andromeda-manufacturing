import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  DATABASE_HOST: z.string().trim().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65_535),
  DATABASE_USER: z.string().trim().min(1),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string().trim().min(1),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  RUN_MIGRATIONS_ON_BOOT: z.enum(["true", "false"]).default("false"),
});

export interface DatabaseConfigInterface {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  runMigrationsOnBoot: boolean;
}

export const loadDatabaseConfig = (
  environment: Record<string, string | undefined> = process.env,
): DatabaseConfigInterface => {
  const parsedEnvironment = databaseEnvironmentSchema.parse(environment);

  return {
    host: parsedEnvironment.DATABASE_HOST,
    port: parsedEnvironment.DATABASE_PORT,
    username: parsedEnvironment.DATABASE_USER,
    password: parsedEnvironment.DATABASE_PASSWORD,
    database: parsedEnvironment.DATABASE_NAME,
    ssl: parsedEnvironment.DATABASE_SSL === "true",
    runMigrationsOnBoot: parsedEnvironment.RUN_MIGRATIONS_ON_BOOT === "true",
  };
};
