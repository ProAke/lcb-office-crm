# ตั้งค่า Next.js บน Plesk Node.js

**สถานะ: สำหรับทดสอบการเริ่มต้นระบบเท่านั้น ยังไม่พร้อมเปิดให้ลูกค้าหรือพนักงานใช้จริง** ระบบ CRM ยังเป็นข้อมูลเดโม, ไม่ได้เชื่อม MySQL/บัญชีเดิม และปิดบัญชีเดโมใน production ใช้ staging/private access และอย่าใส่ token LINE/Facebook จริงจนผ่านการตรวจรับ ดู [รายงานความพร้อม deploy](deployment-readiness.md)

## สาเหตุ error จากหน้าจอ

Plesk พยายามหา `app.js` ใน Application Root แต่โค้ด Next.js ของ repo อยู่ในโฟลเดอร์ `web/` และก่อนหน้านี้ไม่มี entry point ชื่อนี้ มีการเพิ่ม `web/app.js` เพื่อให้ panel เริ่ม Next.js แบบ production ได้ **ต้องอัปโหลด/ดึงโค้ดเวอร์ชันที่มีไฟล์นี้ขึ้นโฮสต์ก่อน** การเปลี่ยนชื่อใน panel อย่างเดียวไม่ทำให้ไฟล์ปรากฏ

## ค่าแนะนำ (เมื่อโฟลเดอร์ repo อยู่ที่ `/app.laemchabanginterautotire.com` ตาม path ใน panel)

| ค่าใน Plesk | ค่าที่ต้องการ | หมายเหตุ |
|---|---|---|
| Application Root | `/app.laemchabanginterautotire.com/web` | ต้องเห็น `package.json`, `package-lock.json` และ `app.js` อยู่ระดับเดียวกัน path ที่แสดงเป็น path ใน panel ไม่จำเป็นต้องเป็น absolute path ใน shell |
| Document Root | `/app.laemchabanginterautotire.com/web/public` | ให้เป็นโฟลเดอร์ public ภายใต้ Application Root **ไม่ชี้ไปที่ web ทั้งโฟลเดอร์** เพื่อไม่เปิด source, `.env`, `data` หรือไฟล์อื่นให้ดาวน์โหลด |
| Application Startup File | `app.js` | เป็น path สัมพัทธ์กับ Application Root; ใน repo คือ `web/app.js` |
| Application Mode | `production` | บัญชี `admin/admin` ใช้ไม่ได้ใน production ของโค้ดปัจจุบัน |
| Package Manager | `npm` | สั่งติดตั้ง/build ที่ Application Root |
| Node.js | เวอร์ชันที่โฮสต์รองรับและเข้ากันได้กับ Next.js 15 | เลือก LTS ที่ hosting รองรับ เช่น Node 22 หากมี; เวอร์ชัน 24 ในภาพยังไม่ได้ทดสอบในโฮสต์นี้ |

ใน Plesk บางรุ่น Application Root อาจถูกกำหนดจากตำแหน่ง Document Root หรือมีข้อจำกัดของผู้ให้บริการ หากแก้ไขไม่ได้ ให้ติดต่อผู้ดูแลโฮสต์เพื่อจัดให้ **Document Root อยู่ใน `web/public` และ Application Root เป็น `web`** ห้ามแก้โดยเปิด `web` เป็น document root หรือคัดลอก source/secrets ไปยังโฟลเดอร์ที่เว็บให้บริการ

หากวางเฉพาะ **เนื้อหาภายใน `web/`** ที่ root ของโดเมนแทน ให้นำ `public/` ไปอยู่ใต้ root นั้น และใช้ Application Root เป็น root ที่มี `package.json` กับ `app.js` และ Document Root เป็น `public/` อย่าวางซ้อน `web/web` ตรวจสอบค่าที่ panel แสดงจริงหลังอัปโหลด

## ลำดับติดตั้ง

1. อัปโหลดหรือ deploy repo เวอร์ชันที่มี `web/app.js`, `web/public/`, `package.json` และ lockfile เข้าตำแหน่งที่ระบุ (รวม source แต่ไม่อัปโหลด `.env`, `node_modules` หรือ `.next` จากเครื่องอื่น) ตั้ง Document Root และ Application Root ตามตาราง
2. ใน **Run Node.js commands** เลือกทำงานที่ Application Root ติดตั้ง dependencies รวม dev dependencies ด้วย `npm ci` และรัน `npm run build` หาก panel ไม่รองรับคำสั่งดังกล่าว ให้ผู้ดูแลทำใน shell ที่มี Node เวอร์ชันเดียวกับ panel **ห้ามใช้ `NODE_ENV=development` กับเว็บสาธารณะเพื่อเปิดบัญชีเดโม**
3. ใน Environment ตั้ง `AUTH_SECRET` เป็นค่าสุ่มลับอย่างน้อย 32 ตัวอักษร (เช่นสร้างด้วย `openssl rand -base64 48` บนโฮสต์) ผ่าน secret manager/หน้าตั้งค่าที่ปลอดภัย ไม่ commit หรือส่งผ่านแชท. การตั้ง `DATABASE_URL` อย่างเดียว **ยังไม่เชื่อม CRM กับ MySQL** และการตั้ง token อาจมีผลส่งข้อมูลออกช่องทางจริง จึงยังไม่ควรตั้งกับบัญชีจริงในต้นแบบ
4. กด **Restart App** แล้วเปิดหน้าเว็บใหม่ หากยัง error ให้ตรวจว่าหน้า panel แสดง Application Root ถูกต้อง มี `app.js` อยู่จริง ติดตั้ง packages/build สำเร็จ และตรวจ application logs ของ Plesk โดยไม่เผย secrets
5. ทดสอบบน staging/private: `/login` ควรแสดงหน้าเข้าสู่ระบบ แต่ **ยังล็อกอิน production ไม่ได้** จนกว่าจะเชื่อมระบบบัญชีจริง ตรวจว่า `.env`, source code และ `data/store.json` ไม่ถูกเสิร์ฟผ่านเว็บ; ตั้ง HTTPS ก่อนทดสอบ cookie

## ข้อจำกัด

- ไฟล์เริ่มต้นนี้ทดสอบใน workspace ด้วย Node.js และ Next.js build แล้ว แต่ **ยังไม่ได้ทดสอบบนโฮสต์ Plesk หรือ Phusion Passenger จริง** การตั้งค่า panel และ reverse proxy ขึ้นอยู่กับผู้ให้บริการ
- ไม่ได้ตั้ง DNS/SSL, deploy หรือเชื่อมฐานข้อมูลจาก workspace นี้ หากข้อจำกัด hosting ไม่อนุญาต Node server ที่รันต่อเนื่อง ให้ใช้บริการที่รองรับ Next.js แทน
- อย่าลบระบบเดิมหรือชี้ webhook มาที่ต้นแบบ ก่อนเชื่อมข้อมูลจริง ทดสอบความปลอดภัย สำรอง/กู้คืน และให้เจ้าของระบบอนุมัติ
