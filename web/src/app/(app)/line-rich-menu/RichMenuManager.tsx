"use client";

import { useCallback, useEffect, useState } from "react";

type Menu = { richMenuId: string; name: string; chatBarText: string; size: { width: number; height: number } };
type Button = { label: string; type: "message" | "uri"; value: string };
const blank = (): Button => ({ label: "", type: "message", value: "" });
const endpoint = "/api/line/rich-menu";

export default function RichMenuManager({ canEdit }: { canEdit: boolean }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttons, setButtons] = useState<Button[]>([blank()]);
  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMenus(data.menus); setDefaultId(data.defaultId); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = new FormData(form); data.set("buttons", JSON.stringify(buttons));
      const response = await fetch(endpoint, { method: "POST", body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      form.reset(); setButtons([blank()]); setNotice("สร้างเมนูและอัปโหลดภาพแล้ว ตั้งเป็นเมนูหลักได้จากรายการด้านล่าง"); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "สร้างเมนูไม่สำเร็จ"); } finally { setBusy(false); }
  }
  async function change(id: string, remove: boolean) {
    if (remove && !window.confirm("ลบเมนูนี้ออกจาก LINE อย่างถาวรหรือไม่?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, { method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setNotice(remove ? "ลบเมนูแล้ว" : "ตั้งเมนูหลักแล้ว"); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ"); } finally { setBusy(false); }
  }
  function update(index: number, patch: Partial<Button>) { setButtons(buttons.map((b, i) => i === index ? { ...b, ...patch } : b)); }
  return <div className="mx-auto max-w-5xl space-y-5">
    <header><h1 className="text-xl font-semibold">LINE Rich Menu</h1><p className="mt-1 text-sm text-muted">จัดการเมนูจริงของ LINE Official Account ผ่าน Messaging API</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {!canEdit && <p className="rounded-xl bg-amber-50 p-4 text-sm">เฉพาะผู้ดูแลระบบเท่านั้นที่สร้าง เปลี่ยน หรือลบเมนูได้</p>}
    {canEdit && <form onSubmit={create} className="card space-y-4 p-5">
      <h2 className="font-semibold">สร้าง Rich Menu ใหม่</h2>
      <p className="text-sm text-muted">อัปโหลดภาพที่ออกแบบไว้แล้ว ปุ่มแบ่งพื้นที่ภาพแนวตั้งเท่า ๆ กันจากซ้ายไปขวา (1–6 ปุ่ม) การสร้างยังไม่เปลี่ยนเมนูหลัก</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">ชื่อเมนู<input className="input mt-1 w-full" name="name" maxLength={300} required /></label>
        <label className="text-sm">ข้อความบนแถบแชท (ไม่เกิน 14 ตัวอักษร)<input className="input mt-1 w-full" name="chatBarText" maxLength={14} required /></label>
        <label className="text-sm">ขนาดภาพ<select className="input mt-1 w-full" name="size"><option value="full">2500 × 1686</option><option value="half">2500 × 843</option></select></label>
        <label className="text-sm">ภาพ PNG หรือ JPEG (ไม่เกิน 1 MB)<input className="input mt-1 w-full" type="file" name="image" accept="image/png,image/jpeg" required /></label>
      </div>
      <div className="space-y-3"><h3 className="text-sm font-semibold">ปุ่มบนภาพ</h3>{buttons.map((b, i) => <div key={i} className="grid gap-2 rounded-lg bg-surface p-3 md:grid-cols-[1fr_1fr_2fr_auto]">
        <input aria-label={`ชื่อปุ่ม ${i + 1}`} className="input" placeholder={`ชื่อปุ่ม ${i + 1}`} maxLength={20} required value={b.label} onChange={e => update(i, { label: e.target.value })} />
        <select aria-label={`ประเภทปุ่ม ${i + 1}`} className="input" value={b.type} onChange={e => update(i, { type: e.target.value as Button["type"] })}><option value="message">ส่งข้อความ</option><option value="uri">เปิดลิงก์</option></select>
        <input aria-label={`ค่าปุ่ม ${i + 1}`} className="input" placeholder={b.type === "uri" ? "https://..." : "ข้อความที่ส่งเมื่อกด"} required value={b.value} onChange={e => update(i, { value: e.target.value })} />
        <button type="button" className="text-sm text-red-700" disabled={buttons.length === 1 || busy} onClick={() => setButtons(buttons.filter((_, n) => n !== i))}>ลบปุ่ม</button>
      </div>)}<button type="button" className="text-sm text-brand-700" disabled={buttons.length >= 6 || busy} onClick={() => setButtons([...buttons, blank()])}>+ เพิ่มปุ่ม</button></div>
      <button className="btn-primary" disabled={busy}>{busy ? "กำลังดำเนินการ…" : "สร้างและอัปโหลดภาพ"}</button>
    </form>}
    <section className="card space-y-3 p-5"><div className="flex justify-between"><h2 className="font-semibold">เมนูบน LINE</h2><button className="text-sm text-brand-700" onClick={() => void load()}>รีเฟรช</button></div>
      {loading ? <p className="text-sm text-muted">กำลังโหลด…</p> : menus.length === 0 ? <p className="text-sm text-muted">ไม่มีรายการที่แสดง</p> : <div className="space-y-3">{menus.map(m => <div key={m.richMenuId} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"><div><p className="font-medium">{m.name} {m.richMenuId === defaultId && <span className="text-xs text-emerald-700">เมนูหลัก</span>}</p><p className="break-all text-xs text-muted">{m.richMenuId} · {m.size.width} × {m.size.height} · {m.chatBarText}</p></div>{canEdit && <div className="flex gap-3 text-sm"><button className="text-brand-700" disabled={busy || m.richMenuId === defaultId} onClick={() => void change(m.richMenuId, false)}>ตั้งเป็นเมนูหลัก</button><button className="text-red-700" disabled={busy} onClick={() => void change(m.richMenuId, true)}>ลบ</button></div>}</div>)}</div>}
    </section>
    <p className="text-xs text-muted">เมนูหลักใช้กับผู้ใช้ที่ไม่มีเมนูเฉพาะบุคคล และอาจใช้เวลาสักครู่จึงปรากฏใน LINE ตั้งค่า token เฉพาะบนเซิร์ฟเวอร์</p>
  </div>;
}
