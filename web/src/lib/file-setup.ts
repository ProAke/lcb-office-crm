import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const dir = path.join(process.cwd(), "data", "private");
const file = path.join(dir, "setup.json");
type Setup = { state: "pending" | "active"; codeHash?: string; codeExpires?: number; sessionSecret: string; passwordHash?: string; adminExpires?: number };
function read(): Setup | null { try { return JSON.parse(fs.readFileSync(file, "utf8")) as Setup; } catch { return null; } }
export function fileSetupStatus() {
  const data = read();
  return data?.state === "pending" && typeof data.codeExpires === "number" && data.codeExpires > Date.now();
}
export function fileSetupConfig() {
  const data = read();
  if (data?.state !== "active" || typeof data.adminExpires !== "number" || data.adminExpires <= Date.now() || typeof data.passwordHash !== "string" || typeof data.sessionSecret !== "string" || data.sessionSecret.length < 32) return null;
  return { hash: data.passwordHash, expiry: data.adminExpires, sessionSecret: data.sessionSecret, fingerprint: createHash("sha256").update(data.passwordHash).digest("hex") };
}
export async function completeSetup(code: string, password: string) {
  const lock = path.join(dir, "setup.lock");
  try { fs.mkdirSync(lock, { mode: 0o700 }); } catch { return false; }
  try {
    const data = read();
    if (!data || data.state !== "pending" || typeof data.codeExpires !== "number" || data.codeExpires <= Date.now() || typeof data.codeHash !== "string") return false;
    const expected = Buffer.from(data.codeHash, "hex");
    const actual = createHash("sha256").update(code).digest();
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
    const length = Buffer.byteLength(password, "utf8");
    if (length < 16 || length > 72) return false;
    const hash = await bcrypt.hash(password, 12);
    const next = { state: "active", sessionSecret: data.sessionSecret, passwordHash: hash, adminExpires: Date.now() + 24 * 60 * 60 * 1000 };
    const temp = path.join(dir, `.setup-${randomBytes(12).toString("hex")}.tmp`);
    try { fs.writeFileSync(temp, JSON.stringify(next), { mode: 0o600, flag: "wx" }); fs.renameSync(temp, file); }
    finally { try { fs.unlinkSync(temp); } catch {} }
    return true;
  } finally { fs.rmdirSync(lock); }
}
