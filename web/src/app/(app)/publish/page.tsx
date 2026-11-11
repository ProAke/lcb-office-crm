import type { Metadata } from "next";
import { listPosts, listPromotions } from "@/lib/crm/repo";
import { CHANNEL_LABEL, thDate, thTime } from "@/lib/format";
import Composer from "./Composer";
import { syncMetricsAction } from "./actions";

export const metadata: Metadata = { title: "เผยแพร่ทุกช่องทาง" };
export const dynamic = "force-dynamic";

const CHANNEL_STYLE: Record<string, string> = {
  line: "bg-emerald-500",
  facebook: "bg-blue-600",
  web: "bg-slate-600",
};

export default async function PublishPage() {
  const posts = listPosts();
  const promoDrafts = listPromotions().filter((p) => p.status === "active");
  const totalReach = posts.reduce(
    (s, p) => s + p.channels.reduce((x, c) => x + c.reach, 0),
    0,
  );
  const totalClicks = posts.reduce(
    (s, p) => s + p.channels.reduce((x, c) => x + c.clicks, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Publishing Hub — เผยแพร่ทุกช่องทางในเว็บเดียว</h1>
        <p className="mt-1 text-sm text-muted">
          เขียนครั้งเดียว → กระจายไป LINE OA, Facebook, หน้าเว็บพร้อมกัน → ดึงยอด reach/clicks กลับมาวัดผล
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs text-muted">โพสต์ทั้งหมด</p><p className="mt-1 text-2xl font-semibold">{posts.length}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">Reach รวมทุกช่องทาง</p><p className="mt-1 text-2xl font-semibold text-brand-600">{totalReach.toLocaleString("th-TH")}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">Clicks รวมทุกช่องทาง</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{totalClicks.toLocaleString("th-TH")}</p></div>
      </div>

      <Composer activePromos={promoDrafts.map((p) => ({ id: p.id, title: p.title, code: p.code }))} />

      {/* รายการโพสต์ */}
      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${post.kind === "promotion" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                    {post.kind === "promotion" ? "โปรโมชัน" : "ข่าวสาร"}
                  </span>
                  <p className="text-xs text-muted">{thDate(post.createdAt)} · {thTime(post.createdAt)}</p>
                </div>
                <h2 className="mt-1.5 font-semibold leading-snug">{post.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{post.body}</p>
              </div>
              <form action={syncMetricsAction}>
                <input type="hidden" name="id" value={post.id} />
                <button
                  className="shrink-0 rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-medium text-brand-700 ring-1 ring-brand-500/20 hover:bg-brand-500/20"
                  title="ดึงยอด reach/clicks ล่าสุดจากทุกช่องทางกลับเข้าระบบ"
                >
                  🔄 ดึงข้อมูลกลับ
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {post.channels.map((ch) => (
                <div key={ch.name} className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white ${CHANNEL_STYLE[ch.name]}`}>
                    {ch.name === "line" ? "LINE" : ch.name === "facebook" ? "FB" : "WEB"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      {CHANNEL_LABEL[ch.name]}
                      {ch.status === "published" ? (
                        <span className="text-emerald-600">✓ เผยแพร่แล้ว</span>
                      ) : ch.status === "pending" ? (
                        <span className="text-amber-600">…รอกระจาย</span>
                      ) : (
                        <span className="text-red-600">✗ ล้มเหลว</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      👁 {ch.reach.toLocaleString()} · 🖱 {ch.clicks.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
