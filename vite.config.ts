import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // Make all paths relative
  build: {
    outDir: "dist", // Output directory
    assetsDir: "assets", // Assets folder
  },
});
