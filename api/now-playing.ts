import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchIcyTitle } from "../server/icy";
import { stations } from "../src/stations";

// Vercel serverless function: GET /api/now-playing?url=<stream>
// Reads ICY "now playing" metadata server-side (same logic as the Vite dev proxy).
const allowed = new Set(stations.map((s) => s.url));

export default async function handler(req: IncomingMessage, res: ServerResponse) {
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
}
