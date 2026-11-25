import { createHash } from "node:crypto";

/** Temporary, opt-in access. A valid bcrypt hash and explicit UTC expiry are required. */
export function bootstrapConfig() {
  if (process.env.BOOTSTRAP_LOGIN_ENABLED !== "true") return null;
  const hash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH ?? "";
  const rawExpiry = process.env.BOOTSTRAP_LOGIN_EXPIRES_AT ?? "";
  const expiry = Date.parse(rawExpiry);
  // Require an unambiguous UTC time and a bcrypt hash with a reasonable cost.
  const match = /^\$2[aby]\$(\d\d)\$[./A-Za-z0-9]{53}$/.exec(hash);
  if (!match || Number(match[1]) < 12 || Number(match[1]) > 14 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(rawExpiry) || !Number.isFinite(expiry) || expiry <= Date.now()) return null;
  return { hash, expiry, fingerprint: createHash("sha256").update(hash).digest("hex") };
}
