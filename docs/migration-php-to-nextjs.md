# ย้ายระบบ `office.laemchabanginterautotire.com` จาก PHP → Next.js

> เอกสารนี้ตอบคำถาม: **"หลังบ้าน PHP เดิมเป็นอย่างไร และถ้าเป็น Next.js ต้องแก้อะไรบ้าง"**
> โดยยึดหลักว่า **ฐานข้อมูล MySQL เดิมไม่เปลี่ยน** (ไม่ย้ายข้อมูล ไม่แก้ชื่อตาราง)
> เพื่อให้ข้อมูลเก่าและระบบอื่นที่อ่านฐานเดียวกันทำงานต่อได้

อัปเดต: 2026-10-26

---

## 0. ขอบเขตการตรวจ (อ่านก่อน)

สิ่งที่ทำได้จากสภาพแวดล้อมนี้:

- เปิดหน้าเว็บสาธารณะได้: `/` (redirect ไป `/authentication/index.php`), หน้า login, หน้า 404
- เห็นชื่อระบบ โลโก้ และเมนูที่แสดงบนหน้า login

สิ่งที่ทำ **ไม่ได้** จากสภาพแวดล้อมนี้:

- เข้า FTP / SSH / cPanel ของโฮสต์เดิม
- ล็อกอินเข้าไปดูหน้าจอหลังบ้านจริง (ต้องใช้บัญชีจริง แต่ผมไม่ควรและไม่จำเป็นต้องใช้)
- เปิดอ่านไฟล์ PHP หรือต่อ MySQL เดิมโดยตรง

ดังนั้นข้อสรุปเรื่อง "โครงสร้างไฟล์" ด้านล่างมาจาก **สิ่งที่ตรวจได้ + รูปแบบมาตรฐาน**
ของระบบ PHP ที่ใช้เทมเพลต AdminLTE ซึ่งจะยืนยันซ้ำอีกครั้งเมื่อได้รับซอร์สโค้ดจริง
(ไม่ได้เดาเป็นข้อเท็จจริง — ส่วนที่ต้องยืนยันผมเขียนกำกับไว้)

---

## 1. สิ่งที่ตรวจได้จากระบบเดิม ณ วันนี้

| สิ่งที่พบ | หมายความว่า |
| --- | --- |
| `/` → `/authentication/index.php` | แยกโฟลเดอร์ตามโมดูล แต่ละโมดูลมี `index.php` เป็นตัวหลัก |
| `/authentication/reset-password.php` | มีระบบลืม/รีเซ็ตรหัสผ่าน (ต้องย้ายหรือต่อกับ SMTP เดิม) |
| ทรัพยากรอยู่ใต้ `/dist/img/...` | ใช้เทมเพลตแบบ AdminLTE (Bootstrap + jQuery + DataTables) |
| title = "Laem Chabang Inter Autotire Office" | ระบบสำนักงานภายใน ไม่ใช่เว็บขาย |
| หน้า 404 เป็นเทมเพลตของตัวเอง | มี error handler / custom 404 (ไม่ได้เปิด `display_errors`) |
| เมนู "LINE Rich Menu Management" | เชื่อม LINE Messaging API และมีตารางเก็บ rich menu |
| ฟอร์ม login เป็น POST ธรรมดา (ไม่มี JS framework) | ไม่ใช่ SPA — ย้ายมา Next.js ได้แบบค่อยเป็นค่อยไป |

**ยังไม่รู้ (ต้องดูซอร์ส):** ชื่อตาราง/คอลัมน์จริง, วิธีแฮชรหัสผ่าน (`password_hash` /
`md5` / `sha1`), ฟิลด์สิทธิ์ผู้ใช้, ที่เก็บไฟล์อัปโหลด, ไลบรารี PDF/Excel, cron ที่รันอยู่

---

## 2. แผนที่ไฟล์: PHP → Next.js

| ของเดิม (คาดว่าเป็นแบบนี้) | บทบาท | ของใหม่ |
| --- | --- | --- |
| `includes/config.php` | ค่า DB host/user/pass | `.env` + `web/src/lib/db.ts` |
| `includes/db.php` (PDO/mysqli) | connection | `mysql2/promise` pool |
| `includes/session-check.php` | กันคนไม่ล็อกอิน | `web/src/middleware.ts` + guard ใน `(app)/layout.tsx` |
| `authentication/index.php` | ฟอร์ม login | `app/login/page.tsx` |
| `authentication/login-process.php` | ตรวจรหัส, set session | Server Action `loginAction()` (ไม่มี URL ให้ยิงตรง) |
| `authentication/reset-password.php` | รีเซ็ตรหัส | `app/reset-password/page.tsx` (ยังไม่ทำในโครงนี้) |
| `logout.php` | `session_destroy()` | `logoutAction()` + `redirect('/login')` |
| `includes/header.php`, `footer.php` | เลย์เอาต์ | `app/(app)/layout.tsx` |
| `dashboard/index.php` | หน้าแรก | `app/(app)/dashboard/page.tsx` |
| `module/index.php?action=edit&id=5` | GET param + include switch | `app/(app)/module/[id]/edit/page.tsx` |
| `module/save.php` (POST) | บันทึกแล้ว redirect | Server Action + `revalidatePath()` + `redirect()` |
| `api/ajax-list.php` (JSON) | DataTables ดึงข้อมูล | Server Component อ่าน DB ตรง หรือ `app/api/…/route.ts` |
| `upload.php` (`move_uploaded_file`) | เก็บไฟล์ใน `public_html` | Route Handler + S3/R2 หรือดิสก์บน VPS |
| `cron/line-sync.php` | เรียกด้วย cron | `app/api/cron/line-sync/route.ts` + secret header |
| `.htaccess` (rewrite/deny) | คุม URL และสิทธิ์ไฟล์ | `next.config.ts` (headers/rewrites) + middleware |

หลักคิด: 1 ไฟล์ PHP ที่รวม "ตรวจสิทธิ์ + query + HTML" ถูกแยกเป็น 3 ชั้น
คือ **route (page.tsx) → ลอจิก (actions.ts / lib) → UI component**

---

## 3. โค้ดเทียบกันจริง

### ก. ล็อกอิน + session

```php
// เดิม: authentication/login-process.php
session_start();
$row = $pdo->query("SELECT * FROM users WHERE email = '$email'")->fetch();
if ($row && password_verify($pass, $row['password'])) {
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['role']    = $row['role'];
    header('Location: ../dashboard/index.php');
}
```

```ts
// ใหม่: web/src/app/login/actions.ts
"use server";
export async function loginAction(_prev: LoginState, formData: FormData) {
  const result = await login(String(formData.get("email")), String(formData.get("password")));
  if (!result.ok) return { error: result.message };
  await createSession(result.user);   // เซ็น JWT ใส่ httpOnly cookie
  redirect("/dashboard");
}
```

### ข. ดึงข้อมูลมาแสดง

```php
// เดิม
$sql = "SELECT * FROM customers WHERE name LIKE '%$q%' ORDER BY id DESC LIMIT 20";
foreach ($pdo->query($sql) as $r) { echo "<tr><td>{$r['name']}</td></tr>"; }
```

```tsx
// ใหม่: Server Component (query ฝั่งเซิร์ฟเวอร์ ไม่ส่ง SQL ไปที่ browser)
const rows = await query<RowDataPacket>(
  "SELECT id, name FROM customers WHERE name LIKE ? ORDER BY id DESC LIMIT 20",
  [`%${q}%`],
);
return <Table rows={rows} />;
```

### ค. ฟอร์มบันทึก + CSRF

```php
// เดิม: ต้องมี token กัน CSRF เองทุกฟอร์ม
if ($_POST['token'] !== $_SESSION['csrf']) die('CSRF');
```

```tsx
// ใหม่: ยิง Server Action — Next ตรวจ Origin/Host ให้ และไม่มี endpoint POST เปิดโล่ง
<form action={updateCustomer}><input name="name" /></form>
```

---

## 4. ฐานข้อมูลเดิม: อะไรต้องทำ / ไม่ต้องทำ

**ไม่ต้องทำ**

- ไม่ต้องย้ายหรือ import ข้อมูลใหม่
- ไม่ต้องเปลี่ยนชื่อตาราง/คอลัมน์
- ไม่ต้องปิดระบบ PHP เดิมทันที

**ต้องทำ**

1. ตรวจว่า charset เป็น `utf8mb4` (ถ้าเป็น `utf8` แบบ 3 ไบต์ ชื่อไทย/อีโมจิจะเพี้ยน)
2. ตรวจ timezone ของ MySQL vs PHP (`date_default_timezone_set('Asia/Bangkok')`)
3. ตรวจวิธีแฮชรหัสผ่านเดิม เพื่อให้ผู้ใช้ล็อกอินด้วยรหัสเดิมได้
   - `password_hash()` = bcrypt `$2y$…` → `bcryptjs` ตรวจได้เลย (ทดสอบแล้วในโปรเจกต์นี้)
   - ถ้าเป็น `md5`/`sha1` → ต้องรองรับแบบชั่วคราว แล้วบังคับตั้งรหัสใหม่ตอนล็อกอินครั้งถัดไป
4. ถ้าจะเพิ่มตารางใหม่ (audit log, session, job queue) ให้ใช้ prefix ใหม่ ไม่ทับของเดิม
5. ให้สิทธิ์ DB user ของ Next.js แบบจำเป็นจริง (อ่านก่อน, เขียนเฉพาะตารางที่ย้ายแล้ว)

ในช่วงเปลี่ยนผ่าน PHP และ Next.js ชี้ฐานเดียวกันได้ แต่ต้องระวัง
**อย่าให้สองระบบเขียนตารางเดียวกันด้วยตรรกะที่ต่างกัน** — ย้ายทีละโมดูลและปิด
การเขียนของฝั่งเก่าในโมดูลนั้น (เช่น ซ่อนเมนู/read-only)

---

## 5. เช็กลิสต์ 10 ข้อ: "ต้องแก้อะไรบ้าง"

1. **ระบบล็อกอิน & session** — `$_SESSION` ใช้ร่วมกับ Node ไม่ได้ → signed cookie (JWT)
   หรือ Auth.js; ต้องรองรับ hash เดิมและมี `AUTH_SECRET`
2. **สิทธิ์ผู้ใช้ (role/permission)** — รวม `if($_SESSION['role']=='admin')` ที่กระจายอยู่
   หลายสิบไฟล์ให้เป็นฟังก์ชัน `can(user, action)` จุดเดียว แล้วใช้ทั้ง middleware + UI
3. **SQL ทั้งหมด** — เปลี่ยนเป็น parameterized query (`mysql2`/Prisma/Drizzle)
   จุดที่เคยต่อสตริง `"WHERE id = $id"` คือช่องโหว่ SQL injection ของเดิม
4. **ฟอร์ม & AJAX** — POST ที่ยิง .php → Server Actions / route handler;
   DataTables + jQuery → ตารางฝั่งเซิร์ฟเวอร์ (searchParams) หรือ TanStack Table
5. **อัปโหลดไฟล์/รูปสินค้า** — ของเดิมอยู่ใน `public_html` ซึ่ง Vercel ไม่มีดิสก์ถาวร
   → S3/R2 หรือเก็บไว้บน VPS เดิมแล้วเสิร์ฟผ่าน Nginx
6. **รายงาน PDF / Excel** — FPDF/mPDF/PHPExcel ใช้บน Node ไม่ได้ → `@react-pdf` หรือ
   Puppeteer (PDF), `exceljs` (Excel) และต้องฝังฟอนต์ไทย (Sarabun / Noto Sans Thai)
7. **อีเมล & LINE** — `mail()`/PHPMailer → nodemailer/Resend;
   LINE token ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น (ห้ามฝังใน JS ฝั่ง client)
8. **งานเบื้องหลัง / cron** — เปลี่ยนเป็น Route Handler + cron ของ platform
   และใส่ secret header กันคนนอกยิง
9. **ภาษาไทย & encoding** — ตั้ง `charset: "utf8mb4"` ทั้ง DB และ connection,
   ตรวจว่า response ส่ง `Content-Type: text/html; charset=utf-8`
10. **Deploy & โดเมน** — ต้องมี Node runtime; วาง Nginx เป็น reverse proxy
    เพื่อให้ PHP เดิมกับ Next.js อยู่ด้วยกันระหว่างการย้าย

---

## 6. ทางเลือกการติดตั้ง

### A. VPS / hosting ที่มี Node (แนะนำสำหรับระบบนี้)

- Nginx อยู่หน้า: path ที่ยังไม่ย้าย → PHP เดิม, path ที่ย้ายแล้ว → Next.js
- ย้ายทีละโมดูล ไม่ต้องปิดระบบ
- ไฟล์อัปโหลดเก็บดิสก์เดิมได้, cron ในเครื่องเดิมได้
- รันด้วย Docker + PM2, MySQL อยู่เครื่องเดิม (latency ต่ำ)

### B. Vercel (Managed)

- เร็ว ไม่ต้องดูแลเซิร์ฟเวอร์
- แต่ต้องเปิด MySQL ให้เข้าจากภายนอก (หรือย้ายไป PlanetScale/RDS) → ช้ากว่า + ต้องดูแล security
- ไม่มีดิสก์ถาวร → ต้องย้ายไฟล์อัปโหลดไป S3/R2
- cron มีลิมิตเวลา (งานหนักต้องใช้ queue/worker แยก)

> สำหรับระบบสำนักงานที่ผูกกับ MySQL เดิมและมีไฟล์อัปโหลด **A คุ้มกว่า**

---

## 7. แผนงานประมาณ

| ระยะ | งาน | เวลา |
| --- | --- | --- |
| 1 | ตรวจซอร์ส PHP + ฐานข้อมูล, สรุป mapping ตาราง/หน้าจอ | 2–3 วัน |
| 2 | วางโครง Next.js: auth, สิทธิ์, layout, ชั้น DB จาก schema จริง | 3–4 วัน |
| 3 | ย้ายโมดูลหลักทีละตัว (ลูกค้า → เอกสาร → รายงาน) | 1–2 สัปดาห์ |
| 4 | ทดสอบเทียบผลกับ PHP เก่า (ตัวเลขรายงานต้องตรง) + สอนผู้ใช้ | 3–5 วัน |
| 5 | Cutover ด้วย reverse proxy, เก็บ PHP เดิมแบบ read-only 1 เดือน | 1–2 วัน |

---

## 8. สิ่งที่ต้องส่งมาเพื่อเริ่มงานจริง

1. **ซอร์สโค้ด PHP ทั้งหมด** — zip แล้วส่ง หรือ commit เข้า repo นี้
   (ผมเข้า FTP จากสภาพแวดล้อมนี้ไม่ได้)
2. **โครงสร้างฐานข้อมูล** — `mysqldump --no-data dbname > schema.sql`
   (ไม่ต้องมีข้อมูลจริง/ข้อมูลส่วนบุคคล)
3. **ไฟล์ config ที่ปิดรหัสผ่านแล้ว** — เพื่อดูชื่อ DB, timezone, path อัปโหลด
4. **รายการ cron / งานอัตโนมัติ** ที่รันอยู่ และเลือกโฮสติ้งข้อ 6 (A หรือ B)

เมื่อได้ข้อ 1–2 แล้ว จะทำสิ่งนี้ต่อทันทีในโปรเจกต์นี้:

- สร้าง mapping "ไฟล์ PHP → route Next.js" ครบทุกไฟล์
- แปลง schema จริงเป็น Prisma (หรือ SQL layer) และเปิดใช้ `findUserByEmail()` กับตารางจริง
- ย้ายโมดูลแรก (แนะนำ: authentication + dashboard) ให้ใช้งานได้จริงบนฐานข้อมูลเดิม
