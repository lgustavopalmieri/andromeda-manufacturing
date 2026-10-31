import { defineConfig } from "eslint/config";
import typescriptParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    ignores: ["dist/**", "coverage/**", ".turbo/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      parser: typescriptParser,
    },
  },
  eslintConfigPrettier,
]);
