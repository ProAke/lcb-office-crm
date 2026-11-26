import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";
const options = { headers: { "Cache-Control": "no-store" } };
function error(message: string, status: number) { return NextResponse.json({ error: message }, { ...options, status }); }

export async function POST(request: Request) {
  // Same-origin only. Configure the proxy to preserve the public Host header.
  const origin = request.headers.get("origin"), host = request.headers.get("host");
  try {
    const url = origin ? new URL(origin) : null;
    if (!url || !["https:", "http:"].includes(url.protocol) || url.host !== host) return error("ไม่สามารถยืนยันที่มาของคำขอได้ กรุณาติดต่อผู้ดูแลระบบ", 403);
  } catch { return error("ไม่สามารถยืนยันที่มาของคำขอได้ กรุณาติดต่อผู้ดูแลระบบ", 403); }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return error("รูปแบบคำขอไม่ถูกต้อง", 415);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length < 0 || length > 4096) return error("ข้อมูลยาวเกินกำหนด", 413);
  try {
    const body = await request.json();
    if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 254 || Buffer.byteLength(body.password, "utf8") > 72) return error("ข้อมูลเข้าสู่ระบบไม่ถูกต้อง", 400);
    const result = await login(body.email.trim(), body.password);
    if (!result.ok) return error(result.message, 401);
    await createSession(result.user);
    return NextResponse.json({ ok: true }, options);
  } catch {
    // Never expose credentials, exception details or configuration in responses/logs.
    return error("ระบบเข้าสู่ระบบขัดข้อง กรุณาลองใหม่หรือติดต่อผู้ดูแล", 500);
  }
}
