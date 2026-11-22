import type { Metadata } from "next";

export const metadata: Metadata = { title: "แผนระบบ App" };

const sections = [
  { title: "1. ตรวจสอบข้อมูลเดิม", text: "สำรวจ schema ของ MySQL บัญชีผู้ใช้ งานและการเชื่อมต่อเดิมโดยไม่แก้ข้อมูล แล้วจัดทำ mapping ที่ตรวจสอบได้" },
  { title: "2. เชื่อมฐานข้อมูลและบัญชีจริง", text: "พัฒนา repository และระบบล็อกอินให้ใช้ข้อมูลเดิม พร้อมตรวจสิทธิ์และ transaction โดยไม่เปลี่ยน schema เดิม" },
  { title: "3. พัฒนาและทดสอบบริการ", text: "ตรวจสอบ CRM ศูนย์บริการ แชทและการเผยแพร่ รวมถึงทดสอบ Rich Menu 6 ช่องและพัฒนาระบบแต้ม QR ตามข้อกำหนดที่อนุมัติ" },
  { title: "4. ทดสอบก่อนเปิดระบบ", text: "ทดสอบกับฐานสำเนาและ LINE test account ตรวจสอบความปลอดภัย การสำรอง/กู้คืน และให้ร้านตรวจรับ" },
  { title: "5. เปิดใช้โดเมน App", text: "ผู้ดูแลตั้ง DNS และ HTTPS สำหรับ app.laemchabanginterautotire.com เชื่อม webhook เมื่อระบบพร้อม และเตรียม rollback" },
  { title: "6. ปลดระวางระบบเดิม", text: "ปิดหรือลบระบบ PHP บนโฮสต์เดิมได้หลังตรวจรับ สำรองและทดสอบกู้คืน พร้อมได้รับอนุมัติจากเจ้าของระบบ" },
];

export default function PlanPage() {
  return <div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-sm font-medium text-brand-700">NEXT.JS · APP DOMAIN</p><h1 className="mt-1 text-2xl font-semibold">แผนระบบและการเปิดใช้งาน</h1><p className="mt-2 text-sm text-muted">เป้าหมาย: https://app.laemchabanginterautotire.com</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><strong>ยังไม่พร้อมใช้งานจริง:</strong> CRM ยังใช้ข้อมูลเดโม ยังไม่ได้เชื่อม MySQL และบัญชีผู้ใช้จริง ระบบสมาชิก QR ยังต้องพัฒนา และ Rich Menu แบบ 3×2 ยังต้องทดสอบกับ LINE จริง ห้ามนำข้อมูลลูกค้าจริงมาใช้จนกว่าจะทดสอบและอนุมัติครบ</div>
    <section className="card space-y-4 p-5"><h2 className="font-semibold">ลำดับงานที่ต้องดำเนินการ</h2><div className="grid gap-3 md:grid-cols-2">{sections.map(s => <div key={s.title} className="rounded-lg border border-line p-4"><h3 className="text-sm font-semibold">{s.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p></div>)}</div></section>
    <section className="card space-y-3 p-5"><h2 className="font-semibold">หลักการสำคัญ</h2><ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted"><li>ใช้ MySQL ชุดเดิมโดยไม่เปลี่ยน schema หรือลบข้อมูลโดยไม่ได้รับอนุมัติ การตั้ง DATABASE_URL เพียงอย่างเดียวไม่เชื่อมข้อมูล CRM</li><li>ไม่มีซอร์สไฟล์ PHP สำหรับรันอยู่ใน repository นี้ การปลดระวางระบบที่โฮสต์เดิมต้องดำเนินการแยกและตรวจสอบก่อน</li><li>ระบบปัจจุบันไม่สามารถล็อกอินด้วยบัญชีเดโมใน production และยังต้องพัฒนาการยืนยันตัวตนจริง</li><li>โดเมนที่แสดงเป็นเป้าหมาย ยังไม่ได้ยืนยันว่า DNS, HTTPS หรือ deployment ถูกตั้งค่าแล้ว</li></ul></section>
  </div>;
}
