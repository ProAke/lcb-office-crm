import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCustomer,
  listBookings,
  listJobs,
} from "@/lib/crm/repo";
import { baht, thDate, TIER_LABEL } from "@/lib/format";
import { updateCustomerAction } from "../actions";
import SubmitButton from "@/components/SubmitButton";

export const metadata: Metadata = { title: "ประวัติลูกค้า 360°" };
export const dynamic = "force-dynamic";

const JOB_STATUS: Record<string, string> = {
  received: "รับรถ", diagnosing: "ตรวจเช็ก", working: "กำลังทำ",
  qc: "QC", done: "เสร็จ", delivered: "ส่งมอบแล้ว",
};

const BOOKING_SOURCE: Record<string, string> = {
  web: "เว็บ", line: "LINE", phone: "โทร", walkin: "หน้าร้าน", ai: "AI Chat",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = getCustomer(Number(id));
  if (!customer) notFound();

  const t = TIER_LABEL[customer.tier];
  const jobs = listJobs().filter((j) => j.customerId === customer.id);
  const bookings = listBookings().filter((b) => b.customerId === customer.id);
  const update = updateCustomerAction.bind(null, customer.id);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/customers" className="text-sm text-muted hover:text-brand-600">← กลับหน้าลูกค้า</Link>

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-xl font-bold text-white">
          {customer.name.replace(/^คุณ/, "").slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{customer.name}</h1>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${t.cls}`}>{t.label}</span>
            <span className="font-mono text-xs text-muted">{customer.code}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {customer.phone} {customer.lineId && `· 💬 ${customer.lineId}`} {customer.address && `· ${customer.address}`}
          </p>
          {customer.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customer.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] text-muted ring-1 ring-line">#{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-lg font-semibold">{baht(customer.totalSpend)}</p><p className="text-[11px] text-muted">ยอดสะสม</p></div>
          <div><p className="text-lg font-semibold">{customer.visitCount}</p><p className="text-[11px] text-muted">ครั้งที่ใช้บริการ</p></div>
          <div><p className="text-lg font-semibold">{customer.vehicles.length}</p><p className="text-[11px] text-muted">รถ</p></div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* ซ้าย: แก้ไข + รถ */}
        <div className="space-y-5">
          <details className="card">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-700">
              ✎ แก้ไขข้อมูลลูกค้า
            </summary>
            <form action={update} className="space-y-3 border-t border-line p-4">
              <input name="name" defaultValue={customer.name} required className="input" placeholder="ชื่อ" />
              <input name="phone" defaultValue={customer.phone} required className="input" placeholder="เบอร์โทร" />
              <input name="lineId" defaultValue={customer.lineId ?? ""} className="input" placeholder="LINE ID" />
              <input name="address" defaultValue={customer.address ?? ""} className="input" placeholder="ที่อยู่" />
              <select name="tier" defaultValue={customer.tier} className="input">
                <option value="new">ลูกค้าใหม่</option>
                <option value="regular">ทั่วไป</option>
                <option value="vip">VIP</option>
              </select>
              <SubmitButton label="บันทึกการแก้ไข" className="btn-primary" />
            </form>
          </details>

          <section className="card">
            <header className="border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">รถของลูกค้า ({customer.vehicles.length})</h2></header>
            <ul className="divide-y divide-line text-sm">
              {customer.vehicles.map((v) => (
                <li key={v.plate} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">🚗 {v.plate}</p>
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] text-brand-700">{v.tireSize}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{v.brand} {v.model}</p>
                </li>
              ))}
              {!customer.vehicles.length && <li className="px-4 py-6 text-center text-xs text-muted">ยังไม่มีข้อมูลรถ</li>}
            </ul>
          </section>
        </div>

        {/* ขวา: ประวัติ */}
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">ประวัติงานบริการ ({jobs.length})</h2></header>
            <ul className="divide-y divide-line text-sm">
              {jobs.map((j) => (
                <li key={j.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-muted">{j.jobNo} · {j.plate}</p>
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700">{JOB_STATUS[j.status]}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted">
                    {j.items.map((it, i) => <li key={i}>• {it.name} × {it.qty} — {baht(it.price * it.qty)}</li>)}
                  </ul>
                  <p className="mt-1 text-right font-medium">รวม {baht(j.total)}</p>
                </li>
              ))}
              {!jobs.length && <li className="px-4 py-6 text-center text-xs text-muted">ยังไม่มีงานบริการ</li>}
            </ul>
          </section>

          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">การจอง ({bookings.length})</h2></header>
            <ul className="divide-y divide-line text-sm">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">{b.service}</p>
                    <p className="text-xs text-muted">{thDate(b.date)} {b.time} น. · ช่องทาง {BOOKING_SOURCE[b.source]}</p>
                  </div>
                  <span className="rounded bg-surface px-2 py-0.5 text-[11px] text-muted ring-1 ring-line">{b.status}</span>
                </li>
              ))}
              {!bookings.length && <li className="px-4 py-6 text-center text-xs text-muted">ยังไม่มีการจอง</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
