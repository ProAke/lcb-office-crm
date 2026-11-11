"use client";

import { useActionState } from "react";
import { createAndPublishPostAction, type PublishFormState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: PublishFormState = {};

const TEMPLATES: Record<string, string> = {
  "": "",
  promo: "🔥 โปรเดือนนี้! เปลี่ยนยางครบ 4 เส้น\nฟรี! ตั้งศูนย์ 3D + ถ่วงล้อ (มูลค่า 1,200.-)\n\nจองคิวผ่านไลน์นี้ได้เลย 👉 หรือโทร 038-400-400",
  check: "🚗 เช็กสภาพยางฟรี! ก่อนเดินทางไกล\n— ดอกยาง ลมยาง ความลึก เช็กครบทุกจุด\n\nร้านเปิดทุกวัน 08:00-17:30 น. จองคิวล่วงหน้าไม่ต้องรอ",
};

export default function Composer({
  activePromos,
}: {
  activePromos: { id: number; title: string; code: string }[];
}) {
  const [state, formAction] = useActionState(createAndPublishPostAction, initial);

  return (
    <details className="card group" open>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700">
        ✍️ เขียนโพสต์ใหม่ (เผยแพร่พร้อมกันทุกช่องทาง)
        <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
      </summary>
      <form action={formAction} className="grid gap-3 border-t border-line p-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <input name="title" required placeholder="หัวข้อโพสต์ *" className="input" />
          <textarea name="body" required rows={5} placeholder="เนื้อความที่จะโพสต์ *" className="input" id="composer-body" />

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="py-1.5 text-muted">เทมเพลต:</span>
            {[
              { k: "promo", label: "🔥 โปรเปลี่ยนยาง" },
              { k: "check", label: "🚗 เช็กยางฟรี" },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                className="rounded-lg bg-surface px-3 py-1.5 ring-1 ring-line hover:bg-slate-100"
                onClick={() => {
                  const el = document.getElementById("composer-body") as HTMLTextAreaElement | null;
                  if (el) el.value = TEMPLATES[t.k];
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {state.error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          {state.results && (
            <ul className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {state.results.map((r) => <li key={r}>• {r}</li>)}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <fieldset className="rounded-xl border border-line p-3">
            <legend className="px-1 text-xs font-medium text-muted">ช่องทางเผยแพร่ *</legend>
            {[
              { v: "line", label: "LINE OA Broadcast", icon: "💬" },
              { v: "facebook", label: "Facebook Page", icon: "📘" },
              { v: "web", label: "ประกาศหน้าเว็บ", icon: "🌐" },
            ].map((c) => (
              <label key={c.v} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface">
                <input type="checkbox" name="channels" value={c.v} defaultChecked className="accent-[#12507f]" />
                <span>{c.icon}</span> {c.label}
              </label>
            ))}
          </fieldset>

          <select name="kind" className="input">
            <option value="promotion">ประเภท: โปรโมชัน</option>
            <option value="news">ประเภท: ข่าวสาร/ประกาศ</option>
          </select>

          {activePromos.length > 0 && (
            <p className="rounded-lg bg-surface px-3 py-2 text-[11px] leading-relaxed text-muted ring-1 ring-line">
              💡 โปรที่กำลังใช้งาน: {activePromos.map((p) => p.code).join(", ")}
              <br />กดปุ่ม 🚀 เผยแพร่ จากหน้าโปรโมชัน เพื่อส่งการ์ดโปรนั้นออกได้เลย
            </p>
          )}

          <SubmitButton label="🚀 เผยแพร่ทันที" pendingLabel="กำลังกระจายออก…" className="btn-primary" />
        </div>
      </form>
    </details>
  );
}
