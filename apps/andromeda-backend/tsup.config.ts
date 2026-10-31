import { existsSync, readdirSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { defineConfig } from "tsup";

const migrationsDirectory = resolve(
  "src/platform/database/postgres/migrations",
);
const migrationFiles = existsSync(migrationsDirectory)
  ? readdirSync(migrationsDirectory).sort()
  : [];
const migrationEntries = Object.fromEntries(
  migrationFiles
    .filter(
      (filename) =>
        filename.endsWith(".ts") &&
        !filename.endsWith(".d.ts") &&
        !filename.endsWith(".test.ts"),
    )
    .map((filename) => [
      `platform/database/postgres/migrations/${basename(filename, ".ts")}`,
      resolve(migrationsDirectory, filename),
    ]),
);

export default defineConfig({
  clean: true,
  entry: {
    main: "src/main.ts",
    ...migrationEntries,
  },
  format: ["esm"],
  splitting: false,
  outDir: "dist",
  sourcemap: true,
  target: "node22",
  loader: {
    ".sql": "text",
  },
  onSuccess: async () => {
    const sqlFiles = migrationFiles.filter((filename) =>
      filename.endsWith(".sql"),
    );
    if (sqlFiles.length === 0) return;
    const outputDirectory = resolve(
      "dist/platform/database/postgres/migrations",
    );
    await mkdir(outputDirectory, {
      recursive: true,
    });
    await Promise.all(
      sqlFiles.map((filename) =>
        copyFile(
          resolve(migrationsDirectory, filename),
          resolve(outputDirectory, filename),
        ),
      ),
    );
  },
});
