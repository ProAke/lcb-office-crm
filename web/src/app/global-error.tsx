"use client";
import { useEffect } from "react";
import { reportIncident } from "@/lib/report-incident";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportIncident("ui_error"); }, []);
  return <html lang="th"><body><main style={{ fontFamily: "sans-serif", maxWidth: 560, margin: "60px auto", padding: 20 }}><h1>ขออภัย ระบบขัดข้องชั่วคราว</h1><p>ระบบพยายามแจ้งผู้ดูแลแล้ว กรุณาลองใหม่หรือติดต่อผู้ดูแล</p><button onClick={reset}>ลองใหม่</button></main></body></html>;
}
