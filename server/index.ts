import express from "express";
import http from "node:http";
import path from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { loadState, saveState } from "./dataStore";
import { checkPassword, issueToken, isValidToken, requireAuth } from "./auth";
import { reducer, type Action } from "../src/shared/reducer";
import { loadDotEnv } from "./loadEnv";

loadDotEnv();

const PORT = Number(process.env.PORT) || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD;

if (!APP_PASSWORD) {
  console.error("APP_PASSWORD env var is required — refusing to start without a shared password.");
  process.exit(1);
}

let state = loadState();

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", (req, res) => {
  const password = req.body?.password ?? "";
  if (!checkPassword(password)) {
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

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcastState() {
  const payload = JSON.stringify({ type: "state", state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const token = url.searchParams.get("token");
  if (!isValidToken(token)) {
    ws.close(4401, "unauthorized");
    return;
  }

  ws.send(JSON.stringify({ type: "state", state }));

  ws.on("message", (raw) => {
    let msg: { type?: string; action?: Action };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "action" && msg.action) {
      state = reducer(state, msg.action);
      saveState(state);
      broadcastState();
    }
  });
});

server.listen(PORT, () => {
  console.log(`SysView server listening on port ${PORT}`);
});
