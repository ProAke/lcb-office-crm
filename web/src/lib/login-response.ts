/** Convert unexpected proxy/WAF responses into safe, actionable messages. */
export async function loginResponse(response: Response): Promise<{ ok: boolean; error?: string }> {
  const type = response.headers.get("content-type") || "";
  if (type.toLowerCase().includes("application/json")) {
    try {
      const data: unknown = await response.json();
      if (response.ok && data && typeof data === "object" && "ok" in data && data.ok === true) return { ok: true };
      if (!response.ok && data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error.length <= 300) return { ok: false, error: data.error };
    } catch { /* A proxy may return malformed JSON. */ }
  }
  if (response.status === 403) return { ok: false, error: "คำขอเข้าสู่ระบบถูกปฏิเสธ (403) กรุณาแจ้งผู้ดูแลตรวจสอบระบบความปลอดภัยของโฮสต์" };
  if (response.status === 429) return { ok: false, error: "มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" };
  return { ok: false, error: "ระบบเข้าสู่ระบบตอบกลับผิดปกติ กรุณาลองใหม่หรือติดต่อผู้ดูแล" };
}
