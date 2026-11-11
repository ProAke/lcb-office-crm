"use client";

import { useActionState } from "react";
import { createBookingAction, type BookingFormState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: BookingFormState = {};

export default function NewBookingForm() {
  const [state, formAction] = useActionState(createBookingAction, initial);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700">
        ＋ รับจองคิว (โทร/หน้าร้าน)
        <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
      </summary>
      <form action={formAction} className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="customerName" required placeholder="ชื่อลูกค้า *" className="input" />
        <input name="phone" required placeholder="เบอร์โทร *" className="input" />
        <input name="plate" placeholder="ทะเบียนรถ" className="input" />
        <select name="service" className="input" defaultValue="เช็กสภาพยาง">
          {["เช็กสภาพยาง", "เปลี่ยนยาง", "เปลี่ยนยาง 4 เส้น + ตั้งศูนย์", "ตั้งศูนย์ล้อ 3D", "ถ่วงล้อ", "สลับยาง", "ปะยาง", "เติมไนโตรเจน"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input name="date" type="date" defaultValue={today} required className="input" />
        <input name="time" type="time" defaultValue="09:00" required className="input" />
        <input name="note" placeholder="หมายเหตุ" className="input sm:col-span-2" />
        {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2 lg:col-span-4">{state.error}</p>}
        <div className="sm:col-span-2 lg:col-span-4">
          <SubmitButton label="บันทึกการจอง" className="btn-primary w-auto px-6" />
        </div>
      </form>
    </details>
  );
}
