"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string };

/**
 * เทียบเท่า authentication/login-process.php
 * PHP เดิม: ตรวจ $_POST → set $_SESSION['user'] → header('Location: ../dashboard/')
 * Next.js: Server Action (ฟอร์ม POST เข้ามาที่ฟังก์ชันนี้โดยตรง ไม่ต้องมี endpoint แยก)
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await login(email, password);
  if (!result.ok) {
    return { error: result.message };
  }

  await createSession(result.user);
  redirect("/dashboard");
}
