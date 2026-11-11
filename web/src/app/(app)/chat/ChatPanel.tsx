"use client";

import { useEffect, useRef } from "react";
import type { Conversation } from "@/lib/crm/types";
import {
  askAiAction,
  markReadAction,
  sendReplyAction,
  simulateIncomingAction,
  toggleAiAction,
} from "./actions";

const SENDER_META: Record<string, { label: string; bubble: string }> = {
  customer: { label: "ลูกค้า", bubble: "bg-white ring-1 ring-line" },
  ai: { label: "AI Assistant", bubble: "bg-violet-50 ring-1 ring-violet-200" },
  staff: { label: "ทีมงาน", bubble: "bg-brand-700 text-white" },
};

export default function ChatPanel({ conversation: conv }: { conversation: Conversation }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages.length]);

  return (
    <section className="card flex min-h-[560px] flex-col overflow-hidden">
      {/* หัวห้อง */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{conv.displayName}</p>
          <p className="text-[11px] text-muted">
            {conv.customerId ? `ลูกค้าในระบบ #${conv.customerId}` : "ยังไม่ผูกกับลูกค้า"} · ข้อความค้าง {conv.unread}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleAiAction}>
            <input type="hidden" name="conversationId" value={conv.id} />
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition ${
                conv.aiAuto
                  ? "bg-violet-600 text-white ring-violet-600 hover:bg-violet-700"
                  : "bg-surface text-muted ring-line hover:bg-slate-100"
              }`}
            >
              🤖 AI Auto: {conv.aiAuto ? "เปิด" : "ปิด"}
            </button>
          </form>
          {conv.unread > 0 && (
            <form action={markReadAction}>
              <input type="hidden" name="conversationId" value={conv.id} />
              <button className="rounded-lg bg-surface px-3 py-1.5 text-xs text-muted ring-1 ring-line hover:bg-slate-100">
                อ่านแล้ว
              </button>
            </form>
          )}
        </div>
      </header>

      {/* สายข้อความ */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-surface/50 px-4 py-4">
        {conv.messages.map((m) => {
          const meta = SENDER_META[m.sender];
          const isOut = m.direction === "out";
          return (
            <div key={m.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${meta.bubble} ${isOut ? "rounded-br-md" : "rounded-bl-md"}`}>
                <p className={`whitespace-pre-wrap`}>{m.text}</p>
                <p className={`mt-1 text-[10px] ${m.sender === "staff" ? "text-white/60" : "text-muted"}`}>
                  {m.sender === "ai" ? "🤖 " : ""}{meta.label} · {m.at.slice(11, 16)} น.
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* กล่องพิมพ์ */}
      <div className="space-y-2 border-t border-line p-3">
        <form action={sendReplyAction} className="flex gap-2">
          <input type="hidden" name="conversationId" value={conv.id} />
          <input name="text" required placeholder="พิมพ์ตอบกลับในฐานะทีมงาน…" className="input" autoComplete="off" />
          <button className="shrink-0 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-600">ส่ง</button>
          <button
            formAction={askAiAction}
            className="shrink-0 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white hover:bg-violet-700"
            title="ให้ AI วิเคราะห์ข้อความล่าสุดของลูกค้าและตอบแทน"
          >
            🤖 ให้ AI ตอบ
          </button>
        </form>

        <details className="rounded-lg bg-amber-50/60 px-3 py-2 ring-1 ring-amber-200/60">
          <summary className="cursor-pointer text-[11px] font-medium text-amber-800">
            ⚙ เดโม: จำลองลูกค้าส่งข้อความเข้ามา (ของจริงเข้าผ่าน LINE/Facebook Webhook ที่ /api/webhooks/line)
          </summary>
          <form action={simulateIncomingAction} className="mt-2 flex gap-2">
            <input type="hidden" name="conversationId" value={conv.id} />
            <input
              name="text"
              required
              placeholder="เช่น 255/50 R20 ราคาเท่าไหร่ / โปรเดือนนี้มีอะไร / จองพรุ่งนี้เช้า"
              className="input text-xs"
              autoComplete="off"
            />
            <button className="shrink-0 rounded-lg bg-amber-500 px-3 text-xs font-medium text-white hover:bg-amber-600">
              จำลองข้อความเข้า
            </button>
          </form>
          <p className="mt-1.5 text-[10px] leading-relaxed text-amber-800/80">
            ถ้าห้องนี้เปิด AI Auto — AI จะตอบทันที และถ้าเป็นการจอง จะสร้างคิวจองเข้าศูนย์บริการให้ด้วย
          </p>
        </details>
      </div>
    </section>
  );
}
