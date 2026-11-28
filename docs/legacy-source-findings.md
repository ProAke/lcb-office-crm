# ผลตรวจซอร์สระบบ Office เดิม

## แหล่งอ้างอิงและข้อจำกัด

ตรวจ repository [ProAke/lcb-phpweb](https://github.com/ProAke/lcb-phpweb) สาขา `master` commit `8a434c947eb00a21327788b6703cbb7ed4ae8fbd` และ [ProAke/lcb-crm-nuxt](https://github.com/ProAke/lcb-crm-nuxt) commit `955897d33197b3ed28d443707785227aac3dc87e` แบบอ่านอย่างเดียว วันที่ 9 พฤศจิกายน 2026 ซอร์ส PHP มีเส้นทาง `authentication/index.php` ตรงกับ URL ที่ให้ แต่ **ยังไม่ได้ยืนยันว่าไฟล์บนเซิร์ฟเวอร์ตรงกับ commit นี้** หรือว่าสคีมาจริงตรงไฟล์ติดตั้ง ไม่ได้นำ secret, ข้อมูลลูกค้า หรือไฟล์ config จากซอร์สมาบันทึกที่นี่

ก่อนหน้านี้การสรุปว่าไม่มีซอร์ส PHP อ้างอิงได้จำกัดเฉพาะ checkout นี้ และไม่ได้สำรวจ repository `lcb-phpweb` ให้ครบ เป็นข้อผิดพลาดในการค้นหาที่แก้ไขแล้ว

## สิ่งที่พบจาก PHP

| งานเดิม | หลักฐานใน repository | ผลที่ต้องรักษา/ตรวจเพิ่ม |
| --- | --- | --- |
| เข้าระบบ | `authentication/index.php`, `check_login.php` | `tb_admin_user`, `STATUS`, `LEVEL`; password_verify และรองรับ MD5 เดิมพร้อม upgrade เป็น Argon2id; ต้องทดสอบ hash และสิทธิ์จริงอย่างปลอดภัยก่อนย้าย ไม่คัดลอกการรองรับ MD5 โดยไม่ประเมินความเสี่ยง |
| Cockpit | `dashboard/index.php` | นับสมาชิก `tb_member`, คิววันนี้/คิว pending `tb_booking`, โปร active `tb_promotion`; รายการคิวล่าสุด join สมาชิกและผู้ดูแล |
| สมาชิก/รถ/แต้ม | `dashboard/member/index.php`, `detail.php`, `tirepointplus/` | ใช้ `tb_member`, `tb_car`, คะแนนใน member, LINE user ID; ต้องตรวจ transaction/ประวัติคะแนนและ QR ก่อนอ้างว่ามีครบ |
| คิวบริการ | `dashboard/booking/index.php`, `status.php`, `history.php` | `tb_booking`, `tb_booking_log`, `tb_admin_user`; มีช่าง, service note, รูปใบงาน และบันทึกสถานะ; ต้องตรวจการจัดการไฟล์และ transaction |
| สินค้าและโปรโมชั่น | `dashboard/product/`, `brand/`, `category/`, `promotion/` | `tb_products`, `tb_brand`, `tb_product_category`, `tb_promotion` |
| LINE | `dashboard/richmenu/`, `richmessage/`, `tirepointplus/webhook.php`, `include/config.inc.php` | มีจุดเชื่อม LINE แต่ยังไม่ทราบการตั้งค่า/สถานะบนเซิร์ฟเวอร์และยังไม่ทดสอบ API จริง; ไม่คัดลอก tokens |
| คู่มือ | `dashboard/manual/`, `home/manual/` | `tb_manual`, อัปโหลดไฟล์; ต้องคงสิทธิ์และตรวจความปลอดภัย |

`install/schema_cms.sql` และสคริปต์ `dashboard/fix_schema*` มีการสร้าง/แก้ตารางหลายรุ่น จึง **ไม่รันสคริปต์เหล่านี้กับฐานจริง** และไม่สรุปว่า schema ที่ deploy เท่ากับ schema ใน repo. Nuxt README ระบุว่าเป็น prototype/sample data แม้มี migration ไม่ใช่หลักฐานการเชื่อมฐาน production

## ตรวจฐานเดิมโดยไม่แก้ข้อมูล

เมื่อ deploy เครื่องมือบนเซิร์ฟเวอร์ที่เข้าถึง MySQL ได้ ให้ผู้ดูแลตั้ง `DATABASE_URL` ผ่านช่องทาง secret ที่ปลอดภัย แล้วจาก `web` ใช้ `node scripts/audit-legacy-schema.mjs` ด้วยบัญชีสิทธิ์อ่าน metadata เท่านั้น (ใช้ TLS ตามข้อกำหนดโฮสต์) สคริปต์ SELECT จาก `information_schema.COLUMNS` เฉพาะตาราง Cockpit 4 ตาราง ไม่อ่านแถวลูกค้า ไม่พิมพ์ URL หรือ raw errors และไม่สร้าง/แก้ตาราง exit 0 พบคอลัมน์ที่ระบุครบ, 1 พบไม่ครบหรือมองไม่เห็น, 2 การเชื่อมต่อ/การตั้งค่าล้มเหลว การผ่านไม่ยืนยันชนิด/ดัชนี/สิทธิ์หรือความพร้อม production

## กฎพัฒนาต่อ

1. อ้างเส้นทางและ commit จากของเดิมสำหรับทุก feature; แยกสิ่งที่พบจากสิ่งที่ยังไม่ได้ยืนยันกับเซิร์ฟเวอร์
2. ห้ามเดาชื่อตาราง/เปลี่ยน schema/ลบ PHP หรือข้อมูลจริง; ตรวจ schema จริงแบบ read-only และ backup/restore ก่อนเปลี่ยนระบบ
3. สร้าง auth/role, data access และ transaction ตาม workflow เดิม แล้วทดสอบกับสำเนาที่แยกจาก production; layout ใช้ MNG ERP โดยไม่เปลี่ยนความหมายข้อมูล
4. ทดสอบ LINE ด้วยบัญชีทดสอบ, การส่งซ้ำ, สิทธิ์และความปลอดภัยก่อนสลับ webhook; ห้ามนำ token มาใส่ Git/แชท
5. Deploy และ cutover ต้องเข้าถึง host ที่ได้รับอนุญาต ตรวจ HTTPS, backup, monitoring, rollback และทดสอบจริง ห้ามแสดงว่า production เสร็จเมื่อยังไม่ได้ deploy

สถานะขณะนี้: ไม่มีการเข้าถึง FTP/Plesk/MySQL จริงจาก workspace และไม่มีการ deploy; Cockpit Next.js ยังคงใช้ข้อมูลเดโม จึงยัง NO-GO สำหรับข้อมูลลูกค้าจริง
