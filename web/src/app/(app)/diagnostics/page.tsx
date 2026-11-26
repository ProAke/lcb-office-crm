import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { listIncidents, type IncidentType } from "@/lib/diagnostics";
import Refresh from "./Refresh";
export const dynamic = "force-dynamic";
const labels: Record<IncidentType, string> = { ui_error: "หน้าระบบขัดข้อง", login_blocked: "คำขอเข้าสู่ระบบถูกปฏิเสธ", login_server_error: "ระบบเข้าสู่ระบบตอบผิดปกติ", login_network_error: "เชื่อมต่อระบบเข้าสู่ระบบไม่ได้" };
export default async function DiagnosticsPage() {
  const user = await getSession(); if (user?.role !== "admin") notFound();
  const items = listIncidents();
  return <div className="mx-auto max-w-5xl space-y-5"><header><h1 className="text-xl font-semibold">ตรวจสอบปัญหา</h1><p className="mt-1 text-sm text-muted">รายการล่าสุดใน process นี้ (สูงสุด 50 รายการ)</p></header><div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">ข้อมูลในหน้านี้ไม่ถาวร อาจไม่ครบหากมีหลาย process และหายเมื่อรีสตาร์ต โปรดตรวจ log ของโฮสต์ด้วย ระบบยังไม่ส่งแจ้งเตือนอัตโนมัติ</div><Refresh /><section className="card space-y-3 p-5">{items.length === 0 ? <p className="text-sm text-muted">ยังไม่มีรายการใน process นี้ ไม่ได้ยืนยันว่าไม่มีปัญหา</p> : items.map(item => <div key={item.id} className="border-b border-line pb-3 text-sm"><p className="font-medium">{labels[item.type]}{item.status ? ` · HTTP ${item.status}` : ""}</p><p className="mt-1 break-all text-xs text-muted">{item.at} · รหัส {item.id}</p></div>)}</section><p className="text-xs text-muted">เหตุการณ์ส่งเท่าที่ทำได้ โดยไม่เก็บรหัสผ่าน ข้อความ error URL หรือข้อมูลลูกค้า</p></div>;
}
