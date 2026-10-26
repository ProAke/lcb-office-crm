# วิธีส่งซอร์ส PHP เดิมมาให้ตรวจ (แทนการเข้า FTP)

## ทำไมใช้ FTP จากที่นี่ไม่ได้

ผมลองเชื่อมต่อ `203.146.252.149:21` แล้วจากสภาพแวดล้อมที่ผมทำงานอยู่:

```
TCP connect : 21  → ต่อได้ (handshake ผ่าน NAT/proxy)
FTP greeting      → ว่างเปล่า (ไม่มีข้อความ 220 ตอบกลับ)
curl              → (56) response reading failed
```

แปลว่า sandbox นี้ **เปิด outbound เฉพาะโดเมนที่อนุญาต** (github.com, registry.npmjs.org, pypi.org)
การเชื่อมต่ออื่นถูกตัดกลางทาง แม้ TCP จะต่อติดก็ไม่มีข้อมูลวิ่งกลับมา
จึงไม่ได้เป็นปัญหาเรื่องรหัสผ่านหรือ firewall ฝั่งโฮสต์ของคุณ

> 🔐 **แนะนำให้เปลี่ยนรหัส FTP / cPanel ชุดนี้ทันที** เพราะถูกส่งมาในแชทแล้ว
> (ผมไม่บันทึกลงไฟล์ใด ๆ ในโปรเจกต์ และจะไม่ใช้มัน)

## วิธีที่แนะนำ: ส่งไฟล์เข้า repo นี้หรือแนบในแชท

### ทางเลือก A — อัปโหลด zip เข้าแชท (ง่ายที่สุด)

1. เปิด cPanel → **File Manager** → เข้า `public_html`
2. เลือกโฟลเดอร์เว็บ (ทั้งโฟลเดอร์) → คลิกขวา → **Compress** → ได้ `public_html.zip` หรือ `backup.zip`
3. ดาวน์โหลดไฟล์นั้น แล้ว **แนบไฟล์ในแชทนี้**

### ทางเลือก B — วางไฟล์บน GitHub ให้ผม clone

1. สร้าง repo **private** ของคุณเอง แล้ว push โค้ด PHP ขึ้นไป
2. แจ้ง URL มาในแชท (ต้องเป็น repo ที่บัญชี GitHub ที่เชื่อมกับ Arena เข้าถึงได้)

### ทางเลือก C — commit เข้า repo นี้โดยตรง

```bash
# บนเครื่องของคุณ
git clone https://github.com/ProAke/lcb-office-crm.git
cd lcb-office-crm
mkdir -p incoming && cd incoming
unzip ~/Downloads/public_html.zip -d php-source
cd ../.. && git add incoming && git commit -m "add legacy PHP source" && git push
```

## ต้องส่งอะไรมาบ้าง

| ต้องส่ง | ทำไม | วิธีเอา |
| --- | --- | --- |
| ซอร์สโค้ดเว็บ (ทั้งโฟลเดอร์) | ตรวจโครงสร้าง/ลอจิกจริงทั้งหมด | zip จาก File Manager |
| โครงสร้างฐานข้อมูล | ตรวจชื่อตาราง/คอลัมน์/ดัชนี/charset | phpMyAdmin → Export → **Custom** → เลือก *Structure only* (ไม่มีข้อมูล) |
| รายการ cron / งานอัตโนมัติ | ต้องแปลงเป็น route handler | cPanel → Cron Jobs (screenshot หรือ copy ข้อความ) |
| ตัวอย่าง `config.php` | ดูชื่อ DB, timezone, path อัปโหลด | **ปิดรหัสผ่านก่อนส่ง** (แทนด้วย `xxx`) |
| เวอร์ชัน PHP + MySQL | เลือกวิธี deploy ให้ตรง | cPanel → MultiPHP Manager / phpMyAdmin |

## สิ่งที่ **ไม่ควร** ส่งมา

- ไฟล์ที่มีข้อมูลลูกค้าจริง (`.sql` ที่มีข้อมูล, export Excel, ใบกำกับภาษี)
- รหัสผ่านจริงในไฟล์ config (แก้เป็น `xxxxx` ก่อน)
- ไฟล์ `.env`, private key, channel access token ของ LINE
- โฟลเดอร์ `vendor/` ถ้าใหญ่มาก (บอกชื่อไลบรารีใน `composer.json` แทนได้)

ถ้าซอร์สอยู่ใน repo git อยู่แล้ว การส่ง `.git` มาก็มีประโยชน์ (ดูประวัติการแก้ไข) แต่ไม่จำเป็น

## เมื่อได้ไฟล์แล้ว ผมจะทำอะไรให้ทันที

```bash
node tools/inspect-php-source.mjs incoming/php-source --out docs/php-source-report.md
```

สคริปต์นี้ (อยู่ใน repo แล้ว) จะสร้างรายงานอัตโนมัติ:

- รายชื่อ **entry point** ทุกไฟล์ที่ต้องแปลงเป็น route
- **ตาราง/คอลัมน์** ที่โค้ดอ้างถึง (สำหรับยืนยันกับ `SHOW TABLES`)
- ทุกจุดที่ใช้ `$_SESSION`, ตรวจสิทธิ์, `include header/footer`
- วิธีแฮชรหัสผ่าน (จะรู้ว่าล็อกอินด้วยรหัสเดิมได้หรือไม่)
- จุดที่ต่อสตริง SQL (ความเสี่ยง SQL injection), `move_uploaded_file`, `mail()`, FPDF/Excel, LINE API
- ฟอร์ม → action ที่ต้องแปลงเป็น Server Action
- ไฟล์ที่มี credential ฝังอยู่ (รายงานแค่ตำแหน่ง ไม่พิมพ์ค่า)

จากรายงานนี้ผมจะทำ mapping ทีละไฟล์ และเริ่มย้าย authentication → dashboard
ให้ต่อกับฐานข้อมูลจริงเป็นโมดูลแรก
