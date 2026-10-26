#!/usr/bin/env node
/**
 * ตัวช่วยตรวจซอร์สโค้ด PHP เดิม (ของระบบ office.laemchabanginterautotire.com)
 * ---------------------------------------------------------------------------
 * ใช้: node tools/inspect-php-source.mjs <โฟลเดอร์ซอร์ส> [--out docs/php-source-report.md]
 *
 * สคริปต์จะ "อ่านอย่างเดียว" ไม่แก้ไฟล์ใด ๆ และไม่พิมพ์ค่า credential ออกมา
 * (ตรวจพบแล้วรายงานแค่ว่าอยู่ไฟล์ไหน บรรทัดไหน)
 *
 * ผลลัพธ์คือรายงาน Markdown ที่บอก:
 *   - โครงสร้างไฟล์/โฟลเดอร์ และ entry point ทั้งหมด
 *   - ตาราง/คอลัมน์ที่ถูกอ้างถึงใน SQL (เพื่อใช้ทำ mapping กับ Next.js)
 *   - จุดที่ใช้ $_SESSION / ตรวจสิทธิ์ / include header-footer
 *   - วิธีแฮชรหัสผ่าน, การอัปโหลดไฟล์, อีเมล, PDF/Excel, LINE API, cron
 *   - ฟอร์มและ action ที่ต้องแปลงเป็น Server Action / Route Handler
 *   - ไฟล์ที่มี credential ฝังอยู่ (ต้องย้ายไป .env)
 */

import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "vendor",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "__pycache__",
]);

const TEXT_EXT = new Set([
  ".php",
  ".phtml",
  ".inc",
  ".html",
  ".htm",
  ".js",
  ".css",
  ".sql",
  ".json",
  ".ini",
  ".conf",
  ".htaccess",
  ".env",
  ".txt",
  ".md",
  ".xml",
]);

const args = process.argv.slice(2);
const rootArg = args.find((a) => !a.startsWith("--"));
const outIdx = args.indexOf("--out");
const outFile = outIdx >= 0 ? args[outIdx + 1] : "docs/php-source-report.md";

if (!rootArg) {
  console.error("ใช้: node tools/inspect-php-source.mjs <โฟลเดอร์ซอร์ส> [--out ไฟล์.md]");
  process.exit(1);
}

const ROOT = path.resolve(rootArg);

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      await walk(full, acc);
    } else if (e.isFile()) {
      acc.push(full);
    }
  }
  return acc;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const isText = (p) =>
  TEXT_EXT.has(path.extname(p).toLowerCase()) ||
  path.basename(p).startsWith(".htaccess");

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

function uniq(arr) {
  return [...new Set(arr)];
}

const files = await walk(ROOT);
const texts = new Map(); // rel -> content
for (const f of files) {
  if (!isText(f)) continue;
  const s = await stat(f);
  if (s.size > 2_000_000) continue; // ข้ามไฟล์ใหญ่เกิน 2MB
  try {
    texts.set(rel(f), await readFile(f, "utf8"));
  } catch {
    /* binary หรืออ่านไม่ได้ */
  }
}

// ---------------------------------------------------------------- detectors
const DETECTORS = [
  {
    id: "db-connect",
    title: "การเชื่อมต่อฐานข้อมูล",
    why: "ทั้งหมดต้องรวมเป็น pool เดียวใน lib/db.ts (mysql2) ห้ามเปิด connection ใหม่ทุกครั้ง",
    pattern:
      /\b(new\s+PDO|mysqli_connect|new\s+mysqli|mysql_connect|oci_connect|pg_connect|sqlsrv_connect)\s*\(/gi,
  },
  {
    id: "raw-sql",
    title: "SQL ที่ต่อสตริง (เสี่ยง SQL injection)",
    why: "จุดเหล่านี้ต้องเปลี่ยนเป็น parameterized query — คือความเสี่ยงหลักของระบบเดิม",
    // จับ SQL ที่มี $ตัวแปรอยู่ในสตริง (ต่อสตริง/ interpolate) — heuristic หลักของ SQL injection
    pattern:
      /(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)[^\n;]{0,300}?(\$\w+|\{\$)/gi,
  },
  {
    id: "session",
    title: "การใช้ $_SESSION",
    why: "ต้องแปลงเป็น cookie/JWT session และตรวจสิทธิ์ผ่าน middleware + can()",
    pattern: /\$_SESSION\s*\[\s*['"]([^'"]+)['"]\s*\]/g,
    captureKey: true,
  },
  {
    id: "auth-check",
    title: "จุดตรวจสิทธิ์ / กันคนไม่ล็อกอิน",
    why: "ทุกจุดต้องรวมเป็น guarded layout + middleware (ไม่ใช่ if ที่ copy ไปทุกไฟล์)",
    pattern:
      /(isset\s*\(\s*\$_SESSION|!\s*empty\s*\(\s*\$_SESSION|in_array\s*\([^)]*role|role\s*[=!]=\s*['"](?:admin|user|staff|staffs|manager)['"])/gi,
  },
  {
    id: "password",
    title: "วิธีแฮช/ตรวจรหัสผ่าน",
    why: "ต้องรู้ว่าใช้ password_hash (bcrypt) หรือ md5/sha1 เพื่อให้ผู้ใช้เดิมล็อกอินได้",
    pattern: /\b(password_hash|password_verify|md5|crypt|sha1|hash_hmac)\s*\(/gi,
  },
  {
    id: "upload",
    title: "การอัปโหลดไฟล์",
    why: "ต้องย้ายจาก move_uploaded_file ไป object storage หรือ kept-disk บน VPS",
    pattern: /(move_uploaded_file|\$_FILES)\b/g,
  },
  {
    id: "mail",
    title: "การส่งอีเมล",
    why: "ต้องเปลี่ยนเป็น nodemailer/Resend และย้าย SMTP credential ไป .env",
    pattern: /\b(mail\s*\(|PHPMailer|Swift_Mailer|sendmail)\b/g,
  },
  {
    id: "pdf-excel",
    title: "การสร้าง PDF / Excel",
    why: "lib ฝั่ง PHP ใช้บน Node ไม่ได้ ต้องเลือก @react-pdf/Puppeteer และ exceljs",
    pattern: /\b(FPDF|mPDF|TCPDF|PHPExcel|PhpSpreadsheet|SpreadsheetWriter|ExcelWriter)\b/gi,
  },
  {
    id: "line-api",
    title: "การเรียก LINE Messaging API",
    why: "ต้องย้ายไปเรียกฝั่งเซิร์ฟเวอร์เท่านั้น และซ่อน token ใน env",
    pattern: /(api\.line\.me|channel[_ -]?access[_ -]?token|channel[_ -]?secret)/gi,
  },
  {
    id: "ajax-json",
    title: "Endpoint ที่คืน JSON / เรียกด้วย AJAX",
    why: "แปลงเป็น app/api/.../route.ts หรืออ่าน DB ใน Server Component",
    pattern: /(header\s*\(\s*['"]Content-Type:\s*application\/json|json_encode\s*\(\s*\$)/gi,
  },
  {
    id: "redirect",
    title: "การ redirect ด้วย header()",
    why: "แปลงเป็น redirect() ของ Next (ระวัง: redirect() ใน try/catch จะถูกกลืน)",
    pattern: /header\s*\(\s*['"]Location:/gi,
  },
  {
    id: "include",
    title: "การ include ไฟล์กลาง (config/header/footer/session)",
    why: "ไฟล์เหล่านี้คือสิ่งที่ถูกแทนด้วย layout.tsx, middleware.ts และ .env",
    pattern: /\b(include|require)(_once)?\s*[(\s]['"][^'"]+['"]/g,
  },
  {
    id: "csrf",
    title: "การป้องกัน CSRF",
    why: "Server Action ตรวจ Origin ให้ แต่ต้องคง token ไว้สำหรับฟอร์มที่ยังเป็น route handler",
    pattern: /\b(csrf|_token|csrf_token)\b/gi,
  },
  {
    id: "secret",
    title: "credential ที่ฝังในโค้ด",
    why: "ต้องย้ายไป .env ทั้งหมด (รายงานบอกแค่ตำแหน่ง ไม่พิมพ์ค่า)",
    pattern:
      /(db_?(pass|password|pwd)|api_?key|secret|access_?token|channel_?token|smtp_?pass)\s*['"]?\s*[=:]\s*['"][^'"]{3,}['"]/gi,
    redact: true,
  },
];

const matches = new Map(DETECTORS.map((d) => [d.id, []]));
const sessionKeys = new Map();
const tableHits = new Map(); // table -> Set(files)
const formActions = [];
const phpFiles = [...texts.keys()].filter((f) => f.endsWith(".php"));

for (const [file, content] of texts) {
  for (const d of DETECTORS) {
    const re = new RegExp(d.pattern.source, d.pattern.flags);
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[0].length === 0) break;
      matches.get(d.id).push({ file, line: lineOf(content, m.index), text: m[0] });
      if (d.id === "session" && d.captureKey) {
        const key = m[1];
        sessionKeys.set(key, (sessionKeys.get(key) ?? 0) + 1);
      }
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  // ตารางที่อ้างถึงใน SQL
  const tableRe =
    /\b(?:FROM|JOIN|INTO|UPDATE)\s+`?([a-zA-Z_][\w$]{1,60})`?/gi;
  let t;
  while ((t = tableRe.exec(content)) !== null) {
    const name = t[1];
    if (/^(select|where|set|values|dual)$/i.test(name)) continue;
    if (!tableHits.has(name)) tableHits.set(name, new Set());
    tableHits.get(name).add(file);
  }

  // ฟอร์ม <form action="...">
  const formRe = /<form[^>]*action\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let f;
  while ((f = formRe.exec(content)) !== null) {
    formActions.push({ file, action: f[1], line: lineOf(content, f.index) });
  }
}

// ---------------------------------------------------------------- helpers
function groupByEmail(arr) {
  const map = new Map();
  for (const hit of arr) {
    if (!map.has(hit.file)) map.set(hit.file, []);
    map.get(hit.file).push(hit);
  }
  return map;
}

function mdList(items, limit = 60) {
  const shown = items.slice(0, limit).map((s) => `- ${s}`);
  if (items.length > limit) shown.push(`- … และอีก ${items.length - limit} รายการ`);
  return shown.join("\n");
}

function detectorSection(d) {
  const hits = matches.get(d.id);
  if (!hits.length) return null;
  const files = groupByEmail(hits);
  const lines = [...files.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([file, hs]) => {
      const sample = d.redact
        ? "(ตรวจพบ credential — ไม่แสดงค่าในรายงาน)"
        : hs[0].text.replace(/\s+/g, " ").slice(0, 90);
      return `| \`${file}\` | ${hs.length} | ${hs
        .slice(0, 3)
        .map((h) => h.line)
        .join(", ")} | \`${sample.replace(/\|/g, "\\|")}\` |`;
    });

  return `### ${d.title}

**ทำไมต้องสนใจ:** ${d.why}

| ไฟล์ | จำนวน | บรรทัด | ตัวอย่าง |
| --- | --- | --- | --- |
${lines.join("\n")}
`;
}

// ---------------------------------------------------------------- report
const extCount = {};
for (const f of files) {
  const ext = path.extname(f).toLowerCase() || "(ไม่มี)";
  extCount[ext] = (extCount[ext] ?? 0) + 1;
}

const folders = {};
for (const f of files) {
  const top = rel(f).split("/").slice(0, 2).join("/");
  folders[top] = (folders[top] ?? 0) + 1;
}

const entryPoints = phpFiles.filter((f) =>
  /(^|\/)(index|login|logout|save|update|delete|insert|process|ajax|api|export|print|report|cron)[^/]*\.php$/i.test(
    f,
  ),
);

const composer = texts.get("composer.json");
const htaccess = [...texts.entries()].filter(([f]) => f.endsWith(".htaccess"));

const pkgLibs = [];
if (composer) {
  try {
    const j = JSON.parse(composer);
    pkgLibs.push(...Object.keys(j.require ?? {}));
    pkgLibs.push(...Object.keys(j["require-dev"] ?? {}));
  } catch {
    /* composer.json เพี้ยน */
  }
}

const tables = [...tableHits.entries()]
  .sort((a, b) => b[1].size - a[1].size)
  .map(([name, set]) => `| \`${name}\` | ${set.size} | ${[...set].slice(0, 4).join(", ")} |`);

const report = `# รายงานตรวจซอร์ส PHP — ระบบเดิม

> สร้างอัตโนมัติด้วย \`tools/inspect-php-source.mjs\`
> โฟลเดอร์ที่ตรวจ: \`${path.basename(ROOT)}\` · ไฟล์ทั้งหมด ${files.length} · ไฟล์ PHP ${phpFiles.length}

## 1. ภาพรวมไฟล์

| นามสกุล | จำนวน |
| --- | --- |
${Object.entries(extCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([e, c]) => `| ${e} | ${c} |`)
  .join("\n")}

**โฟลเดอร์หลัก (2 ระดับแรก)**

${mdList(
  Object.entries(folders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([d, c]) => `\`${d}\` — ${c} ไฟล์`),
)}

${pkgLibs.length ? `**ไลบรารีที่ติดตั้งผ่าน Composer**\n\n${mdList(pkgLibs.map((l) => `\`${l}\``))}\n` : "**ไม่พบ composer.json** — น่าจะเป็นโปรเจกต์ที่ใช้ไลบรารีแบบ copy ไฟล์ลงโฟลเดอร์เอง (ต้องดูใน `vendor`/`lib`/`assets`)"}

## 2. Entry point ที่ต้องแปลงเป็น route (${entryPoints.length} ไฟล์)

${mdList(entryPoints.map((f) => `\`${f}\``), 120)}

## 3. ตารางฐานข้อมูลที่โค้ดอ้างถึง (${tableHits.size} ตาราง)

> ใช้ตรวจกับ \`SHOW TABLES\` ของฐานข้อมูลจริง และใช้ตั้งชื่อ model/type ใน Next.js

| ตาราง | จำนวนไฟล์ที่อ้าง | ไฟล์ตัวอย่าง |
| --- | --- | --- |
${tables.slice(0, 120).join("\n")}

## 4. ฟอร์มที่ยิงไปยังไฟล์ PHP (${formActions.length} จุด)

> แต่ละจุดจะกลายเป็น Server Action หรือ route handler

${mdList(
  formActions
    .slice(0, 120)
    .map((f) => `\`${f.file}:${f.line}\` → \`${f.action}\``),
)}

## 5. คีย์ของ $_SESSION ที่ใช้อยู่ (${sessionKeys.size} คีย์)

${mdList(
  [...sessionKeys.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => `\`${k}\` — ใช้ ${c} ครั้ง`),
)}

## 6. ผลตรวจตามหมวด

${DETECTORS.map(detectorSection).filter(Boolean).join("\n")}

## 7. .htaccess / rewrite rule

${htaccess.length ? mdList(htaccess.map(([f]) => `\`${f}\``)) : "ไม่พบไฟล์ .htaccess (อาจถูกซ่อนจาก zip หรือใช้ Nginx config แทน)"}

## 8. ขั้นต่อไป (ยืนยันกับฐานข้อมูลจริง)

1. \`SHOW TABLES;\` + \`SHOW CREATE TABLE\` ของทุกตาราง → ยืนยันรายชื่อตารางในข้อ 3
2. เลือกตารางผู้ใช้ และตรวจว่าคอลัมน์รหัสผ่านใช้แฮชแบบใด (ข้อ 6 "วิธีแฮช/ตรวจรหัสผ่าน")
3. เปิดใช้ \`findUserByEmail()\` ใน \`web/src/lib/auth.ts\` ให้ query ตารางจริง
4. แปลง entry point ในข้อ 2 เป็น route ทีละไฟล์ โดยเริ่มจาก authentication → dashboard
5. ย้าย credential ที่พบ (ข้อ 6 "credential ที่ฝังในโค้ด") ไป \`.env\` และ rotate รหัสทั้งหมด
`;

await mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
await writeFile(path.resolve(outFile), report, "utf8");
console.log(`✓ เขียนรายงาน: ${outFile}`);
console.log(
  `  ไฟล์ ${files.length} · PHP ${phpFiles.length} · ตาราง ${tableHits.size} · entry point ${entryPoints.length}`,
);
