"use server";

import { revalidatePath } from "next/cache";
import {
  appendIncomingMessage,
  appendOutgoingMessage,
  getConversation,
  markConversationRead,
  setConversationAiAuto,
} from "@/lib/crm/repo";
import { generateReply } from "@/lib/ai/engine";

export type ChatFormState = { error?: string };

/** เจ้าหน้าที่ตอบกลับเอง */
export async function sendReplyAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("conversationId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!id || !text) return;
  appendOutgoingMessage(id, text, "staff");
  revalidatePath("/chat");
}

/** ให้ AI วิเคราะห์ข้อความล่าสุดของลูกค้า แล้วตอบกลับ */
export async function askAiAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("conversationId"));
  const conv = getConversation(id);
  if (!conv) return;
  const lastIn = [...conv.messages].reverse().find((m) => m.direction === "in");
  if (!lastIn) return;
  const reply = generateReply(conv, lastIn.text);
  appendOutgoingMessage(id, reply.text, "ai");
  revalidatePath("/chat");
  revalidatePath("/service"); // AI อาจสร้างการจองให้
}

export async function toggleAiAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("conversationId"));
  const conv = getConversation(id);
  if (!conv) return;
  setConversationAiAuto(id, !conv.aiAuto);
  revalidatePath("/chat");
}

export async function markReadAction(formData: FormData): Promise<void> {
  markConversationRead(Number(formData.get("conversationId")));
  revalidatePath("/chat");
}

/**
 * จำลองข้อความเข้าจากลูกค้า (ของจริงคือ LINE webhook → /api/webhooks/line)
 * ถ้าห้องนี้เปิด AI อัตโนมัติ → AI ตอบทันทีตาม flow จริง
 */
export async function simulateIncomingAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("conversationId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!id || !text) return;
  const conv = appendIncomingMessage(id, text);
  if (conv?.aiAuto) {
    const reply = generateReply(conv, text);
    appendOutgoingMessage(id, reply.text, "ai");
  }
  revalidatePath("/chat");
  revalidatePath("/service");
  revalidatePath("/dashboard");
}
