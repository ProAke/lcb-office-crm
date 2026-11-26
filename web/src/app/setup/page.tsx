import { fileSetupStatus } from "@/lib/file-setup";
import SetupForm from "./setup-form";
export const dynamic = "force-dynamic";
export default function SetupPage() {
  const available = fileSetupStatus();
  return <main className="mx-auto max-w-lg space-y-4 p-6"><h1 className="text-xl font-semibold">ตั้งค่าผู้ดูแลชั่วคราว</h1><p className="text-sm text-muted">สำหรับ staging ที่จำกัดการเข้าถึงเท่านั้น บัญชีหมดอายุหลังตั้งค่า 24 ชั่วโมง ข้อมูลยังเป็นเดโม</p>{available ? <SetupForm /> : <p className="card p-4">ยังไม่ได้เปิดการตั้งค่า รหัสหมดอายุ หรือการตั้งค่าเสร็จแล้ว กรุณาติดต่อผู้ดูแลโฮสต์</p>}</main>;
}
