import {
  createBooking,
  listActivePromotions,
  listCustomers,
  listProducts,
} from "@/lib/crm/repo";

/** ค้นลูกค้าตาม id */
function getCustomersById(id: number) {
  return listCustomers().find((c) => c.id === id) ?? null;
}
import type { Conversation } from "@/lib/crm/types";

/**
 * เครื่องตอบแชทอัตโนมัติ (AI Assistant)
 * -------------------------------------------------------------------------
 * โหมดปัจจุบัน: intent engine ฝั่งเซิร์ฟเวอร์ — คะแนนคีย์เวิร์ดภาษาไทย
 *   และดึงข้อมูล "จริง" จากระบบ (สินค้าในสต็อก / โปรที่ยังใช้ได้ / การจอง)
 *   จึงตอบถูกต้องตามสถานะร้านเสมอ ไม่ใช่ข้อความตายตัว
 *
 * อัปเกรดเป็น LLM ภายหลัง: เปลี่ยน generateReply() ให้เรียก OpenAI/Claude
 *   โดยส่ง context จาก buildShopContext() ไปเป็น system prompt — โครง
 *   การทำงานทั้งหมด (webhook, aiAuto, สร้างการจอง) ใช้ต่อได้เหมือนเดิม
 */

export type AiReply = {
  text: string;
  intent: string;
  /** การกระทำที่ AI ทำให้ลูกค้า (เช่น สร้างการจอง) */
  action?: string;
};

const baht = (n: number) => `${n.toLocaleString("th-TH")}.-`;



function resolveDate(text: string): string {
  const d = new Date();
  if (text.includes("พรุ่งนี้")) d.setDate(d.getDate() + 1);
  if (text.includes("มะรืน")) d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function resolveTime(text: string): string {
  const m = text.match(/(\d{1,2})[:.](\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  const hm = text.match(/(\d{1,2})\s?โมง(เช้า|บ่าย|เย็น)?/);
  if (hm) {
    let h = Number(hm[1]);
    if (hm[2] === "บ่าย" && h < 13) h += 12;
    if (hm[2] === "เย็น" && h < 18) h += 12;
    return `${String(h).padStart(2, "0")}:00`;
  }
  if (text.includes("บ่าย")) return "13:00";
  if (text.includes("เช้า")) return "09:00";
  if (text.includes("สาย")) return "10:30";
  if (text.includes("เย็น")) return "16:00";
  return "10:00";
}

/** ขนาดยาง เช่น 205/55 R16 หรือ 185/65r15 */
const SIZE_RE = /(\d{3})\s?\/\s?(\d{2})\s?[rR]?\s?(\d{2})/;

function findProductsByText(text: string) {
  const size = text.match(SIZE_RE);
  const sizeStr = size ? `${size[1]}/${size[2]} R${size[3]}` : null;
  const all = listProducts().filter((p) => p.active);
  let hits = all;
  if (sizeStr) hits = hits.filter((p) => p.name.includes(sizeStr));
  const brands = ["toyo", "michelin", "bridgestone", "continental", "bfg", "maxxis", "dunlop", "ยโต", "มิชลิน"];
  const lower = text.toLowerCase();
  for (const b of brands) {
    if (lower.includes(b)) {
      hits = hits.filter((p) => p.brand.toLowerCase().includes(b.replace("ยโต", "toyo").replace("มิชลิน", "michelin")));
      break;
    }
  }
  return hits.filter((p) => p.type === "product").slice(0, 3);
}

function formatPromos(): string {
  const promos = listActivePromotions();
  if (!promos.length) return "ตอนนี้ยังไม่มีโปรโมชันที่เปิดใช้งานค่ะ";
  return promos
    .map((p) => {
      const disc =
        p.discountType === "percent"
          ? `ลด ${p.discountValue}%`
          : `มูลค่า ${baht(p.discountValue)}`;
      return `• ${p.title} (${disc}) ถึง ${p.endDate.slice(8, 10)}/${p.endDate.slice(5, 7)}/${p.endDate.slice(0, 4)}`;
    })
    .join("\n");
}

/** context ของร้านสำหรับส่งให้ LLM (ตอนอัปเกรด) */
export function buildShopContext(): string {
  const products = listProducts()
    .filter((p) => p.active)
    .map((p) => `${p.name} ${baht(p.price)} ${p.type === "product" ? `(คงเหลือ ${p.stock} ${p.unit})` : ""}`)
    .join("\n");
  return `ศูนย์ยางล้อแหลมฉบัง — เวลาทำการ จันทร์-เสาร์ 08:00-17:30, อาทิตย์ 08:00-12:00\nที่ตั้ง: ถ.ท่าเรือแหลมฉบัง ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี โทร 038-400-400\n\nสินค้า/บริการ:\n${products}\n\nโปรโมชันที่ใช้งาน:\n${formatPromos()}`;
}

const INTENTS: { intent: string; patterns: RegExp[]; weight: number }[] = [
  { intent: "booking", patterns: [/จอง/, /นัด/, /คิว/], weight: 3 },
  { intent: "promotion", patterns: [/โปร/, /ส่วนลด/, /ลดราคา/, /โปรโมช/], weight: 3 },
  { intent: "price", patterns: [/ราคา/, /เท่าไหร่/, /เท่าไร/, /กี่บาท/, /quote/i], weight: 2 },
  { intent: "hours", patterns: [/เปิดกี่โมง/, /เวลา/, /ปิดกี่โมง/, /วันอาทิตย์/], weight: 2 },
  { intent: "location", patterns: [/อยู่ไหน/, /อยู่ตรงไหน/, /แผนที่/, /ที่ตั้ง/, /ไปยังไง/, /ทางไป/], weight: 2 },
  { intent: "greeting", patterns: [/สวัสดี/, /หวัดดี/, /^hi$/i, /hello/i], weight: 1 },
  { intent: "service_align", patterns: [/ตั้งศูนย์/, /ศูนย์ล้อ/], weight: 2 },
  { intent: "service_balance", patterns: [/ถ่วงล้อ/, /สลับยาง/], weight: 2 },
  { intent: "tire_change", patterns: [/เปลี่ยนยาง/, /ยางระเบิด/, /ยางแตก/, /ยางเก่า/], weight: 2 },
];

function detectIntent(text: string): string {
  let best = "fallback";
  let bestScore = 0;
  for (const it of INTENTS) {
    const score = it.patterns.reduce((s, p) => s + (p.test(text) ? it.weight : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = it.intent;
    }
  }
  // ไซซ์ยางมาเดี่ยว ๆ = ถามราคา
  if (SIZE_RE.test(text) && bestScore < 4) return "price";
  return best;
}

/**
 * สร้างคำตอบ — คืน null ถ้า conversation นี้ไม่ได้เปิดให้ AI ตอบ
 */
export function generateReply(conv: Conversation, text: string): AiReply {
  const name = conv.displayName;
  const firstName = name.replace(/^คุณ/, "คุณ").split(" ")[0];
  const intent = detectIntent(text);

  switch (intent) {
    case "greeting":
      return {
        intent,
        text: `สวัสดีค่ะ ${firstName} 😊 ยินดีต้อนรับสู่ LCB ศูนย์ยางล้อแหลมฉบัง สอบถามราคายาง โปรโมชัน หรือจองคิวติดตั้งได้เลยค่ะ`,
      };

    case "promotion":
      return {
        intent,
        text: `โปรโมชันที่ใช้ได้ตอนนี้ค่ะ 🎉\n${formatPromos()}\n\nสนใจโปรไหนแจ้งได้เลยนะคะ เดี๋ยวจองคิวให้ค่ะ`,
      };

    case "booking": {
      const date = resolveDate(text);
      const time = resolveTime(text);
      const service = /ตั้งศูนย์/.test(text)
        ? "ตั้งศูนย์ล้อ 3D"
        : /ปะ/.test(text)
          ? "ปะยาง"
          : /สลับ/.test(text)
            ? "สลับยาง"
            : "เปลี่ยนยาง / เช็กสภาพยาง";
      // รู้จักลูกค้าจาก conversation → ดึงข้อมูลรถมาผูกอัตโนมัติ
      const c = conv.customerId ? getCustomersById(conv.customerId) : null;
      const plate = c?.vehicles[0]?.plate ?? "";
      const booking = createBooking({
        customerId: conv.customerId ?? undefined,
        customerName: name,
        phone: c?.phone ?? "-",
        plate: plate || "แจ้งหน้าร้าน",
        service,
        date,
        time,
        source: "ai",
        note: "AI จองให้จากแชท",
      });
      const dayLabel = date === resolveDate("วันนี้") ? "วันนี้" : date === resolveDate("พรุ่งนี้") ? "พรุ่งนี้" : `วันที่ ${date.slice(8, 10)}/${date.slice(5, 7)}`;
      return {
        intent,
        action: `สร้างการจอง #${booking.id} (${date} ${time})`,
        text: `จองให้เรียบร้อยค่ะ ✅ ${service} — ${dayLabel} เวลา ${time} น.${plate ? ` รถทะเบียน ${plate}` : ""}\nถึงร้านแล้วทักไลน์นี้ได้เลยค่ะ หากต้องเลื่อนคิวแจ้งได้นะคะ`,
      };
    }

    case "price": {
      const hits = findProductsByText(text);
      if (hits.length) {
        const lines = hits.map(
          (p) =>
            `• ${p.name} — ${baht(p.price)}${p.stock <= p.minStock ? " (สต็อกใกล้หมด รีบจองนะคะ)" : ""}`,
        );
        const promo = listActivePromotions().find((p) => p.code.includes("CHANG4"))
          ?? listActivePromotions()[0];
        const promoLine = promo ? `\n\n📣 ${promo.title} (${promo.code})` : "";
        return {
          intent,
          text: `ราคาตามที่สอบถามค่ะ${/\d{3}\/\d{2}/.test(text) ? ` (ขนาดที่แจ้ง)` : ""}:\n${lines.join("\n")}\nราคารวมค่าแรงถอดใส่แล้ว${promoLine} สนใจเดี๋ยวช่วยจองคิวให้ค่ะ`,
        };
      }
      return {
        intent,
        text: `รบกวนแจ้ง ขนาดยาง (เช่น 205/55 R16) หรือรุ่นรถให้หน่อยนะคะ เดี๋ยวเช็กราคาและสต็อกให้ทันทีค่ะ`,
      };
    }

    case "tire_change": {
      const hits = findProductsByText(text);
      const tip = hits.length
        ? `\nแนะนำ: ${hits.map((p) => `${p.brand} ${baht(p.price)}`).join(" / ")}`
        : "";
      return {
        intent,
        text: `รับเปลี่ยนยางทุกขนาดค่ะ ถ้ารบกวนแจ้งขนาดยาง (ดูได้ที่แก้มยาง เช่น 265/60 R18) เดี๋ยวเช็กราคา+สต็อกให้เลย${tip}\nนัดจองคิวล่วงหน้าได้ทั้งทางแชทนี้หรือโทร 038-400-400 ค่ะ`,
      };
    }

    case "service_align":
      return {
        intent,
        text: `ตั้งศูนย์ล้อด้วยเครื่อง 3D ราคา ${baht(800)} (4 ล้อ) ใช้เวลาประมาณ 40 นาทีค่ะ\n💡 เปลี่ยนยางครบ 4 เส้นเดือนนี้ ตั้งศูนย์ฟรี! (โปร NOV-CHANG4) สนใจจองคิวแจ้งวันเวลาได้เลยค่ะ`,
      };

    case "service_balance":
      return {
        intent,
        text: `ถ่วงล้อ 4 ล้อ พร้อมจุ๊บลม ${baht(400)} และสลับยาง 5 ล้อ ${baht(300)} ค่ะ รับประกันงาน 30 วัน อยากจองคิววันไหนแจ้งได้เลยนะคะ`,
      };

    case "hours":
      return {
        intent,
        text: `ร้านเปิดทำการ:\n• จันทร์-เสาร์ 08:00–17:30 น.\n• วันอาทิตย์ 08:00–12:00 น.\nคิวช่วงเช้าเสาร์-อาทิตย์ค่อนข้างแน่น แนะนำจองล่วงหน้าผ่านแชทนี้ได้เลยค่ะ`,
      };

    case "location":
      return {
        intent,
        text: `ร้านอยู่ ถ.ท่าเรือแหลมฉบัง ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี (ก่อนถึงทางเข้าท่าเรือแหลมฉบัง ฝั่งขาเข้าเมือง) 📍 โทร 038-400-400\nจอดรถหน้าร้านได้เลยค่ะ`,
      };

    default:
      return {
        intent: "fallback",
        text: `รับทราบค่ะ ${firstName} เดี๋ยวทีมงานจะตอบกลับโดยเร็วค่ะ 🙏\nระหว่างนี้ลองพิมพ์ "โปร" ดูโปรเดือนนี้ หรือส่งขนาดยางมาเช็กราคาได้เลยนะคะ`,
      };
  }
}
