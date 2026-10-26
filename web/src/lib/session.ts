import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";

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
};

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ?? "dev-only-secret-please-change-in-production-32";
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
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
    return {
      id: Number(payload.sub ?? payload.id),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: (payload.role as SessionUser["role"]) ?? "staff",
    };
  } catch {
    return null;
  }
}
