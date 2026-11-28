import type { ChannelName } from "@/lib/crm/types";

/** API success means the provider accepted the request, not customer delivery. */
export type ChannelResult = { ok: boolean; note: string; uncertain?: boolean };
export async function publishToChannel(channel: ChannelName, body: string): Promise<ChannelResult> {
  try {
    if (channel === "line") {
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
      if (!token) return { ok: false, note: "ยังไม่ได้ตั้งค่า LINE token — ไม่ได้ส่ง" };
      const res = await fetch("https://api.line.me/v2/bot/message/broadcast", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ messages: [{ type: "text", text: body }] }), signal: AbortSignal.timeout(10000) });
      return res.ok ? { ok: true, note: "LINE API รับคำขอแล้ว (ยังไม่ยืนยันการส่งถึงลูกค้า)" } : { ok: false, note: `LINE API ปฏิเสธคำขอ (HTTP ${res.status})` };
    }
    if (channel === "facebook") {
      const token = process.env.FB_PAGE_ACCESS_TOKEN?.trim();
      const id = process.env.FB_PAGE_ID?.trim();
      if (!token || !id) return { ok: false, note: "ยังไม่ได้ตั้งค่า Facebook Page ID และ token — ไม่ได้ส่ง" };
      if (!/^\d+$/.test(id)) return { ok: false, note: "Facebook Page ID ไม่ถูกต้อง — ไม่ได้ส่ง" };
      const res = await fetch(`https://graph.facebook.com/v21.0/${id}/feed`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: body }), signal: AbortSignal.timeout(10000) });
      return res.ok ? { ok: true, note: "Facebook API รับคำขอแล้ว (ยังไม่ยืนยันผลบนหน้าเพจ)" } : { ok: false, note: `Facebook API ปฏิเสธคำขอ (HTTP ${res.status})` };
    }
    return { ok: false, note: "ยังไม่ได้เชื่อมระบบเผยแพร่หน้าเว็บ — ไม่ได้ส่ง" };
  } catch {
    // Timeouts may occur after a provider accepted the post; do not retry automatically.
    return { ok: false, uncertain: true, note: "ผลการส่งไม่แน่ชัด — ตรวจสอบปลายทางก่อนส่งซ้ำ" };
  }
}
