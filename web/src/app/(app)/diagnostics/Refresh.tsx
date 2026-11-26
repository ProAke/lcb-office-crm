"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Refresh() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 10000);
    return () => window.clearInterval(id);
  }, [router]);
  return <p className="text-xs text-muted">รีเฟรชอัตโนมัติทุก 10 วินาทีเมื่อเปิดหน้านี้</p>;
}
