import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Fijamos la zona horaria para que los tests den igual en cualquier ordenador.
    env: { TZ: "Europe/Madrid" },
  },
});
