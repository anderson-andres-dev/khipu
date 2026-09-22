import { defineConfig } from "vitest/config";

// Solo cubre los modulos puros de sqlContext/sqlCompletionPolicy/sqlSchema
// (sin DOM ni Tauri) - no hace falta el plugin de SvelteKit para esto.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      $lib: new URL("./src/lib", import.meta.url).pathname,
      "$app/environment": new URL("./src/lib/__test-stubs__/app-environment.ts", import.meta.url).pathname,
    },
  },
});
