import fs from "node:fs";
import path from "node:path";
import type { AppState } from "../src/types";
import { getSeedState } from "../src/seedData";
import { migrate } from "../src/shared/reducer";

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), "data", "state.json");

export function loadState(): AppState {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return migrate(JSON.parse(raw));
  } catch {
    return getSeedState();
  }
}

// Atomic write (temp file + rename) so a crash mid-write never corrupts the
// on-disk state.
export function saveState(state: AppState): void {
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
