import mysql from "mysql2";

/** A connectivity probe only. It neither inspects nor changes the schema or data. */
export async function checkDatabaseConnection(
  url: string | undefined,
  probe: (url: string) => Promise<void> = probeDatabase,
): Promise<string> {
  if (!url?.trim()) return "ยังไม่ได้ตั้งค่า DATABASE_URL บนเซิร์ฟเวอร์ · ให้ผู้ดูแลตั้งค่าผ่านช่องทางปลอดภัย";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "mysql:" || !parsed.hostname || !parsed.pathname || parsed.pathname === "/") throw new Error("invalid");
  } catch {
    return "รูปแบบ DATABASE_URL ไม่ถูกต้อง · ตรวจชนิด mysql และชื่อฐานข้อมูล โดยไม่ส่งรหัสผ่านผ่านแชท";
  }
  try {
    await probe(url);
    return "MySQL ตอบรับการทดสอบ SELECT 1 · ยังไม่ยืนยัน schema หรือการเชื่อมข้อมูล CRM และบัญชีผู้ใช้";
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "ER_ACCESS_DENIED_ERROR") return "MySQL ปฏิเสธบัญชี · ตรวจสิทธิ์และข้อมูลเข้าสู่ระบบบนเซิร์ฟเวอร์";
    if (code === "ER_BAD_DB_ERROR") return "ไม่พบฐานข้อมูลที่ระบุ · ตรวจชื่อฐานข้อมูลเดิมก่อนดำเนินการ";
    return "ทดสอบ MySQL ไม่สำเร็จหรือหมดเวลา · ตรวจเครือข่ายและการตั้งค่าบนเซิร์ฟเวอร์";
  }
}

function probeDatabase(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(url);
    let finished = false;
    const finish = (error?: Error | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      connection.destroy();
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(new Error("timeout")), 8000);
    connection.query("SELECT 1", (error) => finish(error));
  });
}
