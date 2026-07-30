import express from "express";
import http from "node:http";
import path from "node:path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WebSocketServer, WebSocket } from "ws";
import { loadState, saveState } from "./dataStore";
import { checkPassword, issueToken, isValidToken, requireAuth } from "./auth";
import { reducer } from "../src/shared/reducer";
import { validateAction } from "./validateAction";
import { buildSitePayload, buildBoardPayload } from "../src/shared/sharePayload";
import { loadDotEnv } from "./loadEnv";

loadDotEnv();

const PORT = Number(process.env.PORT) || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (!APP_PASSWORD) {
  console.error(
    "APP_PASSWORD env var is required — refusing to start without a shared password.\n" +
      "Vérifiez qu'un fichier .env existe dans ce dossier avec une ligne APP_PASSWORD=... " +
      "(enregistré en texte brut, pas via un éditeur qui sauvegarde en UTF-16)."
  );
  process.exit(1);
}

let state = loadState();

const app = express();
app.disable("x-powered-by");
// Trust the nginx reverse proxy in front of us (exactly one hop) so
// req.ip / X-Forwarded-For reflect the real client IP — otherwise the login
// rate limiter would see every request as coming from nginx itself and rate
// limit everyone together instead of the actual offender.
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Slows down password guessing: a handful of tries per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez plus tard." },
});

app.post("/api/login", loginLimiter, (req, res) => {
  const password = req.body?.password;
  if (typeof password !== "string" || !checkPassword(password)) {
    res.status(401).json({ error: "Mot de passe incorrect." });
    return;
  }
  res.json({ token: issueToken() });
});

app.get("/api/state", requireAuth, (_req, res) => {
  res.json(state);
});

const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Generic error handler: never leak stack traces or internals to clients.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "Requête invalide." });
    return;
  }
  console.error("Unhandled request error:", err);
  res.status(500).json({ error: "Erreur serveur." });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 256 * 1024 });

interface ShareSub {
  kind: "site" | "board";
  entityId: string;
}

const shareSubs = new Map<WebSocket, ShareSub>();

// Very small token-bucket per connection to stop a single client (buggy or
// malicious) from flooding the server with action messages.
const RATE_LIMIT_CAPACITY = 40;
const RATE_LIMIT_REFILL_PER_SEC = 10;
function makeLimiter() {
  let tokens = RATE_LIMIT_CAPACITY;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(RATE_LIMIT_CAPACITY, tokens + ((now - last) / 1000) * RATE_LIMIT_REFILL_PER_SEC);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

function shareStateFor(sub: ShareSub) {
  const payload = sub.kind === "site" ? buildSitePayload(state, sub.entityId) : buildBoardPayload(state, sub.entityId);
  return JSON.stringify({ type: "share-state", payload });
}

function broadcastState() {
  const payload = JSON.stringify({ type: "state", state });
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    const sub = shareSubs.get(client);
    if (sub) {
      client.send(shareStateFor(sub));
    } else {
      client.send(payload);
    }
  });
}

// No Origin header at all (non-browser clients) is allowed — the real
// protection is the token/shareId. When an Origin IS present (every browser
// sends one for WS), it must match this host, to block a malicious page on
// another site from opening a connection using a visitor's saved
// credentials (cross-site WebSocket hijacking).
wss.on("connection", (ws, req) => {
  const host = req.headers.host;
  const originHeader = req.headers.origin;
  if (originHeader && host) {
    try {
      if (new URL(originHeader).host !== host) {
        ws.close(4403, "forbidden origin");
        return;
      }
    } catch {
      ws.close(4403, "forbidden origin");
      return;
    }
  }

  const url = new URL(req.url ?? "", "http://localhost");
  const token = url.searchParams.get("token");
  const shareId = url.searchParams.get("shareId");

  if (shareId) {
    const site = state.sites.find((s) => s.shareId === shareId);
    const board = !site ? state.boards.find((b) => b.shareId === shareId) : undefined;
    if (!site && !board) {
      ws.close(4404, "not found");
      return;
    }
    const sub: ShareSub = site ? { kind: "site", entityId: site.id } : { kind: "board", entityId: board!.id };
    shareSubs.set(ws, sub);
    ws.send(shareStateFor(sub));
    ws.on("close", () => shareSubs.delete(ws));
    // Read-only: any incoming message is simply ignored (no reducer access).
    return;
  }

  if (!isValidToken(token)) {
    ws.close(4401, "unauthorized");
    return;
  }

  const allowMessage = makeLimiter();
  ws.send(JSON.stringify({ type: "state", state }));

  ws.on("message", (raw) => {
    if (!allowMessage()) return;
    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;
    const m = msg as { type?: string; action?: unknown };
    if (m.type !== "action") return;
    const action = validateAction(m.action);
    if (!action) return;
    state = reducer(state, action);
    saveState(state);
    broadcastState();
  });
});

server.listen(PORT, () => {
  console.log(`SysView server listening on port ${PORT}`);
});
