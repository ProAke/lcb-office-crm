import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  appendIncomingMessage,
  appendOutgoingMessage,
  findOrCreateConversation,
} from "@/lib/crm/repo";
import { generateReply } from "@/lib/ai/engine";

/**
 * LINE Messaging API Webhook — แทน webhook.php ของระบบเดิม
 * -------------------------------------------------------------------------
 * ตั้งค่าในหน้า LINE Developers Console:
 *   Webhook URL: https://<โดเมน>/api/webhooks/line   (ต้องเป็น HTTPS)
 *
 * พฤติการณ์:
 *   1) ตรวจลายเซ็น x-line-signature ด้วย LINE_CHANNEL_SECRET (ถ้าตั้งค่าไว้)
 *   2) รับข้อความเข้า → บันทึกลงกล่องแชทกลาง (data store / MySQL ให้หลัง)
 *   3) ถ้าห้องเปิด AI Auto → AI ตอบทันที และ push กลับผ่าน LINE Reply API
 */

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type: string; text?: string };
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return true; // dev เดโม: ยังไม่ได้ตั้ง secret
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  return digest === signature;
}

async function replyToLine(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return; // เดโม: เก็บไว้ในกล่องแชทกลางแทน
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  }).catch(() => undefined);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-line-signature");
  if (!verifySignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  for (const event of payload.events ?? []) {
    if (event.type !== "message" || event.message?.type !== "text") continue;
    const text = event.message.text?.trim();
    const userId = event.source?.userId;
    if (!text || !userId) continue;

    const conv = findOrCreateConversation("line", userId, `LINE·${userId.slice(-6)}`);
    appendIncomingMessage(conv.id, text);

    if (conv.aiAuto) {
      const reply = generateReply(conv, text);
      appendOutgoingMessage(conv.id, reply.text, "ai");
      if (event.replyToken) await replyToLine(event.replyToken, reply.text);
    }
  }

  return NextResponse.json({ ok: true });
}

/** LINE console เรียก GET เพื่อ verify endpoint บางครั้ง */
export async function GET() {
  return NextResponse.json({ ok: true, service: "lcb-line-webhook" });
}
