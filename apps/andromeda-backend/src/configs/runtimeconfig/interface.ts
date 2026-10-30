import type { DatabaseConfigInterface } from "configs/database/interface";

export interface RuntimeConfigInterface {
  http: {
    host: "127.0.0.1";
    port: number;
  };
  database: DatabaseConfigInterface;
  runMigrationsOnBoot: boolean;
  enableAuthorizationValidation: boolean;
}
