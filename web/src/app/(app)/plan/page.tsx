import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "แผนระบบและการเผยแพร่" };
const steps = [
  { no: "01", title: "ตรวจข้อมูลและบัญชีเดิม", status: "รอตรวจสอบ", text: "สำรวจ schema MySQL ผู้ใช้ และระบบเดิมแบบอ่านอย่างเดียว จัดทำ mapping โดยไม่เปลี่ยนตารางหรือข้อมูล" },
  { no: "02", title: "เชื่อมระบบและตั้งค่าสิทธิ์", status: "ต้องพัฒนา", text: "เชื่อมฐานเดิมและบัญชีจริง ตรวจสิทธิ์ทุก action สำรองและทดสอบกู้คืน รวมถึงตั้งค่าช่องทางอย่างปลอดภัย" },
  { no: "03", title: "เตรียมสินค้าและโปรโมชั่น", status: "ต้นแบบ", text: "ตรวจชื่อ ราคา สต็อก วันเริ่ม/สิ้นสุด และเงื่อนไขในข้อมูลทดสอบก่อนอนุมัติเผยแพร่" },
  { no: "04", title: "เตรียม LINE Rich Menu", status: "ต้องทดสอบ", text: "กำหนดภาพและปลายทาง 6 ช่อง ทดลองสินค้า โปร จอง สมาชิก แผนที่ และติดต่อกับ LINE test account" },
  { no: "05", title: "สมาชิกและสะสมคะแนน", status: "ยังไม่พัฒนา", text: "อนุมัติกติกาแต้ม ตรวจ schema เดิม และพัฒนายืนยันสมาชิก ประวัติ สแกน QR และป้องกันแต้มซ้ำ" },
  { no: "06", title: "ตรวจรับและเผยแพร่จริง", status: "รออนุมัติ", text: "ทดสอบ UAT ความปลอดภัย ผลการส่ง และ rollback ก่อนเปิดช่องทางจริง; ไม่ลบระบบเดิมก่อนยืนยันและสำรอง" },
];
export default function PlanPage() {
  return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">RELEASE ROADMAP</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">แผนระบบและการเผยแพร่</h1><p className="mt-1 text-sm text-muted">ทำทีละขั้นจากข้อมูลเดโมสู่ช่องทางบริการจริง</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"><strong>ยังไม่พร้อม production:</strong> การเชื่อม MySQL และบัญชีจริงยังไม่เสร็จ คะแนน/QR ยังไม่มี และ LINE ยังต้องทดสอบกับบัญชีจริง ปุ่มเผยแพร่เดิมอาจส่งจริงหากตั้ง token แล้ว จึงควรใช้บัญชีทดสอบเท่านั้น</div>
    <div className="grid gap-4 md:grid-cols-2">{steps.map(step => <section key={step.no} className="card flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-amber-300">{step.no}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{step.title}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{step.status}</span></div><p className="mt-2 text-sm leading-relaxed text-slate-500">{step.text}</p></div></section>)}</div>
    <div className="flex flex-wrap gap-3 text-sm"><Link href="/settings" className="font-semibold text-brand-700 hover:underline">ตั้งค่าระบบ →</Link><Link href="/line-workspace" className="font-semibold text-brand-700 hover:underline">บริการผ่าน LINE →</Link><Link href="/publish" className="font-semibold text-brand-700 hover:underline">Publishing Hub →</Link></div>
  </div>;
}
