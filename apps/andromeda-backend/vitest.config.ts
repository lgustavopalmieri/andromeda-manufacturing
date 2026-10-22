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
        resolve: { alias: aliases },
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
        resolve: { alias: aliases },
        test: {
          include: ["src/**/*.integration.test.ts"],
          name: "integration",
          passWithNoTests: true,
        },
      },
      {
        resolve: { alias: aliases },
        test: {
          include: ["src/**/*.e2e.test.ts"],
          name: "e2e",
          passWithNoTests: true,
        },
      },
    ],
  },
});
