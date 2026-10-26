import type { Metadata } from "next";

export const metadata: Metadata = { title: "แผนย้ายระบบ PHP → Next.js" };

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-[#0b1a2a] p-4 text-[12.5px] leading-relaxed text-[#d6e4f0]">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-baseline gap-2 text-base font-semibold">
        <span className="rounded-md bg-brand-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink/85">
        {children}
      </div>
    </section>
  );
}

const MAP_ROWS: [string, string, string][] = [
  ["authentication/index.php", "หน้า login PHP ธรรมดา", "app/login/page.tsx + actions.ts (Server Action)"],
  ["authentication/login-process.php", "รับ $_POST, set $_SESSION", "ฟังก์ชัน loginAction() ไม่มี URL ให้ยิงตรง"],
  ["includes/config.php", "ค่า DB host/user/pass", ".env + lib/db.ts"],
  ["includes/header.php + footer.php", "include ทุกหน้า", "app/(app)/layout.tsx"],
  ["includes/session-check.php", "if (!$_SESSION) redirect", "middleware.ts + layout guard"],
  ["dashboard/index.php", "หน้าแรกหลังล็อกอิน", "app/(app)/dashboard/page.tsx"],
  ["module/index.php?action=edit&id=5", "GET param + include switch", "app/(app)/module/[id]/edit/page.tsx"],
  ["module/save.php (POST)", "ฟอร์มยิง PHP แล้ว redirect", "Server Action + revalidatePath() + redirect()"],
  ["api/ajax-list.php (JSON)", "DataTables ดึงข้อมูล", "Route Handler app/api/…/route.ts หรืออ่าน DB ใน Server Component"],
  ["upload.php (move_uploaded_file)", "เก็บไฟล์ใน public_html", "Route Handler + object storage (S3/R2) หรือดิสก์บน VPS"],
  ["logout.php", "session_destroy", "destroySession() + redirect('/login')"],
  ["cron/line-sync.php", "เรียกด้วย cron ทุก 5 นาที", "app/api/cron/line-sync/route.ts + cron ของ hosting"],
  [".htaccess (rewrite, deny)", "คุม URL และสิทธิ์ไฟล์", "next.config.ts (rewrites/headers) + middleware"],
];

const CHECKLIST: [string, string][] = [
  [
    "ระบบล็อกอิน & session",
    "PHP ใช้ session_start()/$_SESSION ซึ่งแชร์กันไม่ได้กับ Node → เปลี่ยนเป็น signed cookie (JWT) หรือ Auth.js และต้องรองรับ hash เดิม (ตรวจว่าใช้ password_hash/bcrypt หรือ md5)",
  ],
  [
    "สิทธิ์ผู้ใช้ (role/permission)",
    "ย้ายลอจิก if($_SESSION['role']=='admin') มาเป็น middleware + ฟังก์ชัน can(user, action) จุดเดียว เพื่อไม่ให้กระจัดกระจายเหมือนเดิม",
  ],
  [
    "SQL ทั้งหมด",
    "เปลี่ยน mysql_query/PDO เป็น Prisma (หรือ Drizzle/Kysely) — SQL injection หายไปเพราะ parameterized โดยค่าเริ่มต้น",
  ],
  [
    "ฟอร์มและ AJAX",
    "ฟอร์ม POST ที่ยิงไฟล์ .php ต้องเปลี่ยนเป็น Server Actions หรือ /api route และ DataTables/ jQuery → ตารางฝั่งเซิร์ฟเวอร์ (searchParams) หรือ TanStack Table",
  ],
  [
    "อัปโหลดไฟล์และรูปสินค้า",
    "ที่เก็บไฟล์เดิมอยู่ใน public_html ซึ่ง Next.js บน Vercel ไม่มีดิสก์ถาวร → ย้ายไป S3/R2 หรือเก็บไว้บน VPS เดิมแล้วเสิร์ฟผ่าน Nginx",
  ],
  [
    "ส่งออกรายงาน PDF / Excel",
    "FPDF/mPDF/PHPExcel ใช้บน Node ไม่ได้ → ใช้ @react-pdf หรือ puppeteer (PDF) และ exceljs (Excel) พร้อมฝังฟอนต์ไทย (Sarabun/Noto Sans Thai)",
  ],
  [
    "อีเมลและ LINE",
    "mail()/PHPMailer → SMTP ผ่าน nodemailer หรือ Resend; LINE Messaging API เรียกด้วย fetch ฝั่งเซิร์ฟเวอร์เท่านั้น (ซ่อน token)",
  ],
  [
    "งานเบื้องหลัง / cron",
    "สคริปต์ที่ถูกเรียกด้วย cron ต้องแปลงเป็น Route Handler + ตัวเรียก cron ของ platform และควรมี secret header กันคนนอกยิง",
  ],
  [
    "ภาษาไทยและ encoding",
    "ตรวจว่าตารางเดิมเป็น utf8mb4 (ไม่ใช่ utf8 แบบ 3 ไบต์) และตั้ง connection charset ให้ตรง ไม่งั้นชื่อไทย/อีโมจิจะเพี้ยน",
  ],
  [
    "ดีploy และโดเมน",
    "ต้องมี Node runtime (VPS + Docker/PM2 หรือ Vercel) ควบคู่กับ MySQL เดิม และวาง reverse proxy เพื่อให้ PHP กับ Next.js อยู่ระหว่างการย้ายพร้อมกันได้",
  ],
];

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Migration blueprint
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight lg:text-2xl">
          ย้ายระบบจาก PHP → Next.js (ใช้ฐานข้อมูลเดิม)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          เอกสารนี้สรุปว่า “หลังบ้าน PHP เดิมมีอะไร” และ “เมื่อเป็น Next.js
          ต้องแก้อะไร” โดยยึดหลักว่า <strong>โครงสร้างฐานข้อมูล MySQL เดิมไม่เปลี่ยน</strong>{" "}
          เพื่อให้ข้อมูลเก่าและโปรแกรมอื่นที่อ่านฐานเดียวกันทำงานต่อได้
        </p>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
        <strong>ข้อจำกัดที่ต้องทราบก่อน:</strong> ผมเข้าถึงได้เฉพาะหน้าเว็บสาธารณะ
        (หน้า login และหน้า 404) จากภายนอก — เข้า FTP/SSH และล็อกอินหลังบ้านไม่ได้จาก
        สภาพแวดล้อมนี้ จึงยังไม่เห็นโค้ด PHP จริงและโครงสร้างตารางจริง
        ข้อสรุปด้านล่างจึงอ้างอิงจากสิ่งที่ตรวจได้ + รูปแบบมาตรฐานของระบบ PHP
        ที่ใช้เทมเพลต AdminLTE ซึ่งจะยืนยันอีกครั้งเมื่อได้รับซอร์สโค้ด
      </div>

      <Section n="1" title="สิ่งที่ตรวจได้จากระบบเดิมตอนนี้">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            หน้าแรก redirect ไปที่{" "}
            <code className="rounded bg-surface px-1">/authentication/index.php</code>{" "}
            → ระบบแยกโฟลเดอร์ตามโมดูล และแต่ละโฟลเดอร์มี <code>index.php</code> เป็นตัวหลัก
          </li>
          <li>
            มีหน้า <code>/authentication/reset-password.php</code> → มีระบบลืมรหัสผ่าน/รีเซ็ตรหัส
          </li>
          <li>
            ทรัพยากรอยู่ใต้ <code>/dist/img/…</code> → ใช้เทมเพลตแบบ AdminLTE
            (Bootstrap + jQuery) ซึ่งเป็นที่นิยมในระบบ PHP สำนักงาน
          </li>
          <li>
            หน้า 404 เป็นเทมเพลต “Server Error / Page Not Found” → มีตัวจัดการ error
            ของตัวเอง (ไม่ได้เปิด error ดิบของ PHP ออกมา ซึ่งดี)
          </li>
          <li>
            มีเมนู <strong>LINE Rich Menu Management</strong> → ระบบเชื่อม LINE
            Messaging API และมีตารางเก็บ rich menu/พื้นที่ปุ่มอยู่ในฐานข้อมูล
          </li>
        </ul>
        <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted">
          สิ่งที่ยังไม่รู้และต้องดูจากซอร์ส: ชื่อตารางและคอลัมน์จริง, วิธีแฮชรหัสผ่าน,
          ฟิลด์สิทธิ์ผู้ใช้, การเก็บไฟล์อัปโหลด, ไลบรารีที่ใช้ (FPDF/Excel/PHPMailer),
          และ cron ที่รันอยู่
        </p>
      </Section>

      <Section n="2" title="โครงสร้างไฟล์ PHP → ตำแหน่งใน Next.js">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="border border-line px-3 py-2 font-medium">ของเดิม (PHP)</th>
                <th className="border border-line px-3 py-2 font-medium">บทบาท</th>
                <th className="border border-line px-3 py-2 font-medium">ของใหม่ (Next.js)</th>
              </tr>
            </thead>
            <tbody>
              {MAP_ROWS.map(([old, role, next]) => (
                <tr key={old} className="align-top">
                  <td className="border border-line px-3 py-2 font-mono text-[12px] text-brand-700">
                    {old}
                  </td>
                  <td className="border border-line px-3 py-2 text-muted">{role}</td>
                  <td className="border border-line px-3 py-2 font-mono text-[12px]">
                    {next}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          หลักคิด: 1 ไฟล์ PHP ที่รวมทั้ง “ตรวจสิทธิ์ + query + HTML” ถูกแยกเป็น 3 ชั้น
          — route (page.tsx), ลอจิก (lib/ หรือ actions.ts), และ UI component
        </p>
      </Section>

      <Section n="3" title="โค้ดเทียบกันจริง (ก่อน / หลัง)">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          ก. การล็อกอินและ session
        </p>
        <Code>{`// เดิม: authentication/login-process.php
session_start();
$row = $pdo->query("SELECT * FROM users WHERE email = '$email'")->fetch();
if ($row && password_verify($pass, $row['password'])) {
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['role']    = $row['role'];
    header('Location: ../dashboard/index.php');
}

// ใหม่: app/login/actions.ts  (Server Action)
const user = await prisma.user.findUnique({ where: { email } });
if (user && (await bcrypt.compare(password, user.passwordHash))) {
  await createSession(user);   // เซ็น JWT ใส่ httpOnly cookie
  redirect("/dashboard");
}`}</Code>

        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          ข. การดึงข้อมูลมาแสดง
        </p>
        <Code>{`// เดิม: module/index.php
$sql = "SELECT * FROM customers WHERE name LIKE '%$q%' ORDER BY id DESC LIMIT 20";
foreach ($pdo->query($sql) as $r) { echo "<tr><td>{$r['name']}</td></tr>"; }

// ใหม่: app/(app)/customers/page.tsx  (Server Component)
const customers = await prisma.customer.findMany({
  where: { name: { contains: q } },
  orderBy: { id: "desc" },
  take: 20,
});
return <Table rows={customers} />;`}</Code>

        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          ค. ฟอร์มบันทึก + ป้องกัน CSRF
        </p>
        <Code>{`// เดิม: module/save.php?action=update  (ต้องมี token กัน CSRF เอง)
if ($_POST['token'] !== $_SESSION['csrf']) die('CSRF');

// ใหม่: ฟอร์มยิง Server Action ตรง — Next ตรวจ Origin/Host ให้
// และไม่ต้องมี endpoint รับ POST แยกให้คนนอกยิงเล่น
<form action={updateCustomer}>
  <input name="name" />
</form>`}</Code>
      </Section>

      <Section n="4" title="ฐานข้อมูลเดิม: ต้องทำอะไรกับมัน">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <p className="text-xs font-semibold text-emerald-800">ไม่ต้องทำ</p>
            <ul className="mt-1.5 list-disc pl-4 text-xs leading-relaxed text-emerald-900/85">
              <li>ไม่ต้องย้ายข้อมูล / ไม่ต้อง import ดัมป์</li>
              <li>ไม่ต้องเปลี่ยนชื่อตารางหรือคอลัมน์</li>
              <li>ไม่ต้อง stop ระบบ PHP เดิมในทันที</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="text-xs font-semibold text-amber-900">ต้องทำ</p>
            <ul className="mt-1.5 list-disc pl-4 text-xs leading-relaxed text-amber-950/85">
              <li>
                <code>prisma db pull</code> เพื่อสร้าง schema จากฐานจริง
                (อ่านอย่างเดียว ไม่แก้อะไร)
              </li>
              <li>ตรวจ charset เป็น utf8mb4 + timezone ให้ตรงกับ PHP เดิม</li>
              <li>ตรวจวิธีแฮชรหัสผ่านเดิม เพื่อให้ล็อกอินด้วยรหัสเดิมได้</li>
              <li>ถ้าจะเพิ่มตาราง (audit log, session) ให้ใช้ prefix ใหม่ ไม่ทับของเดิม</li>
            </ul>
          </div>
        </div>
        <p>
          ทั้ง PHP และ Next.js จะชี้ไปที่ฐานข้อมูลเดียวกันได้ในช่วงเปลี่ยนผ่าน
          แต่ต้องระวัง 2 เรื่อง: (1) อย่าให้สองระบบเขียนตารางเดียวกันพร้อมกันในตรรกะที่ขัดกัน
          และ (2) ถ้าฐานข้อมูลอยู่บน shared hosting ต้องเปิด allow remote MySQL
          หรือวาง Next.js ไว้บนเครื่องเดียวกับ MySQL
        </p>
      </Section>

      <Section n="5" title="สิ่งที่ต้องแก้จริง ๆ — เช็กลิสต์ 10 ข้อ">
        <ol className="space-y-2.5">
          {CHECKLIST.map(([title, detail], i) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-[13px] leading-relaxed text-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section n="6" title="ทางเลือกการติดตั้ง (เลือกก่อนเริ่มงาน)">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="font-medium">A. VPS / hosting ที่มี Node (แนะนำ)</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-muted">
              <li>วาง Nginx หน้า แล้วแยก path: PHP เดิมยังอยู่ / ส่วนที่ย้ายแล้วชี้ไป Next.js</li>
              <li>ย้ายทีละโมดูลได้ ไม่ต้องปิดระบบ</li>
              <li>ไฟล์อัปโหลดเก็บดิสก์เดิมได้ ง่ายต่อการย้าย</li>
              <li>รันด้วย Docker + PM2; ฐานข้อมูลอยู่เครื่องเดิมได้เลย</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="font-medium">B. Vercel (Managed)</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-muted">
              <li>เร็ว ไม่ต้องดูแลเซิร์ฟเวอร์ แต่ต้องเปิด MySQL ให้เข้าจากภายนอก (หรือใช้ PlanetScale/RDS)</li>
              <li>ไม่มีดิสก์ถาวร → ต้องย้ายไฟล์อัปโหลดไป S3/R2</li>
              <li>cron ใช้ของ Vercel ได้ แต่มีลิมิตเวลา</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section n="7" title="แผนงาน (ประมาณ)">
        <div className="space-y-2 text-[13px]">
          {[
            ["ระยะ 1", "ตรวจซอร์ส PHP + ฐานข้อมูล แล้วสรุป mapping ตาราง/หน้าจอ", "2–3 วัน"],
            ["ระยะ 2", "วางโครง Next.js: auth, สิทธิ์, layout, Prisma schema จาก DB จริง", "3–4 วัน"],
            ["ระยะ 3", "ย้ายโมดูลหลักทีละตัว (เรียงตามการใช้งานจริง เช่น ลูกค้า → เอกสาร → รายงาน)", "1–2 สัปดาห์"],
            ["ระยะ 4", "ทดสอบเทียบผลกับ PHP ตัวเก่า (ตัวเลข report ต้องตรง) + สอนผู้ใช้", "3–5 วัน"],
            ["ระยะ 5", "Cutover ด้วย reverse proxy และเก็บ PHP เดิมไว้อ่านอย่างเดียว 1 เดือน", "1–2 วัน"],
          ].map(([phase, work, time]) => (
            <div
              key={phase}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
            >
              <span className="font-medium text-brand-700">{phase}</span>
              <span className="min-w-0 flex-1 px-2 text-muted">{work}</span>
              <span className="rounded bg-surface px-2 py-0.5 text-[11px] text-muted">
                {time}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section n="8" title="สิ่งที่ต้องส่งมาเพื่อเริ่มงานจริง">
        <ul className="list-decimal space-y-1.5 pl-5">
          <li>
            <strong>ซอร์สโค้ด PHP ทั้งหมด</strong> — zip ทั้งโฟลเดอร์เว็บ (หรือ{" "}
            <code>git clone</code> เข้า repo นี้) วิธีนี้ใช้ได้ดีกว่า FTP เพราะผมเข้า FTP
            จากสภาพแวดล้อมนี้ไม่ได้
          </li>
          <li>
            <strong>โครงสร้างฐานข้อมูล</strong> —{" "}
            <code>mysqldump --no-data</code> หรือไฟล์ .sql ที่ไม่มีข้อมูลจริง/ข้อมูลส่วนบุคคล
          </li>
          <li>
            <strong>ตัวอย่างไฟล์ config</strong> ที่ปิดรหัสผ่านแล้ว (เพื่อดูชื่อ DB, timezone, path อัปโหลด)
          </li>
          <li>
            <strong>รายการ cron / งานอัตโนมัติ</strong> ที่รันอยู่ และตัวเลือกโฮสติ้ง (A หรือ B ในข้อ 6)
          </li>
        </ul>
        <p className="rounded-lg bg-brand-500/8 px-3 py-2 text-xs text-brand-800">
          เมื่อได้ข้อ 1–2 แล้ว ผมจะ<a className="underline" href="/dashboard">ต่อ Prisma เข้ากับ schema จริง</a>{" "}
          และเริ่มย้ายโมดูลแรกให้เห็นผลได้ทันที
        </p>
      </Section>
    </div>
  );
}
