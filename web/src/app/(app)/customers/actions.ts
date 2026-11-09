"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCustomer, updateCustomer } from "@/lib/crm/repo";
import type { Tier } from "@/lib/crm/types";

export type FormState = { error?: string };

export async function createCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return { error: "กรุณากรอกชื่อและเบอร์โทร" };

  const tier = (String(formData.get("tier") ?? "new") || "new") as Tier;
  if (!["vip", "regular", "new"].includes(tier)) return { error: "ระดับลูกค้าไม่ถูกต้อง" };

  const c = createCustomer({
    name,
    phone,
    lineId: String(formData.get("lineId") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    tier,
    plate: String(formData.get("plate") ?? "").trim() || undefined,
    brand: String(formData.get("brand") ?? "").trim() || undefined,
    model: String(formData.get("model") ?? "").trim() || undefined,
    tireSize: String(formData.get("tireSize") ?? "").trim() || undefined,
  });

  revalidatePath("/customers");
  redirect(`/customers/${c.id}`);
}

export async function updateCustomerAction(
  id: number,
  formData: FormData,
): Promise<void> {
  const tier = String(formData.get("tier") ?? "new") as Tier;
  updateCustomer(id, {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    lineId: String(formData.get("lineId") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    tier: ["vip", "regular", "new"].includes(tier) ? tier : "regular",
  });
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
}
