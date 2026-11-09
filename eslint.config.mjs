import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", "apps/api/src/generated/**", "**/next-env.d.ts"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({ ...config, files: ["apps/web/**/*.{js,mjs,ts,tsx}"] })),
  {
    languageOptions: { globals: { process: "readonly", console: "readonly", fetch: "readonly", URL: "readonly", Buffer: "readonly", AbortSignal: "readonly", structuredClone: "readonly" } },
    settings: { next: { rootDir: "apps/web/" } },
    rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] },
  },
]);
