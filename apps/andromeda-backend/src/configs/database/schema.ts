import { z } from "zod";

export const databaseConfigSchema = z.object({
  host: z
    .string()
    .trim()
    .min(1)
    .regex(/^[^\s/]+$/),
  port: z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(z.int().min(1).max(65_535)),
  username: z.string().trim().min(1),
  password: z
    .string()
    .min(1)
    .refine((value) => value.trim().length > 0),
  database: z.string().trim().min(1),
  ssl: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  logging: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
