"use client";

import { useActionState } from "react";
import { createPromotionAction, type PromoFormState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: PromoFormState = {};

export default function NewPromotionForm() {
  const [state, formAction] = useActionState(createPromotionAction, initial);

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700">
        ＋ สร้างโปรโมชันใหม่
        <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
      </summary>
      <form action={formAction} className="grid gap-3 border-t border-line p-4 lg:grid-cols-2">
        <input name="title" required placeholder="หัวข้อโปร เช่น เปลี่ยนยาง 4 เส้น ฟรีตั้งศูนย์ *" className="input lg:col-span-2" />
        <textarea name="description" rows={2} placeholder="รายละเอียดเงื่อนไข…" className="input lg:col-span-2" />
        <div className="grid grid-cols-2 gap-3">
          <select name="discountType" className="input" defaultValue="baht">
            <option value="baht">ส่วนลดเป็นบาท</option>
            <option value="percent">ส่วนลดเป็น %</option>
          </select>
          <input name="discountValue" type="number" min={0} placeholder="มูลค่าส่วนลด" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">เริ่ม<input name="startDate" type="date" className="input mt-1" required /></label>
          <label className="text-xs text-muted">สิ้นสุด<input name="endDate" type="date" className="input mt-1" required /></label>
        </div>
        <fieldset className="flex flex-wrap items-center gap-4 text-sm lg:col-span-2">
          <span className="text-xs font-medium text-muted">เผยแพร่ไปยัง:</span>
          {[
            ["line", "LINE OA"],
            ["facebook", "Facebook"],
            ["web", "เว็บไซต์"],
          ].map(([v, label]) => (
            <label key={v} className="flex items-center gap-1.5">
              <input type="checkbox" name="channels" value={v} defaultChecked className="accent-[#12507f]" />
              {label}
            </label>
          ))}
        </fieldset>
        {state.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">{state.error}</p>}
        <div className="lg:col-span-2">
          <SubmitButton label="บันทึกโปรโมชัน (แบบร่าง)" className="btn-primary w-auto px-6" />
        </div>
      </form>
    </details>
  );
}
