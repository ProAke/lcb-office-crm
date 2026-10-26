import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LCB Office — Laem Chabang Inter Auto Tire",
    template: "%s · LCB Office",
  },
  description: "ระบบบริหารจัดการสำนักงาน ล้อและยาง (Next.js)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
