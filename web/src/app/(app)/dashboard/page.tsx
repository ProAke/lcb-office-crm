import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  getCockpitSummary,
  getMonthlyStats,
  listBookings,
  listConversations,
  listJobs,
  listLowStock,
  listPromotions,
} from "@/lib/crm/repo";
import { baht } from "@/lib/format";

export const metadata: Metadata = { title: "Cockpit — แดชบอร์ดกลาง" };
export const dynamic = "force-dynamic";

const JOB_STATUS: Record<string, string> = {
  received: "รับรถ",
  diagnosing: "ตรวจเช็ก",
  working: "กำลังทำ",
  qc: "QC",
  done: "เสร็จ",
  delivered: "ส่งมอบ",
};

function BarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="flex h-44 items-end gap-3 px-1">
      {data.map((d) => {
        const h = Math.max(6, Math.round((d.revenue / max) * 100));
        const isCurrent = d.month === data[data.length - 1]?.month;
        return (
          <div key={d.month} className="group flex flex-1 flex-col items-center gap-1.5">
            <p className="text-[10px] font-medium text-muted opacity-0 transition group-hover:opacity-100">
              {(d.revenue / 1000).toFixed(0)}k
            </p>
            <div
              className={`w-full max-w-11 rounded-t-lg transition ${
                isCurrent
                  ? "bg-gradient-to-t from-accent to-amber-400"
                  : "bg-gradient-to-t from-brand-700 to-brand-500"
              }`}
              style={{ height: `${h}%` }}
              title={`${d.month}: ${baht(d.revenue)}`}
            />
            <p className="text-[10px] text-muted">{d.month.slice(5)}</p>
          </div>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const s = getCockpitSummary();
  const stats = getMonthlyStats();
  const bookings = listBookings().filter((b) => b.status !== "cancelled" && b.status !== "done");
  const jobs = listJobs().filter((j) => j.status !== "delivered");
  const promos = listPromotions().filter((p) => p.status === "active");
  const lowStock = listLowStock();
  const unreadChats = listConversations().filter((c) => c.unread > 0);

  const kpis = [
    { label: "ลูกค้าทั้งหมด", value: String(s.customers), sub: `VIP ${s.vipCustomers} ราย`, href: "/customers" },
    { label: "รายได้เดือนนี้", value: baht(s.monthRevenue), sub: "จากงานศูนย์บริการ+ขายยาง", href: "/service" },
    { label: "คิวจองวันนี้", value: String(s.todayBookingCount), sub: `งานเปิดอยู่ ${s.openJobCount} ใบ`, href: "/service" },
    { label: "โปรที่กำลังวิ่ง", value: String(s.activePromoCount), sub: "เผยแพร่ทุกช่องทาง", href: "/promotions" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Cockpit · สวัสดี, {session?.name ?? "ผู้ใช้งาน"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            ศูนย์บัญชาการร้านยางแหลมฉบัง — ลูกค้า สินค้า โปรโมชัน และช่องทางขาย ในจอเดียว
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          AI Chat เปิดอยู่ {s.aiConversations} ห้อง · ข้อความค้าง {s.unreadChats}
        </span>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-[26px] font-semibold leading-none">{k.value}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* รายได้ */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">รายได้ 6 เดือนล่าสุด</h2>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              +{(stats.at(-1)!.revenue / 1000).toFixed(0)}k เดือนนี้
            </span>
          </header>
          <div className="p-4">
            <BarChart data={stats} />
          </div>
        </section>

        {/* คิววันนี้ */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">คิวจองที่กำลังจะมาถึง</h2>
            <Link href="/service" className="text-xs font-medium text-brand-600 hover:underline">
              จัดการทั้งหมด
            </Link>
          </header>
          <ul className="max-h-56 divide-y divide-line overflow-y-auto text-sm">
            {bookings.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-[11px] font-semibold text-brand-700">
                  {b.time}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.customerName}</p>
                  <p className="truncate text-xs text-muted">{b.service}</p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    b.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700"
                      : b.status === "in_service"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {b.status === "confirmed" ? "ยืนยันแล้ว" : b.status === "in_service" ? "กำลังทำ" : "รอยืนยัน"}
                </span>
              </li>
            ))}
            {!bookings.length && (
              <li className="px-4 py-6 text-center text-xs text-muted">ยังไม่มีคิววันนี้</li>
            )}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* งานในศูนย์ */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">งานในศูนย์บริการ</h2>
            <Link href="/service" className="text-xs font-medium text-brand-600 hover:underline">Kanban</Link>
          </header>
          <ul className="divide-y divide-line text-sm">
            {jobs.slice(0, 4).map((j) => (
              <li key={j.id} className="px-4 py-2.5">
                <div className="flex justify-between gap-2">
                  <p className="font-mono text-xs text-muted">{j.jobNo}</p>
                  <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                    {JOB_STATUS[j.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-medium">{j.customerName}</p>
                <p className="text-xs text-muted">{j.plate} · {baht(j.total)}</p>
              </li>
            ))}
            {!jobs.length && <li className="px-4 py-6 text-center text-xs text-muted">ไม่มีงานค้าง</li>}
          </ul>
        </section>

        {/* โปร */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">โปรโมชันเดือนนี้</h2>
            <Link href="/promotions" className="text-xs font-medium text-brand-600 hover:underline">สร้างใหม่</Link>
          </header>
          <ul className="divide-y divide-line text-sm">
            {promos.slice(0, 3).map((p) => (
              <li key={p.id} className="px-4 py-2.5">
                <p className="font-medium leading-snug">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  👁 {p.views.toLocaleString()} · ใช้สิทธิ์ {p.claims} ครั้ง
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* สต็อก + แชท */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">สัญญาณเตือนจากระบบ</h2>
            <Link href="/products" className="text-xs font-medium text-brand-600 hover:underline">คลังสินค้า</Link>
          </header>
          <div className="space-y-3 p-4 text-sm">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-start gap-2.5 rounded-lg bg-red-50/60 p-2.5 ring-1 ring-red-100">
                <span className="mt-0.5 text-red-500">⚠</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className="text-[11px] text-muted">
                    เหลือ {p.stock} {p.unit} (เตือนที่ {p.minStock})
                  </p>
                </div>
              </div>
            ))}
            {unreadChats.map((c) => (
              <Link key={c.id} href={`/chat?id=${c.id}`} className="flex items-start gap-2.5 rounded-lg bg-blue-50/60 p-2.5 ring-1 ring-blue-100">
                <span className="mt-0.5 text-blue-500">💬</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{c.displayName} ({c.channel})</p>
                  <p className="text-[11px] text-muted">{c.unread} ข้อความรอตอบ</p>
                </div>
              </Link>
            ))}
            {!lowStock.length && !unreadChats.length && (
              <p className="py-3 text-center text-xs text-muted">สต็อกปลอดภัย · ไม่มีแชทค้างอ่าน ✓</p>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-[11px] text-muted">
        โหมดเดโม: ข้อมูลเก็บในไฟล์ data/store.json — เมื่อตั้งค่า DATABASE_URL จะสลับไป MySQL ชุดเดิมอัตโนมัติ ผ่านชั้น repo.ts ไฟล์เดียว
      </p>
    </div>
  );
}
