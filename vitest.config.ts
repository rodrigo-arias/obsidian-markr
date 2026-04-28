import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      obsidian: path.resolve(root, "test/obsidian-stub.ts"),
      "@": path.resolve(root, "src"),
    },
  },
});
