import { NextResponse } from "next/server";
import { recordIncident } from "@/lib/diagnostics";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const origin = request.headers.get("origin"), host = request.headers.get("host");
  try { if (!origin || !host || new URL(origin).host !== host) return new NextResponse(null, { status: 403 }); }
  catch { return new NextResponse(null, { status: 403 }); }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return new NextResponse(null, { status: 415 });
  // Stream with an actual byte limit even if Content-Length is absent or false.
  const reader = request.body?.getReader(); if (!reader) return new NextResponse(null, { status: 400 });
  let length = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 512) { await reader.cancel(); return new NextResponse(null, { status: 413 }); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(k => !["type", "status"].includes(k))) return new NextResponse(null, { status: 400 });
    const event = recordIncident(data.type, data.status);
    return new NextResponse(null, { status: event ? 204 : 400, headers: { "Cache-Control": "no-store" } });
  } catch { return new NextResponse(null, { status: 400 }); }
}
