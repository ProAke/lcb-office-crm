import { nextId, readStore, writeStore } from "./store";
import type {
  Booking,
  BookingStatus,
  ChannelName,
  ChannelPost,
  Conversation,
  Customer,
  JobOrder,
  JobStatus,
  Product,
  Promotion,
  Tier,
} from "./types";

/**
 * Repository — จุดเดียวที่หน้า/แอ็กชันเรียกหาข้อมูล
 * -------------------------------------------------------------------------
 * เมื่อเชื่อม MySQL เดิม: เปลี่ยนการอ่าน/เขียนในไฟล์นี้เป็น query() จาก
 * lib/db.ts (map snake_case → camelCase) โดยชื่อฟังก์ชันและ type คงเดิม
 * ทำให้ UI ทั้งหมดไม่ต้องแก้
 */

const now = () => new Date().toISOString();

/* ---------------------------------- ลูกค้า ---------------------------------- */

export function listCustomers(opts?: { q?: string; tier?: Tier }): Customer[] {
  let rows = readStore().customers;
  const q = opts?.q?.trim().toLowerCase();
  if (opts?.tier) rows = rows.filter((c) => c.tier === opts.tier);
  if (q) {
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.replaceAll("-", "").includes(q.replaceAll("-", "")) ||
        c.vehicles.some((v) => v.plate.toLowerCase().includes(q)),
    );
  }
  return [...rows].sort((a, b) => b.lastVisitAt.localeCompare(a.lastVisitAt));
}

export function getCustomer(id: number): Customer | null {
  return readStore().customers.find((c) => c.id === id) ?? null;
}

export function createCustomer(input: {
  name: string;
  phone: string;
  lineId?: string;
  address?: string;
  tier: Tier;
  plate?: string;
  brand?: string;
  model?: string;
  tireSize?: string;
}): Customer {
  const store = readStore();
  const id = nextId(store, "customer");
  const customer: Customer = {
    id,
    code: `C-${String(id).padStart(4, "0")}`,
    name: input.name,
    phone: input.phone,
    lineId: input.lineId || undefined,
    address: input.address || undefined,
    tier: input.tier,
    tags: [],
    vehicles: input.plate
      ? [
          {
            plate: input.plate,
            brand: input.brand ?? "",
            model: input.model ?? "",
            tireSize: input.tireSize ?? "",
          },
        ]
      : [],
    totalSpend: 0,
    visitCount: 0,
    lastVisitAt: now().slice(0, 10),
    createdAt: now(),
  };
  store.customers.push(customer);
  writeStore(store);
  return customer;
}

export function updateCustomer(
  id: number,
  patch: Partial<Pick<Customer, "name" | "phone" | "lineId" | "address" | "tier">>,
): boolean {
  const store = readStore();
  const c = store.customers.find((x) => x.id === id);
  if (!c) return false;
  Object.assign(c, patch);
  writeStore(store);
  return true;
}

/* --------------------------------- สินค้า/บริการ --------------------------------- */

export function listProducts(opts?: { q?: string; type?: string }): Product[] {
  let rows = readStore().products;
  const q = opts?.q?.trim().toLowerCase();
  if (opts?.type && opts.type !== "all") rows = rows.filter((p) => p.type === opts.type);
  if (q) {
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.includes(q),
    );
  }
  return [...rows].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export function listLowStock(): Product[] {
  return readStore().products.filter((p) => p.type === "product" && p.stock <= p.minStock);
}

export function createProduct(input: Omit<Product, "id">): Product {
  const store = readStore();
  const id = nextId(store, "product");
  const product: Product = { id, ...input };
  store.products.push(product);
  writeStore(store);
  return product;
}

export function adjustStock(id: number, delta: number): boolean {
  const store = readStore();
  const p = store.products.find((x) => x.id === id);
  if (!p || p.type !== "product") return false;
  p.stock = Math.max(0, p.stock + delta);
  writeStore(store);
  return true;
}

/* --------------------------------- โปรโมชัน --------------------------------- */

export function listPromotions(): Promotion[] {
  return [...readStore().promotions].sort((a, b) => b.id - a.id);
}

export function listActivePromotions(): Promotion[] {
  return readStore().promotions.filter((p) => p.status === "active");
}

export function getPromotion(id: number): Promotion | null {
  return readStore().promotions.find((p) => p.id === id) ?? null;
}

export function createPromotion(input: {
  title: string;
  description: string;
  discountType: Promotion["discountType"];
  discountValue: number;
  startDate: string;
  endDate: string;
  channels: ChannelName[];
}): Promotion {
  const store = readStore();
  const id = nextId(store, "promotion");
  const month = input.startDate.slice(5, 7).toUpperCase();
  const promotion: Promotion = {
    id,
    code: `${month}-${id}-AUTO`,
    status: "draft",
    views: 0,
    claims: 0,
    createdAt: now(),
    ...input,
  };
  store.promotions.push(promotion);
  writeStore(store);
  return promotion;
}

export function setPromotionStatus(id: number, status: Promotion["status"]): boolean {
  const store = readStore();
  const p = store.promotions.find((x) => x.id === id);
  if (!p) return false;
  p.status = status;
  writeStore(store);
  return true;
}

/* --------------------------------- การจอง (ศูนย์บริการ) --------------------------------- */

export function listBookings(opts?: { date?: string }): Booking[] {
  let rows = readStore().bookings;
  if (opts?.date) rows = rows.filter((b) => b.date === opts.date);
  return [...rows].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function createBooking(input: {
  customerId?: number;
  customerName: string;
  phone: string;
  plate: string;
  service: string;
  date: string;
  time: string;
  source: Booking["source"];
  note?: string;
}): Booking {
  const store = readStore();
  const id = nextId(store, "booking");
  const booking: Booking = {
    id,
    customerId: input.customerId ?? null,
    customerName: input.customerName,
    phone: input.phone,
    plate: input.plate,
    service: input.service,
    date: input.date,
    time: input.time,
    source: input.source,
    note: input.note,
    status: "pending",
    createdAt: now(),
  };
  store.bookings.push(booking);
  writeStore(store);
  return booking;
}

const BOOKING_FLOW: BookingStatus[] = ["pending", "confirmed", "in_service", "done"];

export function advanceBooking(id: number): BookingStatus | null {
  const store = readStore();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return null;
  const i = BOOKING_FLOW.indexOf(b.status);
  b.status = BOOKING_FLOW[Math.min(i + 1, BOOKING_FLOW.length - 1)];
  writeStore(store);
  return b.status;
}

export function cancelBooking(id: number): boolean {
  const store = readStore();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return false;
  b.status = "cancelled";
  writeStore(store);
  return true;
}

/* --------------------------------- ใบงาน (Job Order) --------------------------------- */

export function listJobs(): JobOrder[] {
  return [...readStore().jobs].sort((a, b) => b.id - a.id);
}

const JOB_FLOW: { from: JobStatus; to: JobStatus }[] = [
  { from: "received", to: "diagnosing" },
  { from: "diagnosing", to: "working" },
  { from: "working", to: "qc" },
  { from: "qc", to: "done" },
  { from: "done", to: "delivered" },
];

export function advanceJob(id: number): JobStatus | null {
  const store = readStore();
  const j = store.jobs.find((x) => x.id === id);
  if (!j) return null;
  const step = JOB_FLOW.find((s) => s.from === j.status);
  if (!step) return j.status;
  j.status = step.to;
  j.updatedAt = now();

  // เมื่อส่งมอบแล้ว: อัปเดตยอดสะสม/สต็อกให้ลูกค้าและสินค้า (ERP-lite)
  if (step.to === "delivered" && j.customerId) {
    const c = store.customers.find((x) => x.id === j.customerId);
    if (c) {
      c.totalSpend += j.total;
      c.visitCount += 1;
      c.lastVisitAt = now().slice(0, 10);
    }
    for (const item of j.items) {
      const p = store.products.find((x) => x.name === item.name && x.type === "product");
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    }
  }
  writeStore(store);
  return j.status;
}

/* --------------------------------- แชท --------------------------------- */

export function listConversations(): Conversation[] {
  return [...readStore().conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export function getConversation(id: number): Conversation | null {
  return readStore().conversations.find((c) => c.id === id) ?? null;
}

/**
 * webhook ใช้: หา (หรือสร้าง) ห้องแชทจากคีย์ภายนอก เช่น LINE userId
 * เผื่อลูกค้าใหม่ทักเข้ามาก่อนมีรายชื่อใน CRM
 */
export function findOrCreateConversation(
  channel: ChannelName,
  externalKey: string,
  displayName: string,
): Conversation {
  const store = readStore();
  let conv = store.conversations.find(
    (c) => c.channel === channel && c.externalKey === externalKey,
  );
  if (!conv) {
    const id = nextId(store, "conversation");
    conv = {
      id,
      channel,
      externalKey,
      customerId: null,
      displayName,
      aiAuto: true, // ค่าเริ่มต้นให้ AI ช่วยตอบก่อนเสมอ
      unread: 0,
      lastMessageAt: new Date().toISOString(),
      messages: [],
    };
    store.conversations.push(conv);
    writeStore(store);
  }
  return conv;
}

/** บันทึกข้อความเข้าจากลูกค้า (เรียกจาก webhook หรือเดโม) */
export function appendIncomingMessage(
  conversationId: number,
  text: string,
): Conversation | null {
  const store = readStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;
  const mid = conv.messages.length + 1;
  conv.messages.push({ id: mid, direction: "in", sender: "customer", text, at: now() });
  conv.lastMessageAt = now();
  conv.unread += 1;
  writeStore(store);
  return conv;
}

export function appendOutgoingMessage(
  conversationId: number,
  text: string,
  sender: "staff" | "ai",
): Conversation | null {
  const store = readStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;
  const mid = conv.messages.length + 1;
  conv.messages.push({ id: mid, direction: "out", sender, text, at: now() });
  conv.lastMessageAt = now();
  writeStore(store);
  return conv;
}

export function markConversationRead(id: number): void {
  const store = readStore();
  const conv = store.conversations.find((c) => c.id === id);
  if (!conv) return;
  conv.unread = 0;
  writeStore(store);
}

export function setConversationAiAuto(id: number, aiAuto: boolean): void {
  const store = readStore();
  const conv = store.conversations.find((c) => c.id === id);
  if (!conv) return;
  conv.aiAuto = aiAuto;
  writeStore(store);
}

/* --------------------------------- เผยแพร่ --------------------------------- */

export function listPosts(): ChannelPost[] {
  return [...readStore().posts].sort((a, b) => b.id - a.id);
}

export function createPost(input: {
  kind: ChannelPost["kind"];
  title: string;
  body: string;
  channels: ChannelName[];
  refPromotionId?: number;
}): ChannelPost {
  const store = readStore();
  const id = nextId(store, "post");
  const post: ChannelPost = {
    id,
    kind: input.kind,
    title: input.title,
    body: input.body,
    refPromotionId: input.refPromotionId,
    createdAt: now(),
    channels: input.channels.map((name) => ({
      name,
      status: "pending",
      reach: 0,
      clicks: 0,
    })),
  };
  store.posts.push(post);
  writeStore(store);
  return post;
}

/**
 * "เผยแพร่ทุกช่องทาง" — ยิงไปยัง LINE Broadcast / Facebook Graph / เว็บ
 * ถ้าตั้งค่า token แล้วจะเรียก API จริง (ดู lib/channels.ts); ไม่มี token → เดโมสำเร็จ
 */
export function markPostPublished(id: number): void {
  const store = readStore();
  const post = store.posts.find((p) => p.id === id);
  if (!post) return;
  for (const ch of post.channels) {
    if (ch.status === "pending") {
      ch.status = "published";
      ch.publishedAt = now();
    }
  }
  writeStore(store);
}

/** "ดึงข้อมูลกลับ" — sync ยอด reach/clicks จากแต่ละช่องทางกลับเข้าระบบ */
export function syncPostMetrics(id: number): ChannelPost | null {
  const store = readStore();
  const post = store.posts.find((p) => p.id === id);
  if (!post) return null;
  for (const ch of post.channels) {
    if (ch.status !== "published") continue;
    // เดโม: สุ่มยอดเพิ่ม — ของจริงคือ fetch insights จาก LINE/Facebook API
    ch.reach += Math.floor(50 + Math.random() * 400);
    ch.clicks += Math.floor(5 + Math.random() * 60);
  }
  // อัปเดตยอด views ของการ์ดโปรโมชันที่ผูกกับโพสต์นี้
  if (post.refPromotionId) {
    const promo = store.promotions.find((p) => p.id === post.refPromotionId);
    if (promo) {
      promo.views = post.channels.reduce((s, c) => s + c.reach, 0);
    }
  }
  writeStore(store);
  return post;
}

/* --------------------------------- สถิติ Cockpit --------------------------------- */

export function getMonthlyStats() {
  return readStore().monthlyStats;
}

export function getCockpitSummary() {
  const s = readStore();
  const today = now().slice(0, 10);
  const activeProducts = s.products.filter((p) => p.active);
  const stockOnHand = activeProducts
    .filter((p) => p.type === "product")
    .reduce((sum, p) => sum + p.stock, 0);
  const lowStock = s.products.filter((p) => p.type === "product" && p.stock <= p.minStock);
  const activePromos = s.promotions.filter((p) => p.status === "active");
  const todayBookings = s.bookings.filter((b) => b.date === today && b.status !== "cancelled");
  const openJobs = s.jobs.filter((j) => j.status !== "delivered");
  const unreadChats = s.conversations.reduce((n, c) => n + c.unread, 0);
  const monthRevenue = s.monthlyStats.at(-1)?.revenue ?? 0;

  return {
    customers: s.customers.length,
    vipCustomers: s.customers.filter((c) => c.tier === "vip").length,
    stockOnHand,
    lowStockCount: lowStock.length,
    activePromoCount: activePromos.length,
    todayBookingCount: todayBookings.length,
    openJobCount: openJobs.length,
    unreadChats,
    monthRevenue,
    aiConversations: s.conversations.filter((c) => c.aiAuto).length,
  };
}
