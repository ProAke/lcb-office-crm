/**
 * โมเดลข้อมูลหลักของ CRM + ERP
 * -------------------------------------------------------------------------
 * ชื่อฟิลด์ตั้งให้สอดคล้องกับตารางฝั่ง MySQL เดิม (snake_case ใน DB)
 * ชั้น repo.ts จะ map ให้ — ตอนเชื่อมฐานจริงไม่ต้องแก้ UI เลย
 */

export type Tier = "vip" | "regular" | "new";

export type Vehicle = {
  plate: string; // ทะเบียน เช่น "กข 1234 ชลบุรี"
  brand: string;
  model: string;
  tireSize: string; // เช่น "205/55 R16"
};

export type Customer = {
  id: number;
  code: string; // C-0001
  name: string;
  phone: string;
  lineId?: string;
  address?: string;
  tier: Tier;
  tags: string[];
  vehicles: Vehicle[];
  totalSpend: number; // ยอดสะสม (บาท)
  visitCount: number;
  lastVisitAt: string; // ISO date
  createdAt: string;
};

export type ProductType = "product" | "service";

export type Product = {
  id: number;
  sku: string;
  name: string;
  brand: string;
  type: ProductType;
  category: string; // ยางรถยนต์ / ล้อแม็ก / บริการ …
  price: number;
  cost: number;
  stock: number; // สำหรับ type=product (บริการใช้ 0)
  minStock: number; // ระดับเตือนสต็อกต่ำ
  unit: string; // เส้น / ชุด / ครั้ง
  active: boolean;
};

export type PromotionStatus = "draft" | "active" | "scheduled" | "expired";

export type Promotion = {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "baht";
  discountValue: number;
  startDate: string; // ISO date
  endDate: string;
  status: PromotionStatus;
  channels: ChannelName[]; // ช่องทางที่เผยแพร่
  views: number;
  claims: number; // จำนวนคนกดใช้โปร
  createdAt: string;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_service"
  | "done"
  | "cancelled";

export type Booking = {
  id: number;
  customerId: number | null;
  customerName: string; // เก็บชื่อไว้แสดงเร็ว (denormalized)
  phone: string;
  plate: string;
  service: string;
  date: string; // ISO date
  time: string; // "09:30"
  status: BookingStatus;
  note?: string;
  source: "web" | "line" | "phone" | "walkin" | "ai";
  createdAt: string;
};

export type JobStatus =
  | "received" // รับรถแล้ว
  | "diagnosing" // ตรวจเช็ก
  | "working" // กำลังทำ
  | "qc" // ตรวจสอบคุณภาพ
  | "done" // เสร็จพร้อมส่ง
  | "delivered"; // ส่งมอบแล้ว

export type JobItem = { name: string; qty: number; price: number };

export type JobOrder = {
  id: number;
  jobNo: string; // JOB-202611-001
  customerId: number | null;
  customerName: string;
  plate: string;
  items: JobItem[];
  status: JobStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type ChannelName = "line" | "facebook" | "web";

export type MessageSender = "customer" | "staff" | "ai";

export type ChatMessage = {
  id: number;
  direction: "in" | "out";
  sender: MessageSender;
  text: string;
  at: string; // ISO datetime
};

export type Conversation = {
  id: number;
  channel: ChannelName;
  /** คีย์จากระบบภายนอก เช่น LINE userId — ใช้ผูกห้องแชทกับ webhook */
  externalKey?: string;
  customerId: number | null;
  displayName: string;
  aiAuto: boolean; // ให้ AI ตอบอัตโนมัติ
  unread: number;
  lastMessageAt: string;
  messages: ChatMessage[];
};

export type PostChannelStatus = {
  name: ChannelName;
  status: "pending" | "published" | "failed";
  publishedAt?: string;
  reach: number;
  clicks: number;
};

export type ChannelPost = {
  id: number;
  kind: "promotion" | "news";
  refPromotionId?: number;
  title: string;
  body: string;
  channels: PostChannelStatus[];
  createdAt: string;
};

/** ข้อมูลสถิติรายเดือน (ปกติดึงจาก view/SQL aggregate ของฐานเดิม) */
export type MonthlyStat = { month: string; revenue: number; jobs: number };

export type StoreShape = {
  customers: Customer[];
  products: Product[];
  promotions: Promotion[];
  bookings: Booking[];
  jobs: JobOrder[];
  conversations: Conversation[];
  posts: ChannelPost[];
  monthlyStats: MonthlyStat[];
  counters: Record<string, number>; // สำหรับออก running id
};
