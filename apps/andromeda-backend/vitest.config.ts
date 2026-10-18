import { fileURLToPath } from "node:url";
import { defineConfig, configDefaults } from "vitest/config";

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": `${sourceDirectory}/modules/@shared`,
      configs: `${sourceDirectory}/configs`,
      modules: `${sourceDirectory}/modules`,
      platform: `${sourceDirectory}/platform`,
    },
  },
  test: {
    projects: [
      {
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
        test: {
          include: ["src/**/*.integration.test.ts"],
          name: "integration",
          passWithNoTests: true,
        },
      },
      {
        test: {
          include: ["src/**/*.e2e.test.ts"],
          name: "e2e",
          passWithNoTests: true,
        },
      },
    ],
  },
});
