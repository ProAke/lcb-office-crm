#!/usr/bin/env node
// Read-only comparison against columns referenced by the legacy PHP Cockpit.
// Does not print connection strings, query rows, customer information or raw errors.
import mysql from 'mysql2/promise';
import { pathToFileURL } from 'node:url';

export const expected = Object.freeze({
  tb_member: ['id', 'name', 'lastname', 'phone', 'line_user_id'],
  tb_booking: ['id', 'line_user_id', 'appointment_date', 'appointment_time', 'status', 'technician_id', 'car_plate', 'service_type'],
  tb_admin_user: ['ID', 'USERNAME', 'PASSWORD', 'STATUS', 'LEVEL', 'FULLNAME'],
  tb_promotion: ['status'],
});

export function compareSchema(rows) {
  const found = new Map();
  for (const row of rows) {
    if (!Object.hasOwn(expected, row.table_name) || typeof row.column_name !== 'string') continue;
    const cols = found.get(row.table_name) ?? new Set();
    cols.add(row.column_name); found.set(row.table_name, cols);
  }
  return Object.entries(expected).map(([table, required]) => ({
    table, present: found.has(table), missing: required.filter(column => !found.get(table)?.has(column)),
  }));
}

export async function auditSchema(connection) {
  const names = Object.keys(expected);
  const placeholders = names.map(() => '?').join(', ');
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${placeholders})`,
    names,
  );
  return compareSchema(rows);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('ไม่ได้ตั้ง DATABASE_URL; ไม่ได้เชื่อมต่อฐานข้อมูล'); process.exitCode = 2; return; }
  let parsed;
  try { parsed = new URL(url); } catch { /* sanitized below */ }
  if (!parsed || parsed.protocol !== 'mysql:' || !parsed.hostname || parsed.pathname === '/' || !parsed.pathname) {
    console.error('DATABASE_URL ไม่ถูกต้อง ต้องระบุ MySQL และชื่อฐานข้อมูล'); process.exitCode = 2; return;
  }
  let connection;
  try {
    connection = await mysql.createConnection(url);
    const result = await auditSchema(connection);
    for (const row of result) {
      console.log(!row.present ? `${row.table}: ไม่พบตารางหรือไม่มีสิทธิ์ดู` : row.missing.length ? `${row.table}: ไม่พบคอลัมน์ ${row.missing.join(', ')}` : `${row.table}: พบคอลัมน์ที่ตรวจครบ`);
    }
    if (result.some(row => !row.present || row.missing.length)) process.exitCode = 1;
    console.log('ตรวจเฉพาะชื่อคอลัมน์ที่ PHP Cockpit ใช้ ไม่รับรองชนิดข้อมูล สิทธิ์ ความปลอดภัย หรือความพร้อมใช้งานจริง');
  } catch {
    console.error('ตรวจ schema ไม่สำเร็จ: ตรวจเครือข่าย สิทธิ์อ่าน metadata และการตั้งค่าฐานข้อมูลบนเซิร์ฟเวอร์');
    process.exitCode = 2;
  } finally { if (connection) await connection.end().catch(() => {}); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
