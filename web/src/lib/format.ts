/** ฟอร์แมตตัวเลข/วันที่ภาษาไทย ใช้ร่วมกันทั้งแอป */
export const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

/** "2026-11-09" → "9 พ.ย. 2569" */
export function thDate(iso: string) {
  const month = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${month[(m ?? 1) - 1]} ${(y ?? 0) + 543}`;
}

/** "2026-06" → "มิ.ย." */
export function thMonthShort(ym: string) {
  const m = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return m[Number(ym.slice(5, 7)) - 1] ?? ym;
}

/** ISO datetime → "09:24 น." */
export function thTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} น.`;
}

export const TIER_LABEL: Record<string, { label: string; cls: string }> = {
  vip: { label: "VIP", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  regular: { label: "ทั่วไป", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  new: { label: "ใหม่", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

export const CHANNEL_LABEL: Record<string, string> = {
  line: "LINE OA",
  facebook: "Facebook",
  web: "เว็บไซต์",
};
