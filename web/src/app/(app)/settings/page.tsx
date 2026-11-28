import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import ConnectionCheck from "./ConnectionCheck";

export const metadata: Metadata = { title: "ตั้งค่าระบบ" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSession();
  if (user?.role !== "admin") notFound();
  const items = [
    { name: "ฐานข้อมูลและบัญชีผู้ใช้", detail: "CRM และบัญชีจริงยังไม่ได้เชื่อม MySQL เดิม การกำหนด DATABASE_URL เพียงอย่างเดียวไม่เพียงพอ", status: "ต้องพัฒนา", href: "/plan", action: "ดูแผน" },
    { name: "LINE Rich Menu", detail: "สร้างเมนู 6 ช่อง ตั้งปลายทาง และอัปโหลดภาพผ่าน LINE API; token ต้องตั้งบนเซิร์ฟเวอร์", status: process.env.LINE_CHANNEL_ACCESS_TOKEN ? "มีค่า token · ยังไม่ยืนยัน" : "ยังไม่มี token", href: "/line-rich-menu", action: "จัดการ Rich Menu" },
    { name: "Facebook Page", detail: "ทดสอบการอ่าน Page ID ด้วย token ที่ตั้งบนเซิร์ฟเวอร์ (ไม่ส่งโพสต์)", status: process.env.FB_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID ? "มีค่า · ยังไม่ยืนยัน" : "ยังตั้งค่าไม่ครบ", href: "/publish", action: "เปิด Publishing Hub" },
    { name: "สินค้าและบริการ", detail: "จัดหมวดสินค้า ราคา และสต็อกในข้อมูลเดโมก่อนเชื่อมฐานจริง", status: "ข้อมูลเดโม", href: "/products", action: "จัดการสินค้า" },
    { name: "โปรโมชั่นและการเผยแพร่", detail: "ตรวจรายการและแผนก่อนเผยแพร่ สถิติ reach/clicks ปัจจุบันเป็นข้อมูลจำลอง", status: "ต้องทดสอบ", href: "/publish", action: "เปิด Publishing Hub" },
    { name: "สมาชิกและสะสมแต้ม", detail: "การสะสมคะแนน QR การแลกคะแนน และการเชื่อมบัญชี LINE ยังไม่ได้พัฒนา", status: "ยังไม่เปิดใช้", href: "/plan", action: "ดูขั้นตอน" },
    { name: "ปัญหาและการแจ้งเตือน", detail: "ตรวจเหตุการณ์ล่าสุด ข้อมูลหน้าแสดงผลอยู่ในหน่วยความจำ และยังไม่มีการแจ้งเตือนภายนอก", status: "ต้นแบบ", href: "/diagnostics", action: "ตรวจสอบปัญหา" },
  ];
  return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">SYSTEM SETTINGS</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">ตั้งค่าระบบ</h1><p className="mt-1 text-sm text-muted">ศูนย์รวมสถานะและทางลัดสำหรับผู้ดูแล</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><strong>ยังไม่พร้อมใช้งานจริง:</strong> หน้านี้แสดงสถานะและทางลัดเท่านั้น ยังไม่สามารถบันทึก token หรือเชื่อมฐานข้อมูลจากหน้าเว็บได้ การมี token ไม่ได้หมายถึงเชื่อมต่อสำเร็จ</div>
    <div className="grid gap-4 md:grid-cols-2">{items.map(item => <section key={item.name} className="card flex flex-col gap-4 p-5"><div className="flex items-start justify-between gap-3"><div><span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-amber-300">•</span><h2 className="font-semibold text-slate-900">{item.name}</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{item.status}</span></div><p className="flex-1 text-sm leading-relaxed text-slate-500">{item.detail}</p>{item.name === "LINE Rich Menu" && <ConnectionCheck channel="line" />}{item.name === "Facebook Page" && <ConnectionCheck channel="facebook" />}<Link href={item.href} className="w-fit text-sm font-semibold text-brand-700 hover:underline">{item.action} →</Link></section>)}</div>
  </div>;
}
