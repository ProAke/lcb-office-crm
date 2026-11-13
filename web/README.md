# web — LCB Office CRM + ERP (Next.js)

ระบบบริหารจัดการร้านยาง/ล้อ (ลูกค้า-สินค้า-บริการ-โปรโมชัน-แชท AI) บน Next.js 15
พัฒนาต่อจากโครงย้ายระบบ PHP เดิม (`office.laemchabanginterautotire.com`)

```bash
npm install
npm run dev     # http://localhost:3000  (เดโม: admin / admin)
```

## โมดูลที่พร้อมใช้

| Route | โมดูล | สิ่งที่ทำได้ |
| --- | --- | --- |
| `/dashboard` | Cockpit | KPI, กราฟรายได้ 6 เดือน, คิววันนี้, งานในศูนย์, โปรที่วิ่งอยู่, เตือนสต็อก/แชท |
| `/customers` | CRM | ค้นหา/กรอง tier, ฟอร์มลูกค้าใหม่, หน้า 360° (`/customers/[id]`) รวมรถ ยอดสะสม งาน การจอง |
| `/products` | สินค้า & บริการ | คลังยาง/ล้อ + บริการศูนย์, กำไรขั้นต้น %, เติม/ตัดสต็อก, เตือนต่ำกว่าจุดสั่งซื้อ |
| `/promotions` | โปรโมชันรายเดือน | สร้าง/เปิด/ปิดโปร, ผูกช่องทาง, กดเผยแพร่ทุกช่องทางจากการ์ดโปร |
| `/service` | ศูนย์บริการ | ปฏิทินนัดหมาย (รวมคิวที่ AI จอง), Kanban ใบงาน 6 ชั้น, ตัดสต็อก+บันทึกยอดลูกค้าเมื่อส่งมอบ |
| `/chat` | AI ตอบแชท | Inbox รวม LINE/Facebook/Web, AI Auto-reply, ปุ่มให้ AI ตอบ, เจ้าหน้าที่แทรกได้ |
| `/publish` | Publishing Hub | เขียนครั้งเดียวกระจาย LINE Broadcast / Facebook / เว็บ + ปุ่มดึงยอด reach/clicks กลับ |
| `/line-rich-menu` | LINE Rich Menu | อ่านรายการจาก LINE, สร้างเมนูพร้อมอัปโหลดภาพ, ตั้งเมนูหลัก และลบเมนู (เฉพาะผู้ดูแลระบบ) |
| `/plan` | แผนย้ายระบบ | เอกสารเทียบ PHP → Next.js |

## API

- `POST /api/webhooks/line` — LINE Messaging API webhook: รับข้อความเข้ากล่องกลาง, ตอบด้วย AI อัตโนมัติเมื่อเปิด AI Auto
- `GET /api/cron/sync` — ดึงยอด reach/clicks จากทุกช่องทางกลับเข้าระบบ (คุมด้วย `CRON_SECRET`)

## ตั้งค่า LINE Rich Menu

กำหนด `LINE_CHANNEL_ACCESS_TOKEN` ของ Messaging API ใน environment ฝั่งเซิร์ฟเวอร์ แล้วรีสตาร์ทแอป หน้า `/line-rich-menu` อ่านและแก้ไขเมนูบน LINE จริง ไม่ได้ใช้ข้อมูลเดโมหรือแก้ schema ของ MySQL ภาพต้องเป็น PNG/JPEG ไม่เกิน 1 MB และมีขนาดตรงกับตัวเลือก 2500 × 1686 หรือ 2500 × 843 ปุ่มแบ่งภาพเป็นแนวตั้งเท่ากัน 1–6 ส่วน โดยแต่ละส่วนส่งข้อความหรือเปิดลิงก์ได้ สร้างเมนูแล้วต้องกดตั้งเป็นเมนูหลักแยกต่างหาก

**ก่อนเปิดใช้งานจริง:** ระบบล็อกอินปัจจุบันยังใช้บัญชีเดโม `admin/admin` และ secret สำรองสำหรับการพัฒนา ต้องเชื่อมระบบยืนยันตัวตนจริง ปิดบัญชีเดโม และตั้ง `AUTH_SECRET` ที่ปลอดภัยก่อน มิฉะนั้นบุคคลอื่นอาจจัดการ LINE account ได้ ฟีเจอร์นี้ยังไม่ได้ออกแบบภาพด้วย AI และยังไม่ได้ทดสอบกับ LINE account จริง

## สถาปัตยกรรม — พร้อมสลับเป็น MySQL เดิม

```
UI (Server Components) → lib/crm/repo.ts → lib/crm/store.ts
                                ▲                 │
                                │          JSON ไฟล์เดโม (data/store.json)
                                │                 │
                                └── เปลี่ยนเป็น query() จาก lib/db.ts
                                    เมื่อตั้งค่า DATABASE_URL (ไม่ต้องแก้ UI)
```

- ตอนนี้ข้อมูลเดโมอยู่ใน `src/lib/crm/seed.ts` โหลด/บันทึกลง `data/store.json`
- เมื่อมีฐานจริง แก้เฉพาะ repo.ts (SELECT/INSERT ตารางเดิม) — หน้าเว็บไม่ต้องแตะ
- token เช่น `LINE_CHANNEL_ACCESS_TOKEN` อยู่ฝั่ง server เท่านั้น

## อัปเกรด AI เป็น LLM

`src/lib/ai/engine.ts` ตอนนี้เป็น intent engine ที่อ่านข้อมูลจริงจากระบบ
(สต็อก/โปร/การจอง) — ฟังก์ชัน `buildShopContext()` เตรียม context ไว้แล้ว
สำหรับส่งให้ OpenAI/Claude เป็น system prompt ตอนอัปเกรด
