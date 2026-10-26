import bcrypt from "bcryptjs";
import type { SessionUser } from "./session";

/**
 * ชั้นตรวจสอบผู้ใช้
 * ------------------------------------------------------------------
 * ตอนนี้ใช้ "mock user" เพื่อให้เดโมรันได้โดยไม่ต้องต่อ MySQL
 * เมื่อได้โครงสร้างฐานข้อมูลจริงแล้ว ให้เปลี่ยน findUserByEmail()
 * ให้ query ตาราง users เดิม (ดูตัวอย่างที่คอมเมนต์ไว้ด้านล่าง) — ส่วนที่เหลือ
 * ของแอปไม่ต้องแก้เลย เพราะทุกอย่างเรียกผ่านฟังก์ชันนี้เท่านั้น
 */

type UserRecord = SessionUser & { passwordHash: string; active: boolean };

// admin / admin  (ตามที่แจ้งมา) — hash นี้เป็น bcrypt cost 10
const MOCK_USERS: UserRecord[] = [
  {
    id: 1,
    name: "Administrator",
    email: "admin",
    role: "admin",
    active: true,
    passwordHash:
      "$2b$10$cVFL0NMwaQwtaW.SUFgQG.y.HWOsclHsQD3PnRv0BqV6ONLZeYsK6",
  },
];

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  // ---- เวอร์ชันจริง (เปิดใช้เมื่อมี DATABASE_URL แล้ว) -------------------
  // import { queryOne } from "./db";
  //
  // const row = await queryOne<{
  //   id: number;
  //   name: string;
  //   email: string;
  //   role: SessionUser["role"];
  //   active: number;
  //   password_hash: string;
  // }>(
  //   // ตรวจชื่อตาราง/คอลัมน์กับฐานข้อมูลจริงก่อน (users? employee? tb_user?)
  //   "SELECT id, name, email, role, active, password_hash FROM users WHERE email = ? LIMIT 1",
  //   [email.trim().toLowerCase()],
  // );
  // if (!row) return null;
  // return {
  //   id: row.id,
  //   name: row.name,
  //   email: row.email,
  //   role: row.role,
  //   active: Boolean(row.active),
  //   passwordHash: row.password_hash,
  // };
  // --------------------------------------------------------------------
  const key = email.trim().toLowerCase();
  return (
    MOCK_USERS.find(
      (u) => u.email.toLowerCase() === key || u.name.toLowerCase() === key,
    ) ?? null
  );
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; message: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  if (!email || !password) {
    return { ok: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const user = await findUserByEmail(email);
  // ข้อความ error แบบเดียวกันทั้งกรณีไม่มีผู้ใช้/รหัสผิด (กัน enumeration)
  if (!user) {
    return { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }
  if (!user.active) {
    return { ok: false, message: "บัญชีนี้ถูกระงับการใช้งาน" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  // ตัดฟิลด์ที่ไม่ควรอยู่ใน session ออก
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return { ok: true, user: sessionUser };
}
