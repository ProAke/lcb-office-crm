import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ฝั่งแบรนด์ — แทนหน้า login เดิมที่เป็น PHP + AdminLTE */}
      <section className="relative hidden overflow-hidden bg-brand-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(900px 420px at 12% 8%, #1668a5 0%, transparent 60%), radial-gradient(700px 380px at 92% 96%, #12507f 0%, transparent 62%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/12 ring-1 ring-white/25 backdrop-blur">
              {/* ไอคอนล้อ/ยาง แทน logo_cockpit.png เดิม */}
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="3.2" />
                <path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3" />
              </svg>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                Laem Chabang
              </p>
              <p className="text-lg font-semibold leading-tight">
                Inter Auto Tire Office
              </p>
            </div>
          </div>

          <h1 className="mt-14 max-w-md text-3xl font-semibold leading-snug">
            ระบบบริหารจัดการสำนักงาน
            <br />
            <span className="text-white/70">เวอร์ชันใหม่บน Next.js</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
            ใช้ฐานข้อมูล MySQL ชุดเดิมทั้งหมด โครงสร้างข้อมูลไม่เปลี่ยนแปลง
            แต่เปลี่ยนชั้นการทำงานจาก PHP เป็น Next.js (App Router + Server Actions)
          </p>

          <ul className="mt-10 space-y-3 text-sm text-white/75">
            {[
              "ล็อกอินด้วยบัญชีเดิม และรหัสผ่านแบบ bcrypt เดิม",
              "สิทธิ์ผู้ใช้ (role) คุมด้วย middleware แทน if($_SESSION)",
              "โมดูล LINE Rich Menu ยังทำงานร่วมกับ Messaging API ได้เหมือนเดิม",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Laem Chabang Inter Auto Tire Co., Ltd.
        </p>
      </section>

      {/* ฟอร์มล็อกอิน */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Laem Chabang Inter Auto Tire
            </p>
            <h2 className="mt-1 text-xl font-semibold">LCB Office</h2>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h2>
          <p className="mt-1.5 mb-7 text-sm text-muted">
            กรุณาใช้อีเมลและรหัสผ่านของท่านเพื่อเข้าใช้งาน
          </p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
