import { defineConfig, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { ServerResponse } from "node:http";
import { fetchIcyTitle } from "./server/icy";
import { stations } from "./src/stations";

// Dev/preview endpoint that reads ICY "now playing" metadata server-side,
// sidestepping the browser CORS wall. GET /api/now-playing?url=<stream>.
function nowPlayingPlugin() {
  const allowed = new Set(stations.map((s) => s.url));
  const handler = async (req: Connect.IncomingMessage, res: ServerResponse) => {
    const target = new URL(req.url ?? "", "http://localhost").searchParams.get("url");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    if (!target || !allowed.has(target)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "unknown station" }));
      return;
    }
    try {
      const title = await fetchIcyTitle(target);
      res.end(JSON.stringify({ title }));
    } catch {
      res.end(JSON.stringify({ title: null }));
    }
  };
  return {
    name: "radijas-now-playing",
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use("/api/now-playing", handler);
    },
    configurePreviewServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use("/api/now-playing", handler);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    nowPlayingPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Imtuvas",
        short_name: "Imtuvas",
        description: "Lietuvos radijo stotys gyvai",
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
            handler: "NetworkFirst", // always try the network first; fall back to cache only offline
            options: {
              cacheName: "pages-cache",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
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
