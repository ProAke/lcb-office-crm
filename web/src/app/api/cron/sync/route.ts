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
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    const qs = new URL(request.url).searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let synced = 0;
  for (const post of listPosts()) {
    if (post.channels.some((c) => c.status === "published")) {
      syncPostMetrics(post.id);
      synced += 1;
    }
  }

  return NextResponse.json({ ok: true, synced, at: new Date().toISOString() });
}
