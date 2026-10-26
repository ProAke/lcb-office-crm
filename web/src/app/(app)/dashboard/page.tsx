import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "แดชบอร์ด" };

const KPIS = [
  { label: "ผู้ใช้ทั้งหมด", value: "—", note: "รอเชื่อมต่อฐานข้อมูลเดิม" },
  { label: "เอกสารเดือนนี้", value: "—", note: "ใบเสนอราคา / ใบสั่งซื้อ" },
  { label: "Rich Menu ที่ใช้งาน", value: "—", note: "ดึงจาก LINE Messaging API" },
  { label: "งานค้างดำเนินการ", value: "—", note: "สถานะ pending ในตารางงาน" },
];

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
          สวัสดี, {session?.name ?? "ผู้ใช้งาน"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          นี่คือโครงตั้งต้นของระบบใหม่ (Next.js) ที่ใช้ฐานข้อมูลชุดเดิม —
          ตัวเลขทั้งหมดจะแสดงจริงเมื่อเชื่อมต่อ MySQL เรียบร้อยแล้ว
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {k.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{k.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">{k.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">โมดูลที่ต้องย้าย</h2>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              จากการตรวจหน้าเว็บเดิม
            </span>
          </header>
          <ul className="divide-y divide-line text-sm">
            {[
              ["Authentication", "login / reset-password / session", "เสร็จ (เดโม)"],
              ["LINE Rich Menu Management", "จัดการเมนูรวยของ LINE OA", "โครงพร้อม"],
              ["Dashboard", "สรุปภาพรวม", "โครงพร้อม"],
              ["โมดูลธุรกิจ", "ลูกค้า / สินค้า / เอกสาร / พนักงาน", "รอ schema จริง"],
            ].map(([name, desc, status]) => (
              <li key={name} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
                <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-[11px] text-muted">
                  {status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="text-sm font-semibold">ขั้นต่อไป</h2>
          <ol className="mt-3 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
                1
              </span>
              ส่งซอร์ส PHP เดิม (zip) เพื่อตรวจโครงสร้างจริง
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
                2
              </span>
              ตรวจ schema MySQL แล้วสร้าง Prisma schema ด้วย introspect
            </li>
            <li className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
                3
              </span>
              ย้ายทีละโมดูล แล้ว cutover ด้วย reverse proxy
            </li>
          </ol>
          <Link
            href="/plan"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
          >
            ดูแผนย้ายระบบฉบับเต็ม →
          </Link>
        </section>
      </div>
    </div>
  );
}
