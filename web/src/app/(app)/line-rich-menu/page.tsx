import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import RichMenuManager from "./RichMenuManager";

export const metadata: Metadata = { title: "LINE Rich Menu" };
export default async function LineRichMenuPage() {
  const session = await getSession();
  return <RichMenuManager canEdit={session?.role === "admin"} />;
}
