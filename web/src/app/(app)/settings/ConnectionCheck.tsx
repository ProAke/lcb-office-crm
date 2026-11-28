"use client";
import { useActionState } from "react";
import { checkConnection, type CheckState } from "./actions";
const initial: CheckState = {};
export default function ConnectionCheck({ channel }: { channel: "line" | "facebook" }) {
  const [state, action, pending] = useActionState(checkConnection, initial);
  return <form action={action} className="space-y-2"><input type="hidden" name="channel" value={channel} /><button type="submit" disabled={pending} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{pending ? "กำลังทดสอบ…" : "ทดสอบการเชื่อมต่อ"}</button>{state.message && <p role="status" className="text-xs leading-relaxed text-slate-600">{state.message}</p>}</form>;
}
