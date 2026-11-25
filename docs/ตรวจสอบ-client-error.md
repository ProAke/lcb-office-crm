# ตรวจสอบ client-side exception แบบทีละขั้น

เครื่องมือนี้ตรวจแบบอ่านอย่างเดียว ไม่ส่ง username/password ไม่ล็อกอิน และไม่เปลี่ยนข้อมูล ไม่สามารถใช้แทน browser console หรือยืนยันว่าแอปพร้อม production

## 1. ตรวจ build ที่โฮสต์

อัปโหลดเวอร์ชันที่มี `web/scripts/check-deployment.mjs` ไปยัง staging/โฮสต์ แล้วที่ shell ซึ่งเข้าถึงเว็บไซต์ได้:

```bash
cd <application-root-ที่มี-package.json>
node scripts/check-deployment.mjs https://app.laemchabanginterautotire.com
```

ส่งผลลัพธ์กลับมาโดยลบข้อมูลลับหากโฮสต์แทรกลงใน error หากพบ status ไม่ใช่ 200, เนื้อหาเป็น HTML แทน JavaScript, หรือไฟล์ว่าง ให้ตรวจ Plesk Application Root/Document Root, reverse proxy และ log; อย่าย้าย source หรือ `.env` ไปไว้ใน public document root

หากไฟล์ผ่านทั้งหมด ยังอาจมี runtime exception, cached HTML หรือปัญหา browser extension ซึ่งเครื่องมือนี้ไม่ได้รัน JavaScript เพื่อทดสอบ

## 2. ตรวจใน browser

เปิด `https://app.laemchabanginterautotire.com/login` ในหน้าต่างส่วนตัว หากเกิดปัญหา กด F12 → Console ส่งข้อความ error สีแดงรายการแรกและ stack trace ที่เกี่ยวข้อง พร้อมบอกว่าขึ้นก่อนหรือหลังกดเข้าสู่ระบบ ในแท็บ Network กรอง `JS` และส่ง status/MIME ของไฟล์ที่ล้มเหลว ลบข้อมูลส่วนตัว, cookie, token และรหัสผ่านก่อนส่ง

## 3. ตรวจการ deploy

ยืนยันว่า deploy source และ lockfile เป็น release เดียวกัน สร้าง build บน staging ด้วย `npm ci` และ `npm run build` ก่อนสลับ release/restart; อย่าลบ build ที่กำลังให้บริการ ตรวจ proxy ว่าส่ง requests `/_next/static/...` ไปยังไฟล์ของ release ที่ถูกต้องและไม่ cache HTML เก่าข้าม deployment เก็บ release เดิมไว้ rollback และตรวจ Plesk logs หากมี 500

## ข้อจำกัด production

หน้า login ขึ้นไม่เท่ากับล็อกอินได้: บัญชีเดโมถูกปิดใน production และยังไม่มี auth/MySQL จริง อย่าตั้ง development mode บนเว็บสาธารณะหรือใส่ LINE token จริงเพื่อทดลอง
