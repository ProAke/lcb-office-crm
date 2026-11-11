"use server";

import { revalidatePath } from "next/cache";
import { adjustStock, createProduct } from "@/lib/crm/repo";

export type ProductFormState = { error?: string };

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  if (!name || price <= 0) return { error: "กรุณากรอกชื่อและราคาถูกต้อง" };

  const type = String(formData.get("type") ?? "product") === "service" ? "service" : "product";
  createProduct({
    sku: String(formData.get("sku") ?? "").trim() || `AUTO-${Date.now().toString(36).toUpperCase()}`,
    name,
    brand: String(formData.get("brand") ?? "").trim() || "ทั่วไป",
    type,
    category: String(formData.get("category") ?? "").trim() || (type === "service" ? "บริการ" : "ทั่วไป"),
    price,
    cost: Number(formData.get("cost") ?? 0),
    stock: type === "product" ? Number(formData.get("stock") ?? 0) : 0,
    minStock: type === "product" ? Number(formData.get("minStock") ?? 0) : 0,
    unit: String(formData.get("unit") ?? "").trim() || (type === "service" ? "ครั้ง" : "ชิ้น"),
    active: true,
  });

  revalidatePath("/products");
  return {};
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const delta = Number(formData.get("delta"));
  if (id && Number.isFinite(delta)) adjustStock(id, delta);
  revalidatePath("/products");
}
