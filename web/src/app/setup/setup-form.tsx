"use client";
import { useState } from "react";
export default function SetupForm() {
  const [error, setError] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: f.get("code"), password: f.get("password"), confirm: f.get("confirm") }) });
      const body = await r.json(); if (!r.ok) throw new Error(body.error); setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด"); } finally { setBusy(false); }
  }
  if (done) return <p className="card p-4">ตั้งค่าแล้ว เข้าสู่ระบบด้วยชื่อ <strong>admin</strong> และรหัสผ่านที่ตั้งไว้ที่ <a href="/login" className="text-brand-700 underline">หน้าเข้าสู่ระบบ</a></p>;
  return <form onSubmit={submit} className="card space-y-4 p-5"><label className="block text-sm">รหัสตั้งค่าครั้งเดียว<input className="input mt-1 w-full" name="code" type="password" autoComplete="off" required /></label><label className="block text-sm">รหัสผ่านใหม่ (อย่างน้อย 16 ตัวอักษร)<input className="input mt-1 w-full" name="password" type="password" minLength={16} autoComplete="new-password" required /></label><label className="block text-sm">ยืนยันรหัสผ่าน<input className="input mt-1 w-full" name="confirm" type="password" minLength={16} autoComplete="new-password" required /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="btn-primary">{busy ? "กำลังตั้งค่า…" : "บันทึกรหัสผ่าน"}</button></form>;
}
