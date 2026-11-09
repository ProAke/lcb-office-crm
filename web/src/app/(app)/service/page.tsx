import type { Metadata } from "next";
import { listBookings, listJobs } from "@/lib/crm/repo";
import { baht, thDate } from "@/lib/format";
import NewBookingForm from "./NewBookingForm";
import { advanceBookingAction, advanceJobAction, cancelBookingAction } from "./actions";

export const metadata: Metadata = { title: "ศูนย์บริการ" };
export const dynamic = "force-dynamic";

const BOOKING_STATUS: Record<string, { label: string; cls: string; next?: string }> = {
  pending: { label: "รอยืนยัน", cls: "bg-amber-50 text-amber-700", next: "ยืนยันคิว" },
  confirmed: { label: "ยืนยันแล้ว", cls: "bg-emerald-50 text-emerald-700", next: "รับรถเข้าทำ" },
  in_service: { label: "กำลังทำ", cls: "bg-blue-50 text-blue-700", next: "ทำเสร็จ" },
  done: { label: "เสร็จสิ้น", cls: "bg-slate-100 text-slate-500" },
  cancelled: { label: "ยกเลิก", cls: "bg-red-50 text-red-500" },
};

const SOURCE_LABEL: Record<string, string> = {
  web: "🌐 เว็บ", line: "💬 LINE", phone: "📞 โทร", walkin: "🚶 หน้าร้าน", ai: "🤖 AI Chat",
};

const JOB_COLS: { status: string; label: string; next?: string }[] = [
  { status: "received", label: "รับรถแล้ว", next: "เริ่มตรวจเช็ก" },
  { status: "diagnosing", label: "ตรวจเช็ก", next: "เริ่มงาน" },
  { status: "working", label: "กำลังทำ", next: "เข้า QC" },
  { status: "qc", label: "QC", next: "เสร็จพร้อมส่ง" },
  { status: "done", label: "เสร็จแล้ว", next: "ส่งมอบรถ" },
  { status: "delivered", label: "ส่งมอบแล้ว" },
];

export default async function ServicePage() {
  const bookings = listBookings();
  const jobs = listJobs();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">ศูนย์บริการล้อและยาง</h1>
        <p className="mt-1 text-sm text-muted">
          คิวจองจากทุกช่องทาง (รวมที่ AI จองให้โดยอัตโนมัติ) + ใบงานแบบ Kanban
        </p>
      </div>

      <NewBookingForm />

      {/* คิวจอง */}
      <section className="card overflow-x-auto">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold">ปฏิทินนัดหมาย ({bookings.length})</h2>
        </header>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">วัน/เวลา</th>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">บริการ</th>
              <th className="px-4 py-3 font-medium">ช่องทาง</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((b) => {
              const st = BOOKING_STATUS[b.status];
              return (
                <tr key={b.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">{thDate(b.date)}</p>
                    <p className="text-xs text-muted">{b.time} น.</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.customerName}</p>
                    <p className="text-xs text-muted">{b.plate}</p>
                  </td>
                  <td className="px-4 py-3">{b.service}</td>
                  <td className="px-4 py-3 text-muted">{SOURCE_LABEL[b.source]}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {st.next && (
                        <form action={advanceBookingAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="rounded-lg bg-brand-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-brand-600">
                            {st.next} →
                          </button>
                        </form>
                      )}
                      {["pending", "confirmed"].includes(b.status) && (
                        <form action={cancelBookingAction}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-100">
                            ยกเลิก
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Kanban ใบงาน */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">ใบงาน (Job Orders) แบบ Kanban</h2>
        <div className="grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${JOB_COLS.length}, minmax(180px, 1fr))` }}>
          {JOB_COLS.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.status);
            return (
              <div key={col.status} className="rounded-xl bg-surface p-2.5 ring-1 ring-line">
                <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-muted">
                  {col.label}
                  <span className="rounded-full bg-white px-1.5 text-[10px] ring-1 ring-line">{colJobs.length}</span>
                </p>
                <div className="space-y-2">
                  {colJobs.map((j) => (
                    <article key={j.id} className="card p-3 text-xs shadow-sm">
                      <p className="font-mono text-[10px] text-muted">{j.jobNo}</p>
                      <p className="mt-0.5 truncate font-medium">{j.customerName}</p>
                      <p className="text-[11px] text-muted">{j.plate}</p>
                      <p className="mt-1 font-semibold text-brand-700">{baht(j.total)}</p>
                      {col.next && (
                        <form action={advanceJobAction} className="mt-2">
                          <input type="hidden" name="id" value={j.id} />
                          <button className="w-full rounded-md bg-brand-500/10 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-500/20">
                            {col.next} →
                          </button>
                        </form>
                      )}
                    </article>
                  ))}
                  {!colJobs.length && <p className="px-1 py-4 text-center text-[10px] text-muted/60">ว่าง</p>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          * เมื่อใบงานถึง «ส่งมอบแล้ว» ระบบจะตัดสต็อกและบันทึกยอดสะสมของลูกค้าให้อัตโนมัติ (ERP-lite)
        </p>
      </section>
    </div>
  );
}
