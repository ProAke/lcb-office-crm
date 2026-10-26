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
2. `mysqldump --no-data` ของฐานข้อมูลเดิม
3. ไฟล์ config ที่ปิดรหัสผ่านแล้ว (ดูชื่อ DB/timezone/path อัปโหลด)
4. รายการ cron และโฮสติ้งที่จะใช้ (VPS + Nginx หรือ Vercel)
