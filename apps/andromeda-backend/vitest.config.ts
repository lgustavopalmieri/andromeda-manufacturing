import { fileURLToPath } from "node:url";
import { defineConfig, configDefaults } from "vitest/config";

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url));
const aliases = {
  "@shared": `${sourceDirectory}/modules/@shared`,
  configs: `${sourceDirectory}/configs`,
  modules: `${sourceDirectory}/modules`,
  platform: `${sourceDirectory}/platform`,
};

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    projects: [
      {
        resolve: {
          alias: aliases,
        },
        test: {
          exclude: [
            ...configDefaults.exclude,
            "**/dist/**",
            "**/*.integration.test.ts",
            "**/*.e2e.test.ts",
          ],
          include: ["src/**/*.test.ts"],
          name: "unit",
        },
      },
      {
        resolve: {
          alias: aliases,
        },
        test: {
          include: ["src/**/*.integration.test.ts"],
          hookTimeout: 180_000,
          name: "integration",
          testTimeout: 120_000,
        },
      },
      {
        resolve: {
          alias: aliases,
        },
        test: {
          include: ["src/**/*.e2e.test.ts"],
          hookTimeout: 300_000,
          name: "e2e",
          testTimeout: 180_000,
        },
      },
    ],
  },
});
