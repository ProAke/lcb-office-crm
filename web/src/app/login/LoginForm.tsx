"use client";

import { useState } from "react";
import { loginResponse } from "@/lib/login-response";
import { reportIncident } from "@/lib/report-incident";

export default function LoginForm({ demo }: { demo: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError(""); setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await loginResponse(response);
      if (!result.ok) {
        if (response.status === 403) reportIncident("login_blocked", 403);
        else if (response.status === 429 || response.status >= 500 || response.ok) reportIncident("login_server_error", [429, 500, 502, 503, 504].includes(response.status) ? response.status : undefined);
        setError(result.error ?? "ไม่สามารถเข้าสู่ระบบได้"); return;
      }
      window.location.assign("/dashboard");
    } catch { reportIncident("login_network_error"); setError("เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"); }
    finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} method="post" action="/api/auth/login" className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          อีเมล / ชื่อผู้ใช้
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          defaultValue={demo ? "admin" : ""}
          placeholder="name@company.co.th"
          className="input"
          required
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            รหัสผ่าน
          </label>
          <a
            href="#"
            className="text-xs text-brand-600 hover:underline"
            aria-disabled
          >
            ลืมรหัสผ่าน?
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue={demo ? "admin" : ""}
          placeholder="••••••••"
          className="input"
          required
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>

      {demo && <p className="text-center text-xs text-muted">
        เดโม: <span className="font-medium text-ink">admin / admin</span>
      </p>}
    </form>
  );
}
