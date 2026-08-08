import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "app/error.tsx",
        "features/applications/components/application-form.tsx",
        "features/auth/components/login-form.tsx",
        "features/auth/components/sign-up-form.tsx",
        "lib/validations.ts",
        "lib/startup-form.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
