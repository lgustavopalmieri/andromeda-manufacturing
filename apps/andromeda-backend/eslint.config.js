import { defineConfig } from "eslint/config";
import typescriptParser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    ignores: ["dist/**", "coverage/**", ".turbo/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/object-curly-newline": ["error", {
        ObjectExpression: {
          minProperties: 1,
          consistent: true,
        },
        TSTypeLiteral: {
          minProperties: 1,
          consistent: true,
        },
        TSInterfaceBody: {
          minProperties: 1,
          consistent: true,
        },
      }],
      "@stylistic/object-property-newline": "error",
      "@stylistic/indent": ["error", 2],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/member-delimiter-style": "error",
    },
  },
]);
