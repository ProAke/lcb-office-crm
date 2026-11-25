import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";
import { bootstrapConfig } from "./bootstrap";

/**
 * เทียบเท่า session_start() + $_SESSION ของ PHP
 * แต่เก็บสถานะไว้ใน signed cookie (JWT) แทนไฟล์ session บนเซิร์ฟเวอร์
 * ข้อดี: scale ได้, ไม่ต้องใช้ Redis ก็ได้ (ถ้าต้องการ revoke ทันทีให้ใช้ DB/Redis)
 */

export { SESSION_COOKIE };
const MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "viewer";
  bootstrap?: boolean;
};

function secretKey() {
  const configured = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32 || configured === "change-me-to-a-random-32-byte-string" || configured === "dev-only-secret-please-change-in-production-32")) {
    throw new Error("AUTH_SECRET ต้องเป็นค่าลับที่ปลอดภัยอย่างน้อย 32 ตัวอักษรใน production");
  }
  const secret = configured ?? "dev-only-secret-please-change-in-production-32";
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const bootstrap = user.bootstrap ? bootstrapConfig() : null;
  if (user.bootstrap && !bootstrap) throw new Error("Temporary access is not configured or has expired");
  const maxAge = bootstrap ? Math.min(MAX_AGE_SECONDS, Math.floor((bootstrap.expiry - Date.now()) / 1000)) : MAX_AGE_SECONDS;
  if (maxAge <= 0) throw new Error("Temporary access has expired");
  const token = await new SignJWT({ ...user, ...(bootstrap ? { bootstrapFingerprint: bootstrap.fingerprint } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.bootstrap === true) {
      const config = bootstrapConfig();
      if (!config || payload.bootstrapFingerprint !== config.fingerprint || payload.role !== "admin" || Number(payload.sub) !== -1) return null;
    }
    return {
      id: Number(payload.sub ?? payload.id),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: (payload.role as SessionUser["role"]) ?? "staff",
      ...(payload.bootstrap === true ? { bootstrap: true } : {}),
    };
  } catch {
    return null;
  }
}
