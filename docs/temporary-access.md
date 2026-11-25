# บัญชีผู้ดูแลชั่วคราวสำหรับตั้งค่า (ยังไม่ใช่ production auth)

ฟีเจอร์นี้ **ปิดโดยปริยาย** ใช้เพื่อเข้าไปตรวจหน้าต้นแบบระหว่างเตรียมระบบเท่านั้น ไม่เชื่อม MySQL เดิม ไม่ใช่บัญชีจริง และไม่ทำให้ CRM พร้อม production ข้อมูลยังเป็น JSON เดโม ห้ามใช้ข้อมูลลูกค้า/LINE token จริง

**ก่อนเปิด:** จำกัดการเข้าถึงเว็บไซต์ด้วย VPN หรือ IP allowlist ใน hosting/reverse proxy, ใช้ HTTPS, จำกัดจำนวนครั้งล็อกอินและตั้ง monitoring ที่ proxy ให้ผู้ดูแลโฮสต์ตรวจสอบ เพราะแอปยังไม่มี rate limiting หรือระบบสิทธิ์ production ครบทุก action ไม่ควรเปิดบนอินเทอร์เน็ตทั่วไป ผู้ดูแลควรกำหนดเวลาสั้นที่สุดและปิดทันทีหลังทดสอบ

## วิธีตั้งค่าบนโฮสต์

1. นำเวอร์ชันที่มีฟีเจอร์นี้ไปยัง staging/private; `cd web && npm ci && npm run build` ตามวิธีของโฮสต์ (รวม dependencies สำหรับ build) ตั้ง `AUTH_SECRET` เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร และ HTTPS; ดู [คู่มือ Plesk](plesk-nodejs-setup.md)
2. สร้างรหัสผ่านแบบสุ่มและ bcrypt hash บนเครื่องที่ปลอดภัยในโฟลเดอร์ `web` หลัง `npm ci`:

   ```bash
   node -e 'const c=require("node:crypto"), b=require("bcryptjs"); const p=c.randomBytes(24).toString("base64url"); console.log("รหัสผ่านชั่วคราว:",p); console.log("bcrypt hash:",b.hashSync(p,12));'
   ```

   คำสั่งจะแสดงรหัสและ hash บนหน้าจอผู้ดูแล เก็บใน password manager ที่ปลอดภัย **อย่าส่งในแชท, log, Git หรือ screenshot**; รหัสต้องมีอย่างน้อย 16 และไม่เกิน 72 bytes ไม่ใช่ `admin` สุ่มรหัสใหม่ทุกครั้ง
3. ใน Environment ของ Plesk/secret manager ตั้งค่าต่อไปนี้ผ่านช่องทางลับ (ไม่ใส่เครื่องหมายคำพูดหาก panel ไม่ต้องการ):
   - `BOOTSTRAP_LOGIN_ENABLED` = `true`
   - `BOOTSTRAP_ADMIN_PASSWORD_HASH` = bcrypt hash ที่สร้าง (cost 12–14; ต้องคง `$` ทุกตัว)
   - `BOOTSTRAP_LOGIN_EXPIRES_AT` = วันหมดอายุ UTC แบบ ISO เช่น `2030-01-01T12:00:00Z` **เปลี่ยนเป็นเวลาจริงที่ใกล้ที่สุดที่ต้องการ**
4. รีสตาร์ตแอป ตั้งผู้ใช้ `admin` และรหัสผ่านสุ่มที่สร้าง เข้าตรวจภายในวงจำกัดเท่านั้น เมื่อครบเวลา ระบบจะปฏิเสธ session ชั่วคราวแม้ cookie ยังมีอยู่
5. เมื่อเลิกใช้ ตั้ง `BOOTSTRAP_LOGIN_ENABLED=false` และลบ hash/expiry จาก environment แล้วรีสตาร์ต ตรวจว่าบัญชีเข้าไม่ได้ และ rotate `AUTH_SECRET` หากสงสัยว่ามีการรั่วไหล การปิด/หมดอายุหรือเปลี่ยน hash จะทำให้ session ชั่วคราวใช้ไม่ได้เมื่อมีการตรวจ session อีกครั้ง

## ข้อจำกัดสำคัญ

- ไม่ได้ทดสอบกับ Plesk จริง; บาง panel อาจจัดการ `$` ใน environment ต่างกัน ควรตรวจสอบการคัดลอกโดยไม่แสดงค่าใน log
- การปิด session ไม่ได้ยกเลิก operation ที่เริ่มไปแล้ว และไม่แทนการตรวจสิทธิ์ของ Server Actions ทุกจุด ระบบเดิมยังต้อง hardening ก่อนเปิด production
- ยังต้องพัฒนา auth จริง/เชื่อม MySQL เดิม, ตรวจสิทธิ์และ audit, backup/restore และ UAT ก่อนเปิดใช้งานลูกค้าจริง
