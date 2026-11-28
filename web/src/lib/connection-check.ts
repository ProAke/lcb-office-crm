/** Read-only checks. Never return credentials or response bodies to the caller. */
export async function checkLineConnection(token: string | undefined, request: typeof fetch = fetch): Promise<string> {
  if (!token?.trim()) return "ยังไม่ได้ตั้งค่า LINE token บนเซิร์ฟเวอร์";
  try {
    const res = await request("https://api.line.me/v2/bot/info", { headers: { Authorization: `Bearer ${token.trim()}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    return res.ok ? "LINE API ตอบรับ token แล้ว (ยังไม่ได้ทดสอบการส่งหรือ webhook)" : `LINE API ปฏิเสธคำขอ (HTTP ${res.status})`;
  } catch { return "เชื่อมต่อ LINE ไม่สำเร็จ กรุณาตรวจสอบเครือข่ายและการตั้งค่า"; }
}
export async function checkFacebookConnection(pageId: string | undefined, token: string | undefined, request: typeof fetch = fetch): Promise<string> {
  if (!token?.trim() || !pageId?.trim()) return "ยังไม่ได้ตั้งค่า Facebook Page ID และ token บนเซิร์ฟเวอร์";
  if (!/^\d+$/.test(pageId.trim())) return "Facebook Page ID ต้องเป็นตัวเลข";
  try {
    const res = await request(`https://graph.facebook.com/v21.0/${pageId.trim()}?fields=id`, { headers: { Authorization: `Bearer ${token.trim()}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return `Facebook API ปฏิเสธคำขอ (HTTP ${res.status})`;
    const data = await res.json();
    return data?.id === pageId.trim() ? "Facebook API ตอบรับ Page ID แล้ว (ยังไม่ได้ทดสอบการโพสต์)" : "Facebook ตอบกลับไม่ตรงกับ Page ID ที่ตั้งค่า";
  } catch { return "เชื่อมต่อ Facebook ไม่สำเร็จ กรุณาตรวจสอบเครือข่ายและการตั้งค่า"; }
}
