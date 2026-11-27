import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "บริการลูกค้าผ่าน LINE" };
const channels = [
  { n: "01", title: "โปรโมชั่น", detail: "จัดการรายการและเงื่อนไขโปรโมชั่นในหลังบ้าน ก่อนเตรียมหน้าลูกค้า", status: "ข้อมูลเดโม", href: "/promotions", link: "จัดการโปรโมชั่น" },
  { n: "02", title: "สินค้าและบริการ", detail: "จัดการรายการ ราคา และสต็อกในหลังบ้าน ก่อนเตรียมแค็ตตาล็อกสำหรับลูกค้า", status: "ข้อมูลเดโม", href: "/products", link: "จัดการสินค้า" },
  { n: "03", title: "จองนัดหมาย", detail: "ดูคิวและงานบริการในหลังบ้าน แบบฟอร์มจองสำหรับลูกค้าผ่าน LINE ยังต้องพัฒนา", status: "ต้องพัฒนาหน้าลูกค้า", href: "/service", link: "ดูศูนย์บริการ" },
  { n: "04", title: "สมาชิกและคะแนน", detail: "ยอดสะสมคะแนน การแลกคะแนน QR และการเชื่อมสมาชิก LINE ยังไม่ได้พัฒนา", status: "ยังไม่เปิดใช้", href: "/plan", link: "ดูแผนพัฒนา" },
  { n: "05", title: "Location", detail: "ตั้ง URL Google Maps โดยตรงใน Rich Menu หลังยืนยันลิงก์สาขากับเจ้าของร้าน", status: "รอยืนยันลิงก์", href: "/line-rich-menu", link: "ตั้งค่าเมนู" },
  { n: "06", title: "ติดต่ออื่น ๆ", detail: "ตั้งข้อความหรือลิงก์ติดต่อใน Rich Menu หลังตรวจสอบช่องทางและเวลาทำการ", status: "รอตรวจสอบ", href: "/line-rich-menu", link: "ตั้งค่าเมนู" },
];
export default function LineWorkspacePage() {
  return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">LINE CUSTOMER JOURNEY</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">บริการลูกค้าผ่าน LINE</h1><p className="mt-1 text-sm text-muted">วางแผน 6 ช่อง แล้วจัดการข้อมูลจากหลังบ้านในที่เดียว</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><strong>สถานะต้นแบบ:</strong> หน้านี้เป็นแผนและทางลัดหลังบ้าน ไม่ได้สร้างหน้าลูกค้าหรือระบบคะแนนโดยอัตโนมัติ ปุ่ม Rich Menu ต้องกำหนด URL ที่ลูกค้าเข้าถึงได้ และทดสอบกับ LINE test account ก่อนใช้งานจริง</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{channels.map(c => <section key={c.n} className="card flex flex-col p-5"><div className="flex items-start justify-between gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-amber-300">{c.n}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{c.status}</span></div><h2 className="mt-4 font-semibold text-slate-900">{c.title}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{c.detail}</p><Link href={c.href} className="mt-4 w-fit text-sm font-semibold text-brand-700 hover:underline">{c.link} →</Link></section>)}</div>
    <section className="card flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">พร้อมจัดตำแหน่ง 6 ช่องหรือยัง?</h2><p className="mt-1 text-sm text-muted">อัปโหลดภาพและกำหนดข้อความหรือลิงก์แต่ละช่องในตัวจัดการ Rich Menu</p></div><Link href="/line-rich-menu" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">เปิดตัวจัดการ →</Link></section>
  </div>;
}
