import fs from "node:fs";
import path from "node:path";

// Minimal .env loader for running the server directly (e.g. `npm run
// server` on a laptop). In Docker, environment variables are already
// injected by docker-compose and there's no .env file in the container, so
// this quietly does nothing there.
export function loadDotEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
