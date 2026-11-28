"use server";

import { revalidatePath } from "next/cache";
import { createPost, setPostChannelResult, syncPostMetrics } from "@/lib/crm/repo";
import { publishToChannel } from "@/lib/channels";
import type { ChannelName } from "@/lib/crm/types";
import { getSession } from "@/lib/session";

export type PublishFormState = { error?: string; results?: string[] };

export async function createAndPublishPostAction(
  _prev: PublishFormState,
  formData: FormData,
): Promise<PublishFormState> {
  const user = await getSession();
  if (user?.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบเท่านั้นที่เผยแพร่ได้" };
  if (formData.get("confirmPublish") !== "yes") return { error: "กรุณายืนยันก่อนส่งไปช่องทางจริง" };
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const channels = [...new Set((formData.getAll("channels") as string[]).filter((c): c is ChannelName =>
    ["line", "facebook", "web"].includes(c),
  ))];

  if (!title || !body) return { error: "กรุณากรอกหัวข้อและเนื้อความ" };
  if (!channels.length) return { error: "เลือกอย่างน้อย 1 ช่องทาง" };

  const post = createPost({
    kind: String(formData.get("kind")) === "promotion" ? "promotion" : "news",
    title,
    body,
    channels,
  });

  // จัดเก็บผลแยกช่องทาง ไม่รายงานว่าสำเร็จเมื่อส่งไม่สำเร็จ
  const results: string[] = [];
  for (const ch of channels) {
    const r = await publishToChannel(ch, body);
    setPostChannelResult(post.id, ch, r.ok, r.note, r.uncertain);
    results.push(`${ch}: ${r.note}`);
  }

  revalidatePath("/publish");
  revalidatePath("/promotions");
  return { results };
}

/** "ดึงข้อมูลกลับ" — ซิงก์ยอด reach/clicks จากทุกช่องทางเข้าระบบ */
export async function syncMetricsAction(formData: FormData): Promise<void> {
  const user = await getSession();
  if (user?.role !== "admin" || process.env.NODE_ENV === "production") return;
  syncPostMetrics(Number(formData.get("id")));
  revalidatePath("/publish");
  revalidatePath("/promotions");
  revalidatePath("/dashboard");
}
