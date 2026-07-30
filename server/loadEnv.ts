import fs from "node:fs";
import path from "node:path";

// Decodes a .env file regardless of how Windows tools saved it: plain
// UTF-8, UTF-8 with a BOM, or UTF-16LE (the default for Notepad "Save As"
// and PowerShell's Out-File/Set-Content on older PowerShell versions).
function decode(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf-8");
  }
  return buffer.toString("utf-8");
}

// Minimal .env loader for running the server directly (e.g. `npm run
// server` on a laptop). In Docker, environment variables are already
// injected by docker-compose and there's no .env file in the container, so
// this quietly does nothing there.
export function loadDotEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const text = decode(fs.readFileSync(envPath));
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
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
