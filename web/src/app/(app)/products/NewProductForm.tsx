"use client";

import { useActionState } from "react";
import { createProductAction, type ProductFormState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: ProductFormState = {};

export default function NewProductForm() {
  const [state, formAction] = useActionState(createProductAction, initial);

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700">
        ＋ เพิ่มสินค้า / บริการใหม่
        <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
      </summary>
      <form action={formAction} className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select name="type" className="input" defaultValue="product">
          <option value="product">สินค้า (นับสต็อก)</option>
          <option value="service">บริการ (ไม่นับสต็อก)</option>
        </select>
        <input name="name" required placeholder="ชื่อ เช่น Michelin 205/55 R16 *" className="input" />
        <input name="sku" placeholder="SKU (ว่าง = ออกอัตโนมัติ)" className="input" />
        <input name="brand" placeholder="ยี่ห้อ" className="input" />
        <input name="category" placeholder="หมวด เช่น ยางรถยนต์" className="input" />
        <input name="price" type="number" min={0} required placeholder="ราคาขาย *" className="input" />
        <input name="cost" type="number" min={0} placeholder="ราคาทุน" className="input" />
        <input name="unit" placeholder="หน่วย เช่น เส้น/ครั้ง" className="input" />
        <input name="stock" type="number" min={0} placeholder="สต็อกเริ่มต้น" className="input" />
        <input name="minStock" type="number" min={0} placeholder="จุดเตือนสต็อกต่ำ" className="input" />
        {state.error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {state.error}
          </p>
        )}
        <div className="sm:col-span-2 lg:col-span-2">
          <SubmitButton label="บันทึก" className="btn-primary w-auto px-6" />
        </div>
      </form>
    </details>
  );
}
