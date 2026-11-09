import type { Metadata } from "next";
import { listProducts } from "@/lib/crm/repo";
import { baht } from "@/lib/format";
import { adjustStockAction } from "./actions";
import NewProductForm from "./NewProductForm";

export const metadata: Metadata = { title: "สินค้า & บริการ" };
export const dynamic = "force-dynamic";

function StockBar({ stock, minStock }: { stock: number; minStock: number }) {
  const pct = Math.min(100, minStock > 0 ? (stock / (minStock * 3)) * 100 : stock > 0 ? 100 : 0);
  const color = stock === 0 ? "bg-red-500" : stock <= minStock ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface ring-1 ring-line">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const products = listProducts({ q, type: type ?? "all" });
  const goods = products.filter((p) => p.type === "product");
  const services = products.filter((p) => p.type === "service");
  const lowStock = goods.filter((p) => p.stock <= p.minStock);
  const stockValue = goods.reduce((s, p) => s + p.cost * p.stock, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">สินค้า & บริการ</h1>
        <p className="mt-1 text-sm text-muted">
          ยาง · ล้อ · ค่าแรง — ระบบเตือนสต็อกอัจฉริยะ หมด/ต่ำกว่าจุดสั่งซื้อจะโชว์เตือนทันที
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">มูลค่าสต็อก (ทุน)</p>
          <p className="mt-2 text-2xl font-semibold">{baht(stockValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">รายการสินค้า</p>
          <p className="mt-2 text-2xl font-semibold">{goods.length} <span className="text-sm font-normal text-muted">รายการ</span></p>
        </div>
        <div className="card p-4 ring-1 ring-red-200">
          <p className="text-xs font-medium uppercase tracking-wide text-red-600">⚠ ต้องสั่งซื้อด่วน</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{lowStock.length} <span className="text-sm font-normal text-muted">รายการ</span></p>
          {lowStock.map((p) => (
            <p key={p.id} className="mt-1 truncate text-xs text-muted">• {p.name} ({p.stock} {p.unit})</p>
          ))}
        </div>
      </div>

      <NewProductForm />

      <form className="card flex flex-wrap items-center gap-2.5 p-3">
        <input name="q" defaultValue={q ?? ""} placeholder="ค้นหา SKU / ชื่อ / ยี่ห้อ…" className="input max-w-sm" />
        <select name="type" defaultValue={type ?? "all"} className="input w-auto">
          <option value="all">ทั้งหมด</option>
          <option value="product">สินค้า</option>
          <option value="service">บริการ</option>
        </select>
        <button className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white">ค้นหา</button>
      </form>

      {[
        { title: `สินค้าคงคลัง (${goods.length})`, rows: goods },
        { title: `บริการศูนย์ (${services.length})`, rows: services },
      ].map((group) => (
        <div key={group.title} className="card overflow-x-auto">
          <header className="border-b border-line px-4 py-3"><h2 className="text-sm font-semibold">{group.title}</h2></header>
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">สินค้า/บริการ</th>
                <th className="px-4 py-3 font-medium">หมวด</th>
                <th className="px-4 py-3 text-right font-medium">ทุน</th>
                <th className="px-4 py-3 text-right font-medium">ราคาขาย</th>
                <th className="px-4 py-3 text-right font-medium">กำไร%</th>
                <th className="px-4 py-3 font-medium">สต็อก</th>
                <th className="px-4 py-3 font-medium">เติม/ตัด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {group.rows.map((p) => {
                const margin = p.price > 0 && p.cost > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : null;
                return (
                  <tr key={p.id} className="hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-snug">{p.name}</p>
                      <p className="font-mono text-[11px] text-muted">{p.sku} · {p.brand}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 text-right text-muted">{p.cost ? baht(p.cost) : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{baht(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      {margin !== null ? (
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${margin >= 30 ? "bg-emerald-50 text-emerald-700" : margin >= 15 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {margin}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.type === "product" ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${p.stock === 0 ? "text-red-600" : p.stock <= p.minStock ? "text-amber-600" : ""}`}>
                            {p.stock} {p.unit}
                          </span>
                          <StockBar stock={p.stock} minStock={p.minStock} />
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.type === "product" && (
                        <div className="flex gap-1">
                          {[1, -1, 4, -4].map((d) => (
                            <form key={d} action={adjustStockAction}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="delta" value={d} />
                              <button
                                className={`rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ${
                                  d > 0
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                                    : "bg-red-50 text-red-600 ring-red-200 hover:bg-red-100"
                                }`}
                              >
                                {d > 0 ? `+${d}` : d}
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!group.rows.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
