import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "My Radio App",
        short_name: "Radio App",
        description: "A Progressive Web App for streaming radio stations",
        theme_color: "#1A1A1A",
        background_color: "#1A1A1A",
        display: "standalone",
        start_url: "/",
        id: "/",
        icons: [
          {
            src: "/radio.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }: any) => url.pathname.startsWith("/"),
            handler: "CacheFirst",
            options: {
              cacheName: "pages-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }: any) => url.origin.includes("stream"),
            handler: "NetworkOnly", // No caching for live streams
          },
        ],
      },
    }),
  ],
});
