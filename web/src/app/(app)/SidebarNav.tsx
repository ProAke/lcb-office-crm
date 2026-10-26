"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: string; icon: string };

const NAV: { section: string; items: Item[] }[] = [
  {
    section: "ภาพรวม",
    items: [
      {
        href: "/dashboard",
        label: "แดชบอร์ด",
        icon: "M3 12h4l3-7 4 14 3-7h4",
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
      {
        href: "/plan",
        label: "แผนย้ายระบบ PHP → Next.js",
        icon: "M8 4h8l4 4v12H4V4h4zM8 12h8M8 16h5",
      },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
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
                        ? "bg-white/12 font-medium text-white shadow-inner"
                        : "text-white/70 hover:bg-white/6 hover:text-white",
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
                      <span className="ml-auto rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
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
