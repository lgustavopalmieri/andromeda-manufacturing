import { z } from "zod";
import { databaseConfigSchema } from "configs/database/schema";

export const runtimeConfigSchema = z.object({
  http: z.object({
    port: z
      .string()
      .regex(/^[0-9]+$/)
      .transform(Number)
      .pipe(z.int().min(1).max(65_535)),
  }),
  database: databaseConfigSchema,
  runMigrationsOnBoot: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  enableAuthorizationValidation: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
