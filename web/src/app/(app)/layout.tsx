import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SidebarNav from "./SidebarNav";
import { logoutAction } from "./actions";

const ROLE_LABEL: Record<string, string> = { admin: "ผู้ดูแลระบบ", staff: "พนักงาน", viewer: "ผู้ชม" };

function Brand() {
  return <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-1 py-1">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-sm font-black text-slate-950">LCB</span>
    <span><span className="block text-sm font-semibold tracking-wide text-white">LCB OFFICE</span><span className="block text-[11px] text-slate-400">CRM & SERVICE CENTER</span></span>
  </Link>;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const initials = session.name.slice(0, 1).toUpperCase();
  return <div className="min-h-screen bg-[#f4f6f9] lg:flex">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4 lg:flex">
      <div className="border-b border-slate-800 pb-5"><Brand /></div>
      <div className="min-h-0 flex-1 overflow-y-auto py-5"><SidebarNav /></div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-xs font-semibold text-slate-200">พื้นที่ทดลองระบบ</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">ข้อมูล CRM ยังเป็นเดโม · ฐานจริงยังไม่เชื่อม</p></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-7">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-bold text-amber-300 lg:hidden">LCB</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">ศูนย์บริหารงานบริการ</p><p className="truncate text-[11px] text-slate-500">app.laemchabanginterautotire.com</p></div></div>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium text-slate-800">{session.name}</p><p className="text-[11px] text-slate-500">{ROLE_LABEL[session.role] ?? session.role}</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-amber-300">{initials}</span><form action={logoutAction}><button type="submit" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">ออกจากระบบ</button></form></div>
        </div>
        <details className="group border-t border-slate-100 lg:hidden"><summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700">☰ เมนูระบบ</summary><div className="max-h-[65vh] overflow-y-auto bg-slate-950 px-4 py-4"><SidebarNav /></div></details>
      </header>
      {session.bootstrap && <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">บัญชีผู้ดูแลชั่วคราว · ข้อมูลยังเป็นเดโม ไม่ใช้ข้อมูลลูกค้าจริงหรือเชื่อมช่องทางจริง และปิดบัญชีนี้เมื่อเสร็จสิ้นการตั้งค่า</div>}
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-7 lg:py-8">{children}</main>
    </div>
  </div>;
}
