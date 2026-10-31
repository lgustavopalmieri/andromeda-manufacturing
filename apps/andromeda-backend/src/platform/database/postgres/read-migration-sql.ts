import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

export const readMigrationSql = (
  migrationUrl: string,
  filename: string,
): string => {
  const directory =
    basename(fileURLToPath(migrationUrl)) === "main.js"
      ? "./platform/database/postgres/migrations/"
      : "./";
  return readFileSync(
    new URL(filename, new URL(directory, migrationUrl)),
    "utf8",
  );
};
