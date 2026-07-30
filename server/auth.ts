import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// The token is a deterministic hash of the shared password rather than a
// random session id. That keeps auth stateless — no server-side session
// store — so a server restart or redeploy never logs anyone out; only
// changing APP_PASSWORD does.
function tokenFor(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  return timingSafeStringEqual(password ?? "", expected);
}

export function issueToken(): string {
  return tokenFor(process.env.APP_PASSWORD ?? "");
}

export function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return timingSafeStringEqual(token, issueToken());
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!isValidToken(token)) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }
  next();
}
