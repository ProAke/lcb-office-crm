"use server";
import { checkDatabaseConnection } from "@/lib/database-check";
import { getSession } from "@/lib/session";
import { checkLineConnection, checkFacebookConnection } from "@/lib/connection-check";
export type CheckState = { message?: string };
export async function checkConnection(_state: CheckState, form: FormData): Promise<CheckState> {
  const user = await getSession();
  if (user?.role !== "admin") return { message: "เฉพาะผู้ดูแลระบบเท่านั้น" };
  const channel = form.get("channel");
  if (channel === "database") return { message: await checkDatabaseConnection(process.env.DATABASE_URL) };
  if (channel === "line") return { message: await checkLineConnection(process.env.LINE_CHANNEL_ACCESS_TOKEN) };
  if (channel === "facebook") return { message: await checkFacebookConnection(process.env.FB_PAGE_ID, process.env.FB_PAGE_ACCESS_TOKEN) };
  return { message: "ช่องทางไม่ถูกต้อง" };
}
