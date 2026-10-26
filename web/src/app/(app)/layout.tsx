import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SidebarNav from "./SidebarNav";
import { logoutAction } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  staff: "พนักงาน",
  viewer: "ผู้ชม",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const initials = session.name.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar — แทน main-sidebar ของ AdminLTE เดิม */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-brand-900 p-4 lg:flex">
        <div>
          <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="12" r="8.5" />
                <circle cx="12" cy="12" r="3.2" />
                <path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                Laem Chabang
              </p>
              <p className="text-sm font-semibold text-white">LCB Office</p>
            </div>
          </Link>

          <SidebarNav />
        </div>

        <div className="rounded-xl bg-white/6 p-3 text-xs text-white/60">
          <p className="font-medium text-white/85">Next.js App Router</p>
          <p className="mt-1 leading-relaxed">
            ฐานข้อมูล MySQL ชุดเดิม · โครงสร้างตารางไม่เปลี่ยน
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/85 px-4 backdrop-blur lg:px-7">
          <div className="flex items-center gap-3">
            <span className="lg:hidden grid h-8 w-8 place-items-center rounded-lg bg-brand-900 text-xs font-bold text-white">
              LCB
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">
                ระบบบริหารจัดการสำนักงาน
              </p>
              <p className="text-[11px] text-muted">
                office.laemchabanginterautotire.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session.name}</p>
              <p className="text-[11px] text-muted">
                {ROLE_LABEL[session.role] ?? session.role}
              </p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              {initials}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-7 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
