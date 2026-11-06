// Local production-export preview. No query endpoints, request logs or proxy.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".wasm": "application/wasm", ".woff2": "font/woff2" };
createServer(async (req, res) => {
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = pathname.replace(/^\/+/, "");
    const file = resolve(root, relative || "index.html");
    if (!file.startsWith(root + sep)) throw new Error("outside export");
    const candidates = [file, `${file}.html`, resolve(file, "index.html")];
    for (const candidate of candidates) {
      if (!candidate.startsWith(root + sep)) continue;
      try {
        if (!(await stat(candidate)).isFile()) continue;
        const data = await readFile(candidate);
        res.writeHead(200, { "Content-Type": types[extname(candidate)] ?? "application/octet-stream", "Cache-Control": "no-store" });
        res.end(req.method === "HEAD" ? undefined : data); return;
      } catch { /* next static candidate */ }
    }
    res.writeHead(404); res.end("Not found");
  } catch { res.writeHead(400); res.end("Invalid path"); }
}).listen(Number(process.env.PORT ?? 4173), "127.0.0.1", () => console.log(`GHOSTSCAN production preview: http://127.0.0.1:${process.env.PORT ?? 4173}`));
