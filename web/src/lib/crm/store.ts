import fs from "node:fs";
import path from "node:path";
import { SEED } from "./seed";
import type { StoreShape } from "./types";

/**
 * ชั้นเก็บข้อมูล (Data Store)
 * -------------------------------------------------------------------------
 * ตอนนี้: ไฟล์ JSON ใน web/data/store.json (เดโม ใช้งานได้ทันที ไม่ต้องมี MySQL)
 * เป้าหมาย: เมื่อมี DATABASE_URL → สลับ repo.ts ให้อ่าน/เขียนตาราง MySQL เดิม
 *           โดยไฟล์นี้เป็นชั้นเดียวที่แตะ storage จริง ๆ
 *
 * หมายเหตุ deploy จริง:
 *  - บน VPS เดิม (โฮสต์ PHP เดิม) ใช้ไฟล์ต่อชั่วคราวได้ แล้วค่อยย้ายเข้า MySQL
 *  - บน Vercel (ไม่มีดิสก์ถาวร) ต้องใช้ DATABASE_URL เท่านั้น
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

declare global {
  var __lcbStore: StoreShape | undefined;
  var __lcbStoreLoadedAt: number | undefined;
}

function load(): StoreShape {
  // แคชในหน่วยความจำเพื่อลดการอ่านไฟล์ (รวมถึงกัน hot-reload เสีย state)
  if (globalThis.__lcbStore) return globalThis.__lcbStore;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as StoreShape;
      globalThis.__lcbStore = parsed;
      return parsed;
    }
  } catch {
    // ไฟล์เสีย → สร้างใหม่จาก seed
  }

  const fresh = structuredClone(SEED);
  globalThis.__lcbStore = fresh;
  persist(fresh);
  return fresh;
}

function persist(store: StoreShape) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // สภาพแวดล้อมที่เขียนไฟล์ไม่ได้ (เช่น serverless read-only) — ข้ามไปก่อน
  }
}

/** อ่านข้อมูลทั้งชุด (อย่าแก้ตรง ๆ — ใช้ repo ฟังก์ชัน) */
export function readStore(): StoreShape {
  return load();
}

/** เขียนกลับทั้งชุด */
export function writeStore(store: StoreShape) {
  globalThis.__lcbStore = store;
  persist(store);
}

/** ออก running id ของคอลเลกชัน */
export function nextId(store: StoreShape, collection: keyof StoreShape["counters"]): number {
  const n = (store.counters[collection] ?? 0) + 1;
  store.counters[collection] = n;
  return n;
}
