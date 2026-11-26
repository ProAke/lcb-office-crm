# การตรวจสอบปัญหาและแจ้งผู้ดูแล

## สิ่งที่ทำแล้วในต้นแบบ

- ฟอร์ม login แสดงข้อความที่เข้าใจได้เมื่อโฮสต์ตอบ 403/429/HTML ผิดรูปแบบหรือเครือข่ายขัดข้อง แทนการปล่อย response ผิดรูปแบบจาก Server Action ทำให้หน้าพัง
- หน้า error boundary ให้ผู้ใช้ลองอีกครั้ง และพยายามรายงานประเภท `ui_error` กลับมายัง API ในโฮสต์เดียวกัน
- ฟอร์ม login พยายามรายงาน `login_blocked`, `login_server_error`, `login_network_error` เมื่อพบปัญหาที่เกี่ยวข้อง ไม่รายงานรหัสผ่านผิดทั่วไป
- `POST /api/diagnostics` รับเฉพาะประเภทและสถานะ HTTP ใน allowlist พร้อมตรวจ Origin/Host จำกัด body ที่ 512 bytes และจำกัดจำนวนเหตุการณ์ในหน่วยความจำของแต่ละ process เหตุการณ์ได้รับรหัสสุ่ม/เวลา และเขียน structured JSON `[lcb-incident]` ไปยัง process logs
- หน้า `/diagnostics` สำหรับ admin แสดง 50 รายการล่าสุด **ในหน่วยความจำของ process ที่ตอบคำขอเท่านั้น** และรีเฟรชทุก 10 วินาทีขณะเปิดหน้า
- ไม่ส่ง error message, stack trace, URL, request body, ชื่อผู้ใช้, รหัสผ่าน, cookies หรือข้อมูลลูกค้าไป diagnostics API

## ข้อจำกัดสำคัญ

- การรายงานเป็น best effort: หากเครือข่าย/โฮสต์/WAF บล็อกคำขอรายงานหรือ client ไม่รัน JavaScript จะไม่ถูกบันทึก; client สามารถส่งเหตุการณ์เท็จได้ ไม่ใช่ audit log ที่เชื่อถือได้
- รายการในหน้า admin **ไม่ถาวร** หายเมื่อ process รีสตาร์ต และอาจไม่ตรงกันระหว่าง process หรือหลายเครื่อง; rate limit เป็นเพียงระดับ process ไม่ใช่การป้องกันการโจมตีแบบกระจาย
- logs ที่ stdout ต้องให้ Plesk หรือผู้ให้บริการเก็บและหมุน log; การส่ง log ไป stdout **ไม่ใช่การแจ้งเตือนอัตโนมัติและไม่ส่งให้ Arena/ทีมพัฒนาโดยอัตโนมัติ** ไม่มีการเชื่อม email หรือบริการภายนอก
- เหตุการณ์มีเพียงหมวด/status/time/id จึงอาจไม่พอหาต้นเหตุ ต้องตรวจ Plesk/WAF/reverse proxy logs แยกโดยคำนึงถึง privacy และการเก็บรักษาข้อมูล
- error boundary ไม่รับประกันป้องกันทุก exception เช่น error ใน event handler หรือ failure ก่อน JavaScript โหลด; ไม่ควรข้าม authorization หรือสร้างความสำเร็จปลอมเพื่อให้ดูเหมือนระบบทำงาน
- 403 ที่โฮสต์จริงยังไม่ได้รับการวิเคราะห์; ยังไม่ได้ทดสอบการเปลี่ยนแปลงเหล่านี้บน Plesk และ production login/MySQL ยังไม่พร้อม

## ก่อนใช้งานจริง

1. ใช้ staging แยกข้อมูลจริง ตรวจสิทธิ์ทุก server action/API และจำกัดการเข้าใช้งานจริง; ตั้ง rate limiting ที่ proxy และกำหนดวิธีป้องกันการ spam incident
2. ตั้ง Plesk ให้เก็บ/rotate process logs อย่างปลอดภัย ตรวจ permission/retention และทดสอบ restore ห้าม log ข้อมูลลับหรือ payload
3. เลือกปลายทางแจ้งเตือนที่เจ้าของระบบอนุมัติ (เช่นระบบ monitoring ภายนอกหรือช่องทางองค์กร) และตั้งค่าแยกบนโฮสต์; พัฒนาตัวส่งที่มี deduplication, rate limit, retry, queue และ alert thresholds พร้อมตรวจ privacy ก่อนเปิด ไม่มีการตั้งค่าแจ้งเตือนนี้ในโค้ดปัจจุบัน
4. เพิ่ม durable log store/collector, structured severity, dashboards, correlation และการแจ้ง on-call พร้อมทดสอบหลาย process และกรณี collector/เครือข่ายล้มเหลว
5. ตรวจสอบ `/api/auth/login` และ `/api/diagnostics` ผ่าน HTTPS และ proxy ที่ส่ง Host ถูกต้อง; ทดสอบ 403/429/500, network failure, WAF block, สิทธิ์ admin และว่าเหตุการณ์ไม่บันทึกข้อมูลส่วนบุคคล ก่อนให้ผู้ดูแลรับรอง
EOF