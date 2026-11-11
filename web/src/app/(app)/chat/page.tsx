import type { Metadata } from "next";
import Link from "next/link";
import { getConversation, listConversations } from "@/lib/crm/repo";
import { CHANNEL_LABEL, thTime } from "@/lib/format";
import ChatPanel from "./ChatPanel";

export const metadata: Metadata = { title: "AI ตอบแชท" };
export const dynamic = "force-dynamic";

const CHANNEL_BADGE: Record<string, { icon: string; cls: string }> = {
  line: { icon: "LINE", cls: "bg-emerald-500 text-white" },
  facebook: { icon: "FB", cls: "bg-blue-600 text-white" },
  web: { icon: "WEB", cls: "bg-slate-600 text-white" },
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const conversations = listConversations();
  const selected = getConversation(Number(id ?? conversations[0]?.id ?? 0)) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI ตอบแชทลูกค้า</h1>
          <p className="mt-1 text-sm text-muted">
            แชทจาก LINE OA / Facebook / เว็บ รวมในจอเดียว — AI ตอบทันที จองคิวให้เอง แจ้งโปรได้เอง
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          🤖 AI พร้อมตอบ 24 ชม.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* รายชื่อห้องแชท */}
        <aside className="card h-fit overflow-hidden">
          <header className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">กล่องข้อความ ({conversations.length})</h2>
          </header>
          <ul className="divide-y divide-line">
            {conversations.map((c) => {
              const ch = CHANNEL_BADGE[c.channel];
              const active = selected?.id === c.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/chat?id=${c.id}`}
                    className={`block px-4 py-3 transition hover:bg-surface/70 ${active ? "bg-brand-500/5 ring-2 ring-inset ring-brand-500/40" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold ${ch.cls}`}>
                        {ch.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.displayName}</p>
                        <p className="truncate text-xs text-muted">
                          {c.messages.at(-1)?.text ?? ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {c.unread > 0 && (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{c.unread}</span>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted">{thTime(c.lastMessageAt)}</p>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 pl-10 text-[10px]">
                      <span className="text-muted">{CHANNEL_LABEL[c.channel]}</span>
                      {c.aiAuto && <span className="rounded bg-violet-50 px-1 py-px font-medium text-violet-600 ring-1 ring-violet-200">🤖 AI Auto</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ห้องแชท */}
        {selected ? (
          <ChatPanel conversation={selected} />
        ) : (
          <div className="card grid place-items-center p-10 text-sm text-muted">เลือกห้องแชททางซ้าย</div>
        )}
      </div>
    </div>
  );
}
