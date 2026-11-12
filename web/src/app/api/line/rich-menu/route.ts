import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
const API = "https://api.line.me/v2/bot";
const DATA_API = "https://api-data.line.me/v2/bot";
const ID = /^richmenu-[a-zA-Z0-9]+$/;

function token() { return process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim(); }
async function authorize(write = false) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (write && user.role !== "admin") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  if (!token()) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN บนเซิร์ฟเวอร์" }, { status: 503 });
  return null;
}
async function line(path: string, init: RequestInit = {}, data = false) {
  return fetch(`${data ? DATA_API : API}${path}`, { ...init, headers: { Authorization: `Bearer ${token()}`, ...init.headers }, cache: "no-store" });
}
function fail(message: string, status = 502) { return NextResponse.json({ error: message }, { status }); }

export async function GET() {
  const denied = await authorize(); if (denied) return denied;
  try {
    const [menus, current] = await Promise.all([line("/richmenu/list"), line("/user/all/richmenu")]);
    if (!menus.ok || (!current.ok && current.status !== 404)) return fail("ไม่สามารถอ่าน Rich Menu จาก LINE ได้ โปรดตรวจสอบ token และสิทธิ์ Messaging API");
    const list = await menus.json();
    const defaultId = current.ok ? (await current.json()).richMenuId : null;
    return NextResponse.json({ menus: list.richmenus, defaultId });
  } catch { return fail("เชื่อมต่อ LINE ไม่สำเร็จ"); }
}

export async function POST(request: Request) {
  const denied = await authorize(true); if (denied) return denied;
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const chatBarText = String(form.get("chatBarText") || "").trim();
    const size = String(form.get("size") || "");
    const image = form.get("image");
    let buttons: { label: string; type: string; value: string }[];
    try { buttons = JSON.parse(String(form.get("buttons"))); } catch { return fail("ข้อมูลปุ่มไม่ถูกต้อง", 400); }
    if (!name || name.length > 300 || !chatBarText || chatBarText.length > 14 || !["full", "half"].includes(size) || !Array.isArray(buttons) || buttons.length < 1 || buttons.length > 6 || !(image instanceof File) || !["image/jpeg", "image/png"].includes(image.type) || image.size === 0 || image.size > 1024 * 1024) return fail("กรุณาตรวจสอบชื่อ ข้อความแถบ ขนาด ภาพ PNG/JPEG ไม่เกิน 1 MB และจำนวนปุ่ม 1–6 ปุ่ม", 400);
    for (const b of buttons) {
      if (!b || typeof b.label !== "string" || !b.label.trim() || b.label.length > 20 || typeof b.value !== "string" || !b.value.trim() || !["message", "uri"].includes(b.type)) return fail("ข้อมูลปุ่มไม่ถูกต้อง", 400);
      if (b.type === "message" && b.value.length > 300) return fail("ข้อความปุ่มยาวเกิน 300 ตัวอักษร", 400);
      if (b.type === "uri") { try { if (!["https:", "http:"].includes(new URL(b.value).protocol)) throw new Error(); } catch { return fail("ลิงก์ต้องเป็น URL http หรือ https", 400); } }
    }
    const height = size === "full" ? 1686 : 843;
    const areas = buttons.map((b, i) => {
      const x = Math.floor(i * 2500 / buttons.length), right = Math.floor((i + 1) * 2500 / buttons.length);
      return { bounds: { x, y: 0, width: right - x, height }, action: b.type === "uri" ? { type: "uri", label: b.label.trim(), uri: b.value.trim() } : { type: "message", label: b.label.trim(), text: b.value.trim() } };
    });
    const created = await line("/richmenu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ size: { width: 2500, height }, selected: true, name, chatBarText, areas }) });
    if (!created.ok) return fail("LINE ไม่สามารถสร้างเมนูได้ โปรดตรวจสอบข้อมูลและสิทธิ์ token");
    const { richMenuId } = await created.json();
    if (typeof richMenuId !== "string" || !ID.test(richMenuId)) return fail("LINE ส่งรหัสเมนูไม่ถูกต้อง");
    try {
      const uploaded = await line(`/richmenu/${richMenuId}/content`, { method: "POST", headers: { "Content-Type": image.type }, body: await image.arrayBuffer() }, true);
      if (!uploaded.ok) throw new Error();
    } catch {
      try {
        const cleanup = await line(`/richmenu/${richMenuId}`, { method: "DELETE" });
        if (!cleanup.ok) return fail(`อัปโหลดภาพไม่สำเร็จ และลบเมนูที่สร้างไม่สำเร็จ กรุณาลบ ${richMenuId} ด้วยตนเอง`);
      } catch { return fail(`อัปโหลดภาพไม่สำเร็จ และลบเมนูที่สร้างไม่สำเร็จ กรุณาลบ ${richMenuId} ด้วยตนเอง`); }
      return fail("อัปโหลดภาพไม่สำเร็จ โปรดตรวจสอบขนาดและรูปแบบภาพ เมนูที่สร้างถูกลบแล้ว");
    }
    return NextResponse.json({ richMenuId });
  } catch { return fail("ดำเนินการไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ LINE"); }
}

async function change(request: Request, remove: boolean) {
  const denied = await authorize(true); if (denied) return denied;
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !ID.test(id)) return fail("รหัสเมนูไม่ถูกต้อง", 400);
    const result = await line(remove ? `/richmenu/${id}` : `/user/all/richmenu/${id}`, { method: remove ? "DELETE" : "POST" });
    if (!result.ok) return fail(remove ? "ลบเมนูไม่สำเร็จ โปรดตรวจสอบสถานะเมนูและสิทธิ์ LINE" : "ตั้งเมนูหลักไม่สำเร็จ โปรดตรวจสอบว่าเมนูมีภาพแล้ว");
    return NextResponse.json({ ok: true });
  } catch { return fail("เชื่อมต่อ LINE ไม่สำเร็จ"); }
}
export async function PATCH(request: Request) { return change(request, false); }
export async function DELETE(request: Request) { return change(request, true); }
