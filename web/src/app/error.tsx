"use client";
import { useEffect } from "react";
import { reportIncident } from "@/lib/report-incident";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportIncident("ui_error"); }, []);
  return <div role="alert" className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-xl font-semibold">ขออภัย ส่วนนี้ขัดข้องชั่วคราว</h1><p className="text-sm text-muted">ระบบพยายามส่งประเภทปัญหาให้ผู้ดูแลแล้ว หากยังใช้งานไม่ได้กรุณาติดต่อผู้ดูแล</p><button onClick={reset} className="btn-primary">ลองใหม่</button> <a className="text-brand-700 underline" href="/dashboard">กลับหน้าหลัก</a></div>;
}
