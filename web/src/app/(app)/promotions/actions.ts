"use server";

import { revalidatePath } from "next/cache";
import {
  createPost,
  createPromotion,
  getPromotion,
  setPromotionStatus,
} from "@/lib/crm/repo";
import type { ChannelName, PromotionStatus } from "@/lib/crm/types";

export type PromoFormState = { error?: string };

const ALLOWED_TRANSITIONS: Record<PromotionStatus, PromotionStatus[]> = {
  draft: ["active"],
  scheduled: ["active", "draft"],
  active: ["expired", "draft"],
  expired: [],
};

export async function createPromotionAction(
  _prev: PromoFormState,
  formData: FormData,
): Promise<PromoFormState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "กรุณากรอกชื่อโปรโมชัน" };

  const channels = (formData.getAll("channels") as string[]).filter((c): c is ChannelName =>
    ["line", "facebook", "web"].includes(c),
  );

  createPromotion({
    title,
    description: String(formData.get("description") ?? "").trim(),
    discountType: String(formData.get("discountType")) === "percent" ? "percent" : "baht",
    discountValue: Number(formData.get("discountValue") ?? 0),
    startDate: String(formData.get("startDate") ?? new Date().toISOString().slice(0, 10)),
    endDate: String(formData.get("endDate") ?? new Date().toISOString().slice(0, 10)),
    channels,
  });

  revalidatePath("/promotions");
  return {};
}

export async function changePromotionStatusAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const target = String(formData.get("status")) as PromotionStatus;
  const p = getPromotion(id);
  if (p && ALLOWED_TRANSITIONS[p.status]?.includes(target)) {
    setPromotionStatus(id, target);
  }
  revalidatePath("/promotions");
}

/** "เผยแพร่ตอนนี้" — สร้างโพสต์เผยแพร่จากการ์ดโปรโมชันไปทุกช่องทางที่ตั้งไว้ */
export async function publishPromotionAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const p = getPromotion(id);
  if (!p || !p.channels.length) return;

  const disc =
    p.discountType === "percent" ? `ลด ${p.discountValue}%` : `มูลค่า ${p.discountValue.toLocaleString("th-TH")} บาท`;
  createPost({
    kind: "promotion",
    refPromotionId: p.id,
    title: `${p.code} — ${p.title}`,
    body: `🔥 ${p.title}\n${p.description}\n\nส่วนลด ${disc} | ${p.startDate} ถึง ${p.endDate}\nจองคิวติดตั้งผ่าน LINE OA ได้เลย!`,
    channels: p.channels,
  });

  if (p.status === "draft") setPromotionStatus(id, "active");
  revalidatePath("/promotions");
  revalidatePath("/publish");
}
