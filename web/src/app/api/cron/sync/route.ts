import { NextResponse, type NextRequest } from "next/server";
import { listPosts, syncPostMetrics } from "@/lib/crm/repo";

/**
 * Cron: ดึงผลโพสต์จากทุกช่องทางกลับเข้าระบบเป็นระยะ
 * -------------------------------------------------------------------------
 * เทียบเท่า cron/*.php ของระบบเดิม — ตั้ง cron ของ hosting/Vercel Cron:
 *   0,30 (ทุก 30 นาที)  curl -H "Authorization: Bearer $CRON_SECRET"
 *                        https://<โดเมน>/api/cron/sync
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron is not configured" }, { status: 503 });
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "real channel insights are not implemented" }, { status: 501 });

  let synced = 0;
  for (const post of listPosts()) {
    if (post.channels.some((c) => c.status === "published")) {
      syncPostMetrics(post.id);
      synced += 1;
    }
  }

  return NextResponse.json({ ok: true, demo: true, synced, at: new Date().toISOString() });
}
