import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Dev entry lives at src/index.html. `npm run build` bundles everything
// (JS + CSS, no chunks) into dist/index.html, then the `build` npm script
// copies that single file over the repo-root index.html — the deployable
// artifact stays a single self-contained HTML file, same as before.
export default defineConfig({
  root: "src",
  base: "./",
  publicDir: false,
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
