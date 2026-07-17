"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();
const PORT = Number(process.env.PORT || 3000);
const MAX_REQUEST_BYTES = Number(process.env.MAX_REQUEST_BYTES || 10 * 1024 * 1024);
const ROOT = __dirname;
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const demoFindings = [
  { area: "Front bumper", damage: "Surface scratch", severity: "Minor", confidence: 94, costMin: 250, costMax: 550 },
  { area: "Driver-side door", damage: "Small dent", severity: "Moderate", confidence: 88, costMin: 450, costMax: 900 }
];

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { status: "ok", mode: process.env.ANTHROPIC_API_KEY ? "live" : "demo" });
  if (req.method === "POST" && url.pathname === "/api/analyze") return analyze(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed" });
  return serveStatic(url.pathname, req.method, res);
});

async function analyze(req, res) {
  try {
    const body = await readJson(req);
    if (!Array.isArray(body.images) || body.images.length < 1 || body.images.length > 8) return json(res, 400, { error: "Provide 1 to 8 images." });
    for (const image of body.images) if (!/^image\/(jpeg|png|webp)$/.test(image.mediaType) || typeof image.data !== "string") return json(res, 400, { error: "Only JPG, PNG, and WebP images are supported." });
    if (!process.env.ANTHROPIC_API_KEY) return json(res, 200, { mode: "demo", findings: demoFindings });
    const findings = await callAnthropic(body.images);
    return json(res, 200, { mode: "live", findings });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Analysis error:", error);
    return json(res, status, { error: status === 500 ? "Unable to complete analysis." : error.message });
  }
}

async function callAnthropic(images) {
  const content = images.map((image) => ({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } }));
  content.push({ type: "text", text: "Inspect only visible exterior vehicle damage. Return ONLY a JSON array. Each item must have area, damage, severity (Minor/Moderate/Severe), confidence (0-100 integer), costMin, costMax (nonnegative USD numbers). Do not infer hidden damage, fault, safety, or coverage. If no visible damage, return []." });
  const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", max_tokens: 1400, temperature: 0, messages: [{ role: "user", content }] }) });
  if (!response.ok) throw Object.assign(new Error(`AI provider returned ${response.status}.`), { statusCode: 502 });
  const data = await response.json(); const text = data.content?.find((item) => item.type === "text")?.text || "[]";
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  if (!Array.isArray(parsed)) throw new Error("AI provider returned an unexpected result.");
  return parsed.slice(0, 20);
}

function readJson(req) {
  return new Promise((resolve, reject) => { let size = 0; const chunks = [];
    req.on("data", (chunk) => { size += chunk.length; if (size > MAX_REQUEST_BYTES) { reject(Object.assign(new Error("Payload too large."), { statusCode: 413 })); req.destroy(); } else chunks.push(chunk); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(Object.assign(new Error("Invalid JSON."), { statusCode: 400 })); } }); req.on("error", reject);
  });
}

function serveStatic(pathname, method, res) {
  let decoded; try { decoded = decodeURIComponent(pathname); } catch { return json(res, 400, { error: "Invalid path" }); }
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, ""); const file = path.resolve(ROOT, relative);
  if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) return json(res, 403, { error: "Forbidden" });
  fs.stat(file, (error, stat) => { if (error || !stat.isFile()) return json(res, 404, { error: "Not found" }); const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Content-Length": stat.size, "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400" }); if (method === "HEAD") return res.end(); fs.createReadStream(file).pipe(res);
  });
}

function securityHeaders(res) { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("X-Frame-Options", "DENY"); res.setHeader("Referrer-Policy", "no-referrer"); res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'self'"); }
function json(res, status, value) { const body = JSON.stringify(value); res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store" }); res.end(body); }
function loadEnvFile() { const file = path.join(__dirname, ".env"); if (!fs.existsSync(file)) return; for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); } }

server.listen(PORT, () => console.log(`Vehicle Inspection AI: http://localhost:${PORT} (${process.env.ANTHROPIC_API_KEY ? "live" : "demo"} mode)`));
