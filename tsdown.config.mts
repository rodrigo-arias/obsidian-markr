import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(({ watch }) => ({
  entry: { main: "main.ts" },
  format: "cjs",
  outDir: ".",
  outExtensions: () => ({ js: ".js" }),
  target: "es2022",
  alias: { "@": srcDir },
  deps: {
    neverBundle: ["obsidian", "electron", /^@codemirror\//, /^@lezer\//],
  },
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  clean: false,
}));
