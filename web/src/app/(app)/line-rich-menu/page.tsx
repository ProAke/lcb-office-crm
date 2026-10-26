import type { Metadata } from "next";

export const metadata: Metadata = { title: "LINE Rich Menu" };

/**
 * ตัวอย่างโมดูลที่มีอยู่แล้วในระบบเดิม (เห็นเมนูในหน้า login)
 * ในเวอร์ชันจริง ข้อมูลจะมาจาก 2 ทาง:
 *   1) ตารางใน MySQL เดิม (เช่น rich_menu, rich_menu_areas)
 *   2) LINE Messaging API: GET https://api.line.me/v2/bot/richmenu/list
 * เรียกผ่าน Route Handler (src/app/api/line/rich-menu/route.ts) เพื่อซ่อน channel token
 */

const MENUS = [
  {
    id: "richmenu-1",
    name: "เมนูหลัก (Main)",
    size: "2500 × 1686",
    status: "ใช้งาน",
    updated: "2026-09-18",
  },
  {
    id: "richmenu-2",
    name: "โปรโมชั่นยาง",
    size: "2500 × 843",
    status: "ปิดใช้งาน",
    updated: "2026-08-02",
  },
];

export default function LineRichMenuPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">LINE Rich Menu</h1>
          <p className="mt-1 text-sm text-muted">
            จัดการเมนูรวยของ LINE Official Account — ข้อมูลตัวอย่าง
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-medium text-white opacity-70"
          title="จะเปิดใช้เมื่อเชื่อมต่อ LINE Messaging API"
        >
          + สร้างเมนูใหม่
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อเมนู</th>
              <th className="px-4 py-3 font-medium">Rich Menu ID</th>
              <th className="px-4 py-3 font-medium">ขนาด</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">แก้ไขล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {MENUS.map((m) => (
              <tr key={m.id} className="hover:bg-surface/60">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{m.id}</td>
                <td className="px-4 py-3 text-muted">{m.size}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.status === "ใช้งาน"
                        ? "rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        : "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    }
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{m.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <strong>หมายเหตุเรื่องความปลอดภัย:</strong> ใน PHP เดิม มักเก็บ
        channel access token ไว้ในไฟล์ config หรือเรียก API จากหน้าเว็บตรง ๆ
        (ทำให้ token หลุดฝั่ง client ได้) — เวอร์ชัน Next.js จะเก็บ token ไว้ใน
        environment variable ฝั่งเซิร์ฟเวอร์เท่านั้น และเรียกผ่าน Route Handler
        ของเราเอง
      </p>
    </div>
  );
}
