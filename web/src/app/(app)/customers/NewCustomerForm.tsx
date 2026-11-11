"use client";

import { useActionState } from "react";
import { createCustomerAction, type FormState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: FormState = {};

export default function NewCustomerForm() {
  const [state, formAction] = useActionState(createCustomerAction, initial);

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700">
        ＋ เพิ่มลูกค้าใหม่
        <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
      </summary>
      <form action={formAction} className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="name" required placeholder="ชื่อลูกค้า *" className="input" />
        <input name="phone" required placeholder="เบอร์โทร *" className="input" />
        <input name="lineId" placeholder="LINE ID" className="input" />
        <select name="tier" className="input" defaultValue="new">
          <option value="new">ลูกค้าใหม่</option>
          <option value="regular">ทั่วไป</option>
          <option value="vip">VIP</option>
        </select>
        <input name="plate" placeholder="ทะเบียนรถ" className="input" />
        <input name="brand" placeholder="ยี่ห้อรถ เช่น Toyota" className="input" />
        <input name="model" placeholder="รุ่น เช่น Hilux Revo" className="input" />
        <input name="tireSize" placeholder="ขนาดยาง เช่น 265/60 R18" className="input" />
        {state.error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2 lg:col-span-4">
            {state.error}
          </p>
        )}
        <div className="sm:col-span-2 lg:col-span-4">
          <SubmitButton label="บันทึกลูกค้า" className="btn-primary w-auto px-6" />
        </div>
      </form>
    </details>
  );
}
