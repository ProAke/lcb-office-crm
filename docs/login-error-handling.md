# การจัดการข้อผิดพลาดเข้าสู่ระบบ

ฟอร์ม login ใช้ `POST /api/auth/login` แบบ JSON แทน Next.js Server Action เพื่อแสดงข้อความที่เข้าใจได้เมื่อเครือข่าย/โฮสต์ตอบผิดปกติ เช่น WAF ตอบ HTML 403 แทนที่จะปล่อยให้การแปลง response ของ Server Action ทำให้หน้าเกิด exception การเปลี่ยน endpoint **ไม่ได้ยืนยันว่าแก้ต้นเหตุ 403** ของ Plesk แล้ว และยังไม่ได้ทดสอบบนโฮสต์จริง

- API ตรวจ Origin เทียบกับ Host และไม่ส่งรายละเอียด exception กลับ client; reverse proxy ต้องส่ง Host สาธารณะให้ถูกต้อง และ HTTPS ต้องตั้งถูกต้อง
- client ยอมรับเฉพาะ JSON `{ok:true}` ที่สำเร็จ, แสดงข้อความเมื่อ 403/429/HTML หรือ JSON ผิดรูปแบบ และไม่แสดง HTML ของ proxy โดยตรง
- บัญชีเดโมยังใช้เฉพาะ development; บัญชี setup ชั่วคราวต้องเปิดตามคู่มือ `first-time-setup.md` ใน staging ที่จำกัดการเข้าถึง และยังไม่ใช่บัญชี MySQL จริง
- การทดสอบใน workspace ไม่แทนการทดสอบ browser, Plesk, WAF และการเชื่อมฐานข้อมูลจริง; ต้องมี proxy rate limiting และตรวจสิทธิ์ action อื่นก่อนใช้งาน production

## ทดสอบหลัง deploy ไป staging

1. ให้ผู้ดูแลตรวจการตั้งค่า reverse proxy และ Host; ใช้ HTTPS
2. เปิด login ทดสอบรหัสผิดและรหัสที่ได้รับอนุญาต ตรวจว่ามีข้อความแทนหน้า exception
3. หากยังขึ้น 403 ตรวจ Network ของ `POST /api/auth/login` และ log ของ Plesk/WAF ตามเวลาเดียวกัน ห้ามแชร์ credentials, cookies, payload หรือ token
4. ถ้าพบว่า WAF บล็อก ให้ผู้ดูแลตรวจ rule ที่ระบุและแก้เฉพาะจุดหลังประเมินความปลอดภัย ไม่ปิด WAF ทั้งระบบ

การ deploy ต้อง build release ใหม่ให้เสร็จก่อนสลับ/restart และเก็บ release เดิมสำหรับ rollback ห้ามเปลี่ยนเป็น development เพื่อใช้บัญชีเดโมบนเว็บไซต์สาธารณะ
