"use server";

import { revalidatePath } from "next/cache";
import {
  advanceBooking,
  advanceJob,
  cancelBooking,
  createBooking,
} from "@/lib/crm/repo";

export type BookingFormState = { error?: string };

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const name = String(formData.get("customerName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!name || !phone || !date || !time) {
    return { error: "กรุณากรอกชื่อ เบอร์ วันและเวลาให้ครบ" };
  }
  createBooking({
    customerName: name,
    phone,
    plate: String(formData.get("plate") ?? "").trim() || "แจ้งหน้าร้าน",
    service: String(formData.get("service") ?? "").trim() || "เช็กสภาพยาง",
    date,
    time,
    source: "phone",
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
  revalidatePath("/service");
  revalidatePath("/dashboard");
  return {};
}

export async function advanceBookingAction(formData: FormData): Promise<void> {
  advanceBooking(Number(formData.get("id")));
  revalidatePath("/service");
  revalidatePath("/dashboard");
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  cancelBooking(Number(formData.get("id")));
  revalidatePath("/service");
}

export async function advanceJobAction(formData: FormData): Promise<void> {
  advanceJob(Number(formData.get("id")));
  revalidatePath("/service");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
