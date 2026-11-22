# LCB CRM + ERP — Next.js

ระบบต้นแบบสำหรับร้าน Laem Chabang Inter Auto Tire บน Next.js (App Router, TypeScript) โดยมีโดเมนเป้าหมาย **https://app.laemchabanginterautotire.com** โปรเจกต์นี้ไม่มีไฟล์ PHP runtime; การเปลี่ยนโดเมนหรือการปลดระวางระบบเดิมบน hosting ยังไม่ได้ดำเนินการ

> **ยังไม่พร้อม production**: CRM ใช้ข้อมูลเดโมใน JSON, ยังไม่ได้เชื่อม MySQL เดิมหรือระบบบัญชีผู้ใช้จริง, production login ถูกปิด, metrics เป็นข้อมูลจำลอง และการเชื่อมต่อ LINE/Facebook ยังต้องทดสอบจริง ห้ามใช้ข้อมูลลูกค้าหรือ token จริงจนกว่าผ่านการตรวจรับ

## ทดลองในเครื่อง

```bash
cd web
npm ci
npm run dev
# http://localhost:3000 — เฉพาะโหมดพัฒนา: admin / admin
```

`npm start` ใช้ production mode ซึ่งปิดการล็อกอินด้วยบัญชีเดโม ระบบยืนยันตัวตนจริงยังไม่ได้พัฒนา

## โครงสร้าง

- `web/src/app/(app)/` — หน้าหลังบ้าน: Cockpit, ลูกค้า, สินค้า, โปรโมชั่น, ศูนย์บริการ, แชท, เผยแพร่, LINE Rich Menu และแผนระบบ
- `web/src/app/api/` — LINE webhook, Rich Menu และ cron เดโม
- `web/src/lib/crm/` — repository และ JSON store เดโม; ยังไม่ได้ query MySQL
- `web/src/lib/db.ts` — MySQL connection helper; การตั้ง `DATABASE_URL` เพียงอย่างเดียวยังไม่เชื่อมระบบ
- `web/.env.example` — รายการตัวแปรฝั่งเซิร์ฟเวอร์ ห้ามเก็บ secret จริงใน Git
- `docs/` — สถานะโครงการ แผนและเอกสารอ้างอิงระบบเดิม

## เงื่อนไขก่อนใช้งานจริง

1. สำรวจ schema และบัญชีผู้ใช้ของฐาน MySQL เดิมโดยไม่เปลี่ยนตารางหรือข้อมูล แล้วเชื่อม repository/auth ให้ตรงกับระบบจริง
2. ตรวจสิทธิ์ทุก server action/API ทดสอบ transaction, ข้อมูลพร้อมกัน, สำรองและกู้คืน
3. ทดสอบ LINE, publishing และฟังก์ชันธุรกิจใน staging ที่แยกฐานและบัญชีทดสอบจาก production
4. พัฒนาระบบสมาชิกสะสมแต้ม QR และ Rich Menu 6 ช่องแบบ 3×2 ตามข้อกำหนดที่ได้รับอนุมัติ; ฟีเจอร์เหล่านี้ยังไม่ได้ทำ
5. ตั้ง hosting, DNS, HTTPS และ secrets อย่างปลอดภัย; ให้ร้านตรวจรับก่อนเปิดใช้และมีแผน rollback
6. ปลดระวาง PHP บนโฮสต์เดิมหลังตรวจรับ สำรองและทดสอบกู้คืน พร้อมได้รับอนุมัติจากเจ้าของระบบเท่านั้น

การตั้ง `DATABASE_URL` ไม่ได้ทำให้ข้อมูล CRM หรือบัญชีผู้ใช้เชื่อมต่อจริงโดยอัตโนมัติ และไม่มีการเปลี่ยน schema ในงานนี้

## เอกสาร

- [รายงานสรุปโครงการฉบับสมบูรณ์](docs/รายงานสรุปโครงการฉบับสมบูรณ์.md)
- [รายงานและแผน deploy](docs/deployment-readiness.md)
- [รายละเอียดสมาชิก QR และ Rich Menu](docs/รายงานโครงสร้างและแผนพัฒนาระบบ.md)
- [ข้อมูลอ้างอิงระบบเดิม](docs/migration-php-to-nextjs.md) และ [วิธีสำรวจระบบเดิม](docs/php-source-intake.md) — ใช้เพื่อยืนยันความครบถ้วน ไม่ใช่ PHP runtime ที่แอปต้องใช้
