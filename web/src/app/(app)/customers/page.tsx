import type { Metadata } from "next";
import Link from "next/link";
import { listCustomers } from "@/lib/crm/repo";
import { baht, thDate, TIER_LABEL } from "@/lib/format";
import NewCustomerForm from "./NewCustomerForm";

export const metadata: Metadata = { title: "ลูกค้า (CRM)" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const { q, tier } = await searchParams;
  const customers = listCustomers({ q, tier: tier as never });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">ลูกค้า (CRM)</h1>
          <p className="mt-1 text-sm text-muted">
            ฐานลูกค้า {customers.length} ราย — ทะเบียนรถ ยอดสะสม และประวัติเข้าใช้บริการ
          </p>
        </div>
      </div>

      <NewCustomerForm />

      {/* ค้นหา + กรอง */}
      <form className="card flex flex-wrap items-center gap-2.5 p-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="ค้นหา ชื่อ / เบอร์ / รหัส / ทะเบียนรถ…"
          className="input max-w-sm"
        />
        <select name="tier" defaultValue={tier ?? ""} className="input w-auto">
          <option value="">ทุกระดับ</option>
          <option value="vip">VIP</option>
          <option value="regular">ทั่วไป</option>
          <option value="new">ใหม่</option>
        </select>
        <button className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white">
          ค้นหา
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">เบอร์ / LINE</th>
              <th className="px-4 py-3 font-medium">รถ</th>
              <th className="px-4 py-3 font-medium">ระดับ</th>
              <th className="px-4 py-3 text-right font-medium">ยอดสะสม</th>
              <th className="px-4 py-3 font-medium">เข้าร้านล่าสุด</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => {
              const t = TIER_LABEL[c.tier];
              return (
                <tr key={c.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="font-mono text-xs text-muted">{c.code}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p>{c.phone}</p>
                    {c.lineId && <p className="text-xs">💬 {c.lineId}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {c.vehicles.map((v) => (
                      <p key={v.plate} className="text-xs leading-relaxed">
                        <span className="font-medium">{v.plate}</span>{" "}
                        <span className="text-muted">{v.brand} {v.model} · {v.tireSize}</span>
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${t.cls}`}>
                      {t.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{baht(c.totalSpend)}</td>
                  <td className="px-4 py-3 text-muted">{thDate(c.lastVisitAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/customers/${c.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                      ดู 360°
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!customers.length && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">ไม่พบลูกค้าตามเงื่อนไข</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
