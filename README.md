# LCB Office CRM — Next.js scaffold (+ แผนย้ายจาก PHP เดิม)

โปรเจกต์นี้คือ **โครงตั้งต้นของระบบใหม่บน Next.js** สำหรับ
`office.laemchabanginterautotire.com` โดยตั้งใจให้ **ใช้ฐานข้อมูล MySQL ชุดเดิม**
ของระบบ PHP ไม่ย้ายข้อมูลและไม่เปลี่ยนโครงสร้างตาราง

```
.
├─ web/                     แอป Next.js 15 (App Router, TypeScript, Tailwind 4)
│  ├─ src/app/login/        หน้าเข้าสู่ระบบ + Server Action (แทน login-process.php)
│  ├─ src/app/(app)/        พื้นที่หลังล็อกอิน (layout คล้าย AdminLTE เดิม)
│  │  ├─ dashboard/         หน้าแรกหลังล็อกอิน
│  │  ├─ line-rich-menu/    โมดูลที่มีอยู่เดิมในระบบ (ตัวอย่าง)
│  │  └─ plan/              แผนย้ายระบบฉบับเต็ม (อ่านในเว็บได้)
│  ├─ src/lib/              session (JWT cookie), auth, db (mysql2), constants
│  ├─ src/middleware.ts     แทน session-check ที่เคย include ทุกหน้า PHP
│  ├─ prisma/schema.prisma  ตัวอย่าง schema (ทางเลือกถ้าจะใช้ Prisma)
│  └─ .env.example          ค่าที่ต้องตั้ง (DB, secret, LINE token)
└─ docs/migration-php-to-nextjs.md   สรุปสิ่งที่ต้องแก้แบบละเอียด
```

## รันดู

```bash
cd web
npm install
npm run dev          # http://localhost:3000
# เดโม: admin / admin
```

## สถานะและการเตรียม Deploy

ระบบปัจจุบันเป็น **ต้นแบบ** ยังไม่พร้อมเปิดให้ใช้งานจริง: ข้อมูล CRM ใช้ JSON เดโม ไม่ได้เชื่อม MySQL เดิมเพียงเพราะตั้ง `DATABASE_URL`; การยืนยันตัวตนจริงยังไม่ได้ทำ; metrics เป็นข้อมูลจำลอง และ LINE/Facebook ยังต้องทดสอบกับบัญชีจริง ห้ามนำไปใช้กับข้อมูลลูกค้าจริงหรือเชื่อมช่องทางจริงก่อนแก้ประเด็นในรายงาน

รายงานการตรวจสอบ รายการงานค้าง และขั้นตอนเตรียม deployment สำหรับ `https://app.laemchabanginterautotire.com` อยู่ที่ [docs/deployment-readiness.md](docs/deployment-readiness.md)

## ภาพรวมต้นแบบ CRM + ERP (Next.js)

พัฒนาต้นแบบโมดูลธุรกิจร้านยาง (อ่านรายละเอียดใน `web/README.md`):

- **Cockpit** `/dashboard` — KPI รายได้/คิว/โปร/สต็อก/แชท ในจอเดียว + กราฟรายได้ 6 เดือน
- **CRM ลูกค้า** `/customers` — ทะเบียนรถ ยอดสะสม หน้า 360°
- **สินค้า & บริการ** `/products` — สต็อกอัจฉริยะ + จุดเตือนสั่งซื้อ + กำไร%
- **โปรโมชันรายเดือน** `/promotions` — สร้าง/เปิด/ปิด + เผยแพร่ทุกช่องทาง
- **ศูนย์บริการ** `/service` — ปฏิทินนัด + Kanban ใบงาน (ตัดสต็อกอัตโนมัติเมื่อส่งมอบ)
- **AI ตอบแชท** `/chat` + `POST /api/webhooks/line` — รวมแชท LINE/FB/Web, AI ตอบจากข้อมูลจริงและจองคิวให้ลูกค้าเองได้
- **Publishing Hub** `/publish` + `GET /api/cron/sync` — เขียนครั้งเดียวกระจาย LINE Broadcast / Facebook / เว็บ แล้วดึงยอด reach/clicks กลับมาวัดผล

> ข้อมูลทั้งหมดยังวิ่งผ่านชั้น `web/src/lib/crm/repo.ts` เพียงไฟล์เดียว —
> การตั้ง `DATABASE_URL` เพียงอย่างเดียวยังไม่เชื่อมข้อมูลจริง ต้องพัฒนาและทดสอบ repository กับ schema เดิมก่อน

> ยังไม่ต้องมี MySQL ก็รันได้ (ผู้ใช้เดโมอยู่ใน `src/lib/auth.ts`)
> เมื่อมีข้อมูลจริง ให้คัดลอก `.env.example` → `.env` แล้วเปลี่ยน `findUserByEmail()`
> ให้ query ตารางผู้ใช้เดิม (โค้ดตัวอย่างคอมเมนต์ไว้ในไฟล์แล้ว)

## สรุปสั้น: ของเดิม PHP → ของใหม่ Next.js

| ของเดิม (PHP) | ของใหม่ (Next.js) |
| --- | --- |
| `includes/config.php` (DB user/pass) | `.env` + `src/lib/db.ts` |
| `session_start()` / `$_SESSION` | JWT ใน httpOnly cookie (`src/lib/session.ts`) |
| `session-check.php` ที่ include ทุกหน้า | `src/middleware.ts` + guard ใน layout |
| `authentication/login-process.php` | Server Action `loginAction()` |
| `include header/footer` | `app/(app)/layout.tsx` |
| `index.php?action=edit&id=5` | `app/(app)/…/[id]/edit/page.tsx` |
| `save.php` + `header('Location')` | Server Action + `revalidatePath()` + `redirect()` |
| `ajax-list.php` คืน JSON | Server Component อ่าน DB ตรง ๆ หรือ `app/api/…/route.ts` |
| `move_uploaded_file()` ลง `public_html` | object storage (S3/R2) หรือดิสก์บน VPS |
| `mail()` / PHPMailer | nodemailer / Resend |
| `cron/*.php` | `app/api/cron/…/route.ts` + secret header |
| `.htaccess` | `next.config.ts` (headers/rewrites) + middleware |

รายละเอียดทั้งหมด (พร้อมโค้ดเทียบก่อน/หลัง, สิ่งที่ต้องแก้ 10 ข้อ, ทางเลือกการติดตั้ง,
แผนงาน) อยู่ใน **[docs/migration-php-to-nextjs.md](docs/migration-php-to-nextjs.md)**
และหน้า `/plan` ในแอป

## สิ่งที่ยังต้องขอจากเจ้าของระบบ

1. ซอร์สโค้ด PHP ทั้งหมด (zip แล้วส่งมา หรือ commit เข้า repo นี้) — FTP เข้าไม่ได้จากสภาพแวดล้อมที่ผมทำงาน
   ดู [`docs/php-source-intake.md`](docs/php-source-intake.md)

## ตรวจซอร์สอัตโนมัติ

```bash
node tools/inspect-php-source.mjs incoming/php-source --out docs/php-source-report.md
```

สร้างรายงาน: entry point ที่ต้องแปลงเป็น route, ตาราง/คอลัมน์ที่อ้างถึง,
จุดใช้ `$_SESSION`, วิธีแฮชรหัสผ่าน, SQL ที่ต่อสตริง (เสี่ยง injection),
จุดอัปโหลด/อีเมล/PDF/LINE, ฟอร์มที่ต้องแปลงเป็น Server Action และไฟล์ที่มี credential
2. `mysqldump --no-data` ของฐานข้อมูลเดิม
3. ไฟล์ config ที่ปิดรหัสผ่านแล้ว (ดูชื่อ DB/timezone/path อัปโหลด)
4. รายการ cron และโฮสติ้งที่จะใช้ (VPS + Nginx หรือ Vercel)
