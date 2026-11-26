import { randomUUID } from "node:crypto";

export const INCIDENT_TYPES = ["ui_error", "login_blocked", "login_server_error", "login_network_error"] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type Incident = { id: string; at: string; type: IncidentType; status: number | null };
const ALLOWED_STATUS = new Set([403, 429, 500, 502, 503, 504]);
declare global {
  var __lcbIncidents: Incident[] | undefined;
  var __lcbIncidentRate: { start: number; count: number } | undefined;
}
export function recordIncident(type: unknown, status: unknown): Incident | null {
  if (typeof type !== "string" || !INCIDENT_TYPES.includes(type as IncidentType)) return null;
  if (status !== undefined && status !== null && (typeof status !== "number" || !ALLOWED_STATUS.has(status))) return null;
  const now = Date.now();
  const rate = globalThis.__lcbIncidentRate;
  if (!rate || now - rate.start >= 60_000) globalThis.__lcbIncidentRate = { start: now, count: 0 };
  if (++globalThis.__lcbIncidentRate!.count > 60) return null;
  const item: Incident = { id: randomUUID(), at: new Date(now).toISOString(), type: type as IncidentType, status: (status as number | null | undefined) ?? null };
  const items = globalThis.__lcbIncidents ??= [];
  items.unshift(item); if (items.length > 50) items.length = 50;
  // Deliberately omit URLs, messages, stack traces, user data and request bodies.
  console.error("[lcb-incident]", JSON.stringify(item));
  return item;
}
export function listIncidents(): Incident[] { return [...(globalThis.__lcbIncidents ?? [])]; }
