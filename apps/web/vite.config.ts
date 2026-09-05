import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  define: { CESIUM_BASE_URL: JSON.stringify("/cesium") },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/cesium/Build/Cesium/Workers",
          dest: "cesium",
        },
        {
          src: "node_modules/cesium/Build/Cesium/ThirdParty",
          dest: "cesium",
        },
        {
          src: "node_modules/cesium/Build/Cesium/Assets",
          dest: "cesium",
        },
        {
          src: "node_modules/cesium/Build/Cesium/Widgets",
          dest: "cesium",
        },
        {
          src: "../../cities/catalog.json",
          dest: "cities",
        },
      ],
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 4_000,
    rollupOptions: { output: { manualChunks: { cesium: ["cesium"] } } },
  },
});
