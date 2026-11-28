"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: string; icon: string };

const NAV: { section: string; items: Item[] }[] = [
  {
    section: "Cockpit",
    items: [
      {
        href: "/dashboard",
        label: "แดชบอร์ดกลาง",
        icon: "M3 12h4l3-7 4 14 3-7h4",
      },
      {
        href: "/service",
        label: "ศูนย์บริการ (จอง/งาน)",
        icon: "M14.7 6.3a4.5 4.5 0 1 0-6.4 6.4L3 18l3 3 5.3-5.3a4.5 4.5 0 0 0 6.4-6.4l-2.8 2.8-2.1-2.1 2.9-3.7z",
      },
      {
        href: "/chat",
        label: "AI ตอบแชท",
        badge: "AI",
        icon: "M4 5h16v10H9l-5 4V5zM8 9h8M8 12h5",
      },
    ],
  },
  {
    section: "CRM & การขาย",
    items: [
      {
        href: "/customers",
        label: "ลูกค้า (CRM)",
        icon: "M16 19v-1a4 4 0 0 0-8 0v1M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
      },
      {
        href: "/products",
        label: "สินค้า & บริการ",
        icon: "M4 8l8-4 8 4v8l-8 4-8-4V8zM4 8l8 4m0 0l8-4m-8 4v8",
      },
      {
        href: "/promotions",
        label: "โปรโมชันรายเดือน",
        badge: "รายเดือน",
        icon: "M12 4l1.8 4.6L18 10.4l-4.2 1.8L12 17l-1.8-4.8L6 10.4l4.2-1.8L12 4zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
      },
    ],
  },
  {
    section: "ช่องทางเผยแพร่",
    items: [
      { href: "/line-workspace", label: "บริการลูกค้าผ่าน LINE", icon: "M4 5h16v10H9l-5 4V5zM8 9h8M8 12h5" },
      {
        href: "/publish",
        label: "เผยแพร่ทุกช่องทาง",
        badge: "Hub",
        icon: "M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5M4 15v4h16v-4M7 19l5 2 5-2",
      },
      {
        href: "/line-rich-menu",
        label: "LINE Rich Menu",
        badge: "API",
        icon: "M4 5h16v10H8l-4 4V5z",
      },
    ],
  },
  {
    section: "ระบบ",
    items: [
      { href: "/settings", label: "ศูนย์การเชื่อมต่อ", icon: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
      { href: "/diagnostics", label: "ตรวจสอบปัญหา", icon: "M12 3l9 16H3L12 3zM12 9v4M12 16h.01" },
      {
        href: "/plan",
        label: "แผนระบบและการเปิดใช้งาน",
        icon: "M8 4h8l4 4v12H4V4h4zM8 12h8M8 16h5",
      },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {group.section}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-amber-500/15 font-medium text-amber-300"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                    ].join(" ")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 opacity-80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
