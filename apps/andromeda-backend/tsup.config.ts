import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/main.ts"],
  format: ["esm"],
  outDir: "dist",
  sourcemap: true,
  target: "node22",
  loader: { ".sql": "text" },
});
