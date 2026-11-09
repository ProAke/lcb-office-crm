"use server";

import { revalidatePath } from "next/cache";
import { createPost, markPostPublished, syncPostMetrics } from "@/lib/crm/repo";
import { publishToChannel } from "@/lib/channels";
import type { ChannelName } from "@/lib/crm/types";

export type PublishFormState = { error?: string; results?: string[] };

export async function createAndPublishPostAction(
  _prev: PublishFormState,
  formData: FormData,
): Promise<PublishFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const channels = (formData.getAll("channels") as string[]).filter((c): c is ChannelName =>
    ["line", "facebook", "web"].includes(c),
  );

  if (!title || !body) return { error: "กรุณากรอกหัวข้อและเนื้อความ" };
  if (!channels.length) return { error: "เลือกอย่างน้อย 1 ช่องทาง" };

  const post = createPost({
    kind: String(formData.get("kind")) === "promotion" ? "promotion" : "news",
    title,
    body,
    channels,
  });

  // ยิงออกแต่ละช่องทาง (token ไม่ได้ตั้ง → โหมดเดโมจำลองความสำเร็จ)
  const results: string[] = [];
  for (const ch of channels) {
    const r = await publishToChannel(ch, body);
    results.push(`${ch}: ${r.note}`);
  }
  markPostPublished(post.id);

  revalidatePath("/publish");
  revalidatePath("/promotions");
  return { results };
}

/** "ดึงข้อมูลกลับ" — ซิงก์ยอด reach/clicks จากทุกช่องทางเข้าระบบ */
export async function syncMetricsAction(formData: FormData): Promise<void> {
  syncPostMetrics(Number(formData.get("id")));
  revalidatePath("/publish");
  revalidatePath("/promotions");
  revalidatePath("/dashboard");
}
