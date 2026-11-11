import type { ChannelName } from "@/lib/crm/types";

/**
 * ชั้นเผยแพร่ไปยังช่องทางภายนอก + ดึงผลกลับ (insights sync)
 * -------------------------------------------------------------------------
 * พฤติกรรม:
 *  - ตั้งค่า token ครบ → เรียก API จริง (LINE Broadcast / Facebook Graph)
 *  - ไม่มี token (โหมดเดโม) → คืน simulated success เพื่อให้ flow ครบวงจร
 *
 * token ทั้งหมดอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น (.env) — ห้ามส่งไป client
 */

export type ChannelResult = { ok: boolean; note: string };

export async function publishToChannel(
  channel: ChannelName,
  body: string,
): Promise<ChannelResult> {
  switch (channel) {
    case "line": {
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!token) return { ok: true, note: "เดโม: ยังไม่มี LINE token — จำลองว่า broadcast สำเร็จ" };
      const res = await fetch("https://api.line.me/v2/bot/message/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: [{ type: "text", text: body }] }),
      });
      return res.ok
        ? { ok: true, note: "ส่ง LINE Broadcast แล้ว" }
        : { ok: false, note: `LINE API ตอบ ${res.status}` };
    }
    case "facebook": {
      const token = process.env.FB_PAGE_ACCESS_TOKEN;
      const pageId = process.env.FB_PAGE_ID;
      if (!token || !pageId)
        return { ok: true, note: "เดโม: ยังไม่มี Facebook token — จำลองว่าโพสต์สำเร็จ" };
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: body, access_token: token }),
        },
      );
      return res.ok
        ? { ok: true, note: "โพสต์ Facebook แล้ว" }
        : { ok: false, note: `Facebook API ตอบ ${res.status}` };
    }
    case "web":
      // เว็บหน้าร้านอ่านจาก store นี้โดยตรง — ถือว่าเผยแพร่ทันที
      return { ok: true, note: "เผยแพร่ขึ้นหน้าเว็บแล้ว" };
  }
}

/**
 * ดึงผล reach/clicks จากช่องทางจริงมาซิงก์เข้าระบบ
 * เดโม: เพิ่มยอดแบบสุ่ม — ของจริงเรียก LINE insight API / Facebook insights edge
 */
export async function fetchChannelInsights(
  channel: ChannelName,
): Promise<{ reachDelta: number; clicksDelta: number }> {
  // TODO(ของจริง): LINE = GET /v2/bot/insight/message/delivery?date=…
  //                Facebook = GET /{post-id}/insights?metric=post_impressions,post_clicks
  void channel;
  return {
    reachDelta: Math.floor(50 + Math.random() * 400),
    clicksDelta: Math.floor(5 + Math.random() * 60),
  };
}
