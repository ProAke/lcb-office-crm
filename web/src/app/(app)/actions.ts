"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

/** เทียบเท่า logout.php: session_destroy() + header('Location: login') */
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
