import type { z } from "zod";
import type { databaseConfigSchema } from "./schema";

export interface DatabaseConfigInterface extends z.output<typeof databaseConfigSchema> {}
