import { NextResponse } from "next/server";
import { completeSetup } from "@/lib/file-setup";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  // Reject cross-origin browser requests. Hosting must forward the actual public host.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try { if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 }); }
  catch { return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 }); }
  try {
    const data = await request.json();
    if (typeof data.code !== "string" || data.code.length > 128 || typeof data.password !== "string" || data.password !== data.confirm || Buffer.byteLength(data.password, "utf8") < 16 || Buffer.byteLength(data.password, "utf8") > 72) return NextResponse.json({ error: "ตรวจสอบรหัสตั้งค่าและรหัสผ่านอย่างน้อย 16 ตัวอักษร (ไม่เกิน 72 ไบต์)" }, { status: 400 });
    if (!await completeSetup(data.code, data.password)) return NextResponse.json({ error: "รหัสตั้งค่าไม่ถูกต้อง หมดอายุ หรือใช้ไปแล้ว" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "ตั้งค่าไม่สำเร็จ กรุณาติดต่อผู้ดูแลโฮสต์" }, { status: 500 }); }
}
