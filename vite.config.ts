import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: "src/main.js",
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: "src/backend/preload.js",
      },
    },
  },
  renderer: {
    root: "src",
    build: {
      rollupOptions: {
        input: "src/index.html",
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/frontend"),
      },
    },
    plugins: [react(), tsconfigPaths()],
  },
});
