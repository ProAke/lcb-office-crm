"use client";
export function reportIncident(type: "ui_error" | "login_blocked" | "login_server_error" | "login_network_error", status?: number) {
  // Best effort only; do not report secrets, URLs, messages, or stack traces.
  void fetch("/api/diagnostics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...(status === undefined ? {} : { status }) }), keepalive: true }).catch(() => {});
}
