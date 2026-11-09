import type { Metadata } from "next";
import { listPromotions } from "@/lib/crm/repo";
import { CHANNEL_LABEL, thDate } from "@/lib/format";
import NewPromotionForm from "./NewPromotionForm";
import { changePromotionStatusAction, publishPromotionAction } from "./actions";

export const metadata: Metadata = { title: "โปรโมชัน" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "กำลังวิ่ง", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  scheduled: { label: "ตั้งเวลาไว้", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  draft: { label: "แบบร่าง", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  expired: { label: "สิ้นสุดแล้ว", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export default async function PromotionsPage() {
  const promos = listPromotions();
  const active = promos.filter((p) => p.status === "active");
  const totalViews = promos.reduce((s, p) => s + p.views, 0);
  const totalClaims = promos.reduce((s, p) => s + p.claims, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">โปรโมชันรายเดือน</h1>
        <p className="mt-1 text-sm text-muted">
          วางแผนโปรทุกเดือน เผยแพร่ทุกช่องทางในรอบเดียว — ระบบดึงยอด views/การใช้สิทธิ์กลับมาเอง
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs text-muted">กำลังวิ่งอยู่</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{active.length}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">ยอดมองเห็นรวม</p><p className="mt-1 text-2xl font-semibold">{totalViews.toLocaleString("th-TH")}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">การใช้สิทธิ์รวม</p><p className="mt-1 text-2xl font-semibold">{totalClaims}</p></div>
      </div>

      <NewPromotionForm />

      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((p) => {
          const st = STATUS_META[p.status];
          return (
            <article key={p.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${st.cls}`}>{st.label}</span>
                <span className="font-mono text-xs text-muted">{p.code}</span>
              </div>
              <h2 className="mt-2.5 font-semibold leading-snug">{p.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>📅 {thDate(p.startDate)} – {thDate(p.endDate)}</span>
                <span>🏷 {p.discountType === "percent" ? `ส่วนลด ${p.discountValue}%` : `มูลค่า ฿${p.discountValue.toLocaleString()}`}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>👁 {p.views.toLocaleString()}</span>
                <span>✅ ใช้สิทธิ์ {p.claims}</span>
                <span>📢 {p.channels.map((c) => CHANNEL_LABEL[c]).join(" · ") || "ยังไม่เลือกช่องทาง"}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {p.status !== "active" && p.status !== "expired" && (
                  <form action={changePromotionStatusAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="active" />
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">▶ เปิดใช้งาน</button>
                  </form>
                )}
                {p.status === "active" && (
                  <form action={changePromotionStatusAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="expired" />
                    <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-line hover:bg-slate-200">⏹ ปิดโปร</button>
                  </form>
                )}
                {p.status !== "expired" && p.channels.length > 0 && (
                  <form action={publishPromotionAction} className="ml-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
                      🚀 เผยแพร่ทุกช่องทาง
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
