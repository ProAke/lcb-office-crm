# รายงานตรวจสอบและเตรียม Deploy — app.laemchabanginterautotire.com

## สรุปสำหรับผู้บริหาร

**สถานะ: NO-GO สำหรับ production และข้อมูลลูกค้าจริง** โค้ดเป็นต้นแบบ Next.js ที่มีหน้า CRM และ integration บางส่วน แต่ยังไม่เชื่อม MySQL หรือบัญชีผู้ใช้เดิม ไม่สามารถแทนระบบ `office.` ได้ในตอนนี้ รายงานนี้อิงการตรวจโค้ดใน repository ไม่ใช่การตรวจระบบ PHP, DNS, hosting หรือบัญชี LINE/Facebook จริง ไม่ได้ deploy หรือแก้ DNS และไม่ควรชี้ webhook/ลูกค้าจริงมาที่แอปต้นแบบ

## ผลตรวจแยกส่วน

| ส่วน | สถานะ | สิ่งที่ยังต้องทำ |
| --- | --- | --- |
| Next.js / UI | มีหน้า Cockpit, CRM, สินค้า, โปรโมชัน, งานบริการ, แชท, publishing และ Rich Menu | ทดสอบ flow และความถูกต้องร่วมกับผู้ใช้จริง |
| MySQL เดิม | **ยังไม่เชื่อมข้อมูล CRM** `repo.ts` ใช้ `store.ts`/JSON | ตรวจ schema จริงและพัฒนา query/transaction กับตารางเดิม; ห้ามเปลี่ยน schema โดยพลการ; ตั้ง `DATABASE_URL` อย่างเดียวไม่พอ |
| ข้อมูล | seed + `web/data/store.json` เก็บใน process/ไฟล์; เขียนล้มเหลวถูกกลืน error; ไม่ปลอดภัยสำหรับหลาย process หรือ serverless | ใช้ MySQL จริง, transaction, backup/restore และทดสอบความสอดคล้องก่อนใช้ข้อมูลจริง |
| Login / สิทธิ์ | บัญชี `admin/admin` เป็นเดโมเท่านั้น ขณะนี้ล็อกอินใน production ถูกปิด; middleware เช็คเพียงการมี cookie แต่ layout ตรวจ session; API Rich Menu ตรวจ role admin | เชื่อมบัญชีเดิมตาม schema/password จริง, ตรวจ authorization ทุก server action/API, rate limiting, session lifecycle/revocation และทดสอบสิทธิ์ |
| LINE Rich Menu | เรียก API จริงเมื่อมี token; สร้าง/อัปโหลด/ตั้ง default/ลบ; ปุ่มแบ่งแนวตั้งเท่า ๆ กัน | ทดสอบกับ LINE test account, ตรวจการ rollback, สิทธิ์และภาพจริงก่อนใช้ account ร้าน |
| LINE webhook / AI | intent-based ไม่ใช่ LLM; LINE reply ใช้ API เมื่อมี token; production ต้องมี secret เพื่อรับ webhook | ป้องกัน event ซ้ำ, ตรวจผล reply/error, reliability, ข้อมูลส่วนตัว และทดสอบกับ LINE test account; ปัจจุบันยังใช้ข้อมูลเดโม |
| Publishing | LINE Broadcast/Facebook อาจส่ง API จริงเมื่อมี token; โหมดไม่มี token จำลองความสำเร็จ; ช่อง web ยังไม่มีหน้าร้านจริงที่ยืนยันได้ | แยก simulation/production ให้ชัด, ทดสอบ integration จริง, idempotency, สิทธิ์ และการอนุมัติก่อนส่ง |
| Metrics / cron | ยอดจำลอง ไม่ใช่ insights จริง; ยังไม่มี scheduler ที่ติดตั้งให้ | เชื่อม API/จัดเก็บ post ID/ทดสอบสิทธิ์, สร้าง scheduler เฉพาะหลังพัฒนาจริง; endpoint ต้องมี `CRON_SECRET` |
| ระบบเดิม | ไม่ได้ตรวจภายใน PHP หรือ DB จริงจากสภาพแวดล้อมนี้ | สำรวจการทำงาน/ตาราง/บัญชีเดิมกับเจ้าของระบบก่อนทำ migration โดยไม่เปลี่ยน schema |

## มาตรการที่ปรับในการตรวจครั้งนี้

- ปิด login ด้วยบัญชีเดโมเมื่อ `NODE_ENV=production`; ต้องพัฒนาการยืนยันตัวตนจริงก่อน จึงจะเข้าสู่ production ได้ ไม่ใช่การตั้งค่าแล้วใช้งานได้ทันที
- ไม่ใช้ `AUTH_SECRET` สำรอง/ตัวอย่างใน production และกำหนดขั้นต่ำ 32 ตัวอักษร
- webhook ปฏิเสธ signature หากไม่มี `LINE_CHANNEL_SECRET` ใน production; ใช้ timing-safe comparison; dev ที่ไม่ได้ตั้ง secret ยังคงเป็นเดโมเท่านั้น
- cron ปฏิเสธเมื่อไม่มี `CRON_SECRET` และรับ secret ผ่าน Authorization header เท่านั้น (ไม่มี query string)
- แก้ข้อความในหน้า login/เอกสารให้ไม่อ้างว่าเชื่อม DB จริงแล้ว

มาตรการเหล่านี้ **ไม่ใช่การรับรองว่าแอปปลอดภัยสำหรับ production** และยังไม่ครอบคลุม authorization ทั้งระบบ

## แผนเตรียม Deploy และเกณฑ์ GO

1. **สำรวจระบบเดิม:** ให้ผู้ดูแล hosting ระบุสภาพแวดล้อม Node.js, DNS, reverse proxy, DB schema แบบ read-only และวิธี backup/restore โดยไม่ส่งรหัสผ่านหรือ token ผ่านแชท เก็บ secret ใน secret manager ของ hosting เท่านั้น อย่าเปลี่ยน schema หรือข้อมูลจริงระหว่างสำรวจ
2. **ทำ auth และ data layer:** ปิด mock user ใน production (ทำแล้ว), เชื่อม auth เดิมโดยตรวจชนิด password จริง, จัดการสิทธิ์ทุก mutation, ป้องกัน brute force และเชื่อม CRUD/transactions กับตารางเดิม ทดสอบกับสำเนาฐานที่แยกจาก production พร้อมตรวจการ restore
3. **ทดสอบ staging แบบ private:** ใช้ LINE test account และฐานทดสอบแยก ห้ามใส่ token ร้านจริงในเดโม; ตรวจ create/list/image/default/delete Rich Menu, signature ผิด/ถูก, webhook ซ้ำ, การจอง, สต็อก, authorization, error handling และ backup/restore
4. **ตั้งโฮสต์:** ผู้ดูแลตั้ง DNS `app.laemchabanginterautotire.com` ชี้ไปยัง hosting ที่เลือก; ตั้ง HTTPS certificate และ reverse proxy ตามแพลตฟอร์ม, ระบุ proxy headers/HTTPS อย่างถูกต้อง และทดสอบ cookie `Secure`/`SameSite`. อย่าสร้าง redirect จาก `office.` จนผ่านการยอมรับและมีแผน rollback
5. **ตั้ง secrets:** สร้าง `AUTH_SECRET` แบบสุ่มอย่างน้อย 32 ตัวอักษร (เช่น `openssl rand -base64 48`), ตั้ง `DATABASE_URL` หลังเชื่อม adapter จริง, และตั้ง `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `CRON_SECRET` ตามฟีเจอร์ที่ได้รับอนุมัติ; ตั้ง Facebook token เฉพาะเมื่อ integration พร้อม ห้าม commit `.env` หรือแสดงค่าใน log
6. **Build และ rollout:** บน Node.js ที่รองรับ Next.js 15 ใช้ `cd web && npm ci && npm run build` ตามด้วยวิธี start ของ hosting (`npm start` ฟังพอร์ตผ่าน `PORT`) หลังทำข้อ blockers ทั้งหมด ติดตั้ง process supervision, logging ที่ไม่บันทึก secrets/PII, monitoring, backups และ resource limits
7. **Acceptance:** ทดสอบ HTTPS, session/roles, flow CRUD กับ DB ทดสอบ, ภาษาไทย/เวลา, restore, LINE signature และ Rich Menu ในบัญชีทดสอบ, การส่งจริงแบบมีการอนุมัติ, performance/concurrency; ให้เจ้าของระบบอนุมัติก่อนเปิด production
8. **Cutover และ rollback:** คง `office.` และ MySQL เดิมไว้โดยไม่มี schema migration; บันทึก config/release เดิม สำรองข้อมูลก่อนเปลี่ยน webhook หรือ DNS กำหนดผู้รับผิดชอบและช่องทางติดต่อ; หากผิดปกติ ให้หยุดทราฟฟิก Next.js คืน DNS/webhook/config เดิม และตรวจสอบข้อมูลก่อน restore (การ restore ทับอาจทำข้อมูลใหม่สูญหาย)

## สิ่งที่ต้องขอจากผู้ดูแล

- แพลตฟอร์ม deploy/ผู้ดูแล DNS และวิธีจัดการ HTTPS; ไม่ต้องส่งรหัสผ่านผ่านแชท
- สำเนา schema ตารางเดิม (รวมชนิดคอลัมน์และ foreign key) และรูปแบบ password hash โดยลบข้อมูลส่วนบุคคล/ความลับ
- บัญชี LINE test และข้อมูลวิธี provision token ผ่านช่องทางลับ; Facebook test ถ้าต้องใช้
- รายชื่อผู้ใช้/สิทธิ์ตามบทบาท, แนวทาง backup, ขอบเขตการ cutover และผู้อนุมัติ

## การตรวจใน workspace

- `npm ci --no-audit --no-fund` และ `npm run build` ผ่าน (รวม type-check และ lint ของ Next.js)
- ทดสอบ production server โดยไม่ตั้ง secrets: webhook ที่ไม่มี signature ตอบ 401, cron ตอบ 503, `/login` ตอบ 200 และ `/dashboard` ที่ไม่มี session redirect ไป login
- ไม่ได้ทดสอบการล็อกอิน production แบบ end-to-end หรือยืนยันการเชื่อมต่อ MySQL, LINE API และระบบ production ภายนอกใน workspace นี้
