"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          อีเมล / ชื่อผู้ใช้
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          defaultValue="admin"
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
          defaultValue="admin"
          placeholder="••••••••"
          className="input"
          required
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>

      <p className="text-center text-xs text-muted">
        เดโม: <span className="font-medium text-ink">admin / admin</span>
      </p>
    </form>
  );
}
