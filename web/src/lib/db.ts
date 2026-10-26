import mysql, {
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

/**
 * ชั้นเชื่อมต่อ MySQL "ชุดเดิม" ของระบบ PHP
 * ------------------------------------------------------------------
 * ใช้ mysql2/promise (แทน mysqli/PDO เดิม) — ค่าเริ่มต้นเป็น
 * parameterized query ทุกครั้ง จึงกัน SQL injection ได้ในตัว
 * (ต่างจากสตริงต่อกันแบบ "SELECT … WHERE id = $id" ในโค้ด PHP เก่า)
 *
 * ตอนนี้ยังไม่ตั้ง DATABASE_URL จึงยังไม่มีการเชื่อมต่อเกิดขึ้นจริง
 * เมื่อได้ข้อมูลจริงแล้ว ใส่ใน .env แล้วเรียก query() ได้เลย
 */

const globalForDb = globalThis as unknown as { pool?: Pool };

export function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า DATABASE_URL — คัดลอก .env.example เป็น .env แล้วใส่ข้อมูล MySQL เดิม",
    );
  }

  const pool = mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    // ต้องเป็น utf8mb4 เพื่อให้ชื่อไทย/อีโมจิไม่เพี้ยน (utf8 ของ MySQL เก่าเก็บได้แค่ 3 ไบต์)
    charset: "utf8mb4",
    // ให้เวลาใน DB ตรงกับ PHP เดิม (ระบบเดิมมักตั้ง Asia/Bangkok)
    timezone: process.env.DB_TIMEZONE ?? "Z",
  });

  globalForDb.pool = pool;
  return pool;
}

type Param = string | number | boolean | Date | null;

/** SELECT หลายแถว */
export async function query<T extends RowDataPacket>(
  sql: string,
  params: Param[] = [],
): Promise<T[]> {
  const [rows] = await getPool().query<T[]>(sql, params);
  return rows;
}

/** SELECT แถวเดียว (คืน null ถ้าไม่พบ) */
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: Param[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE */
export async function execute(sql: string, params: Param[] = []) {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}
