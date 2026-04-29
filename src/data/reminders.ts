export type ReminderType =
  | 'vaccine'
  | 'appointment'
  | 'feeding'
  | 'medication'
  | 'chat'
  | 'call'
  | 'order';

export type Reminder = {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  petId?: string;
  petName?: string;
  petEmoji?: string;
  dueISO: string; // ISO timestamp
  leadTimeLabel?: string; // "ล่วงหน้า 1 วัน"
  read: boolean;
};

export const reminderMeta: Record<ReminderType, { label: string; icon: string; bg: string; fg: string }> = {
  vaccine: { label: 'วัคซีน', icon: 'Syringe', bg: '#E7F5E9', fg: '#4FB36C' },
  appointment: { label: 'นัดหมาย', icon: 'Calendar', bg: '#F5E4E7', fg: '#B86A7C' },
  feeding: { label: 'ให้อาหาร', icon: 'UtensilsCrossed', bg: '#FFF6D9', fg: '#D99A20' },
  medication: { label: 'ยา', icon: 'Pill', bg: '#EEF0FF', fg: '#5A6BD8' },
  chat: { label: 'แชท', icon: 'MessageCircle', bg: '#E0F0FB', fg: '#4A8FD1' },
  call: { label: 'โทร', icon: 'Phone', bg: '#E8F8F0', fg: '#3DA67A' },
  order: { label: 'คำสั่งซื้อ', icon: 'Package', bg: '#FBEFE6', fg: '#D17A4A' },
};

export const mockReminders: Reminder[] = [
  {
    id: 'r1',
    type: 'appointment',
    title: 'ตรวจสุขภาพประจำปี',
    description: 'พฤหัสบดี 30 เม.ย. เวลา 14:30',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    dueISO: '2026-04-25T09:00:00',
    leadTimeLabel: 'ล่วงหน้า 5 วัน',
    read: false,
  },
  {
    id: 'r2',
    type: 'feeding',
    title: 'เวลาให้อาหารมื้อเช้า',
    description: 'อาหารเม็ด 80 กรัม',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    dueISO: '2026-04-24T07:00:00',
    read: false,
  },
  {
    id: 'r3',
    type: 'vaccine',
    title: 'วัคซีนรวม 5 โรค ใกล้ครบกำหนด',
    description: 'ครั้งถัดไป 15 มี.ค. 2026 — ควรนัดล่วงหน้า',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    dueISO: '2026-03-08T09:00:00',
    leadTimeLabel: 'บันทึกจาก EHP VetCare',
    read: true,
  },
  {
    id: 'r4',
    type: 'medication',
    title: 'Apoquel 5.4mg',
    description: 'ให้ยาวันละ 2 ครั้ง (มื้อเช้า/เย็น)',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    dueISO: '2026-04-24T19:00:00',
    read: false,
  },
  {
    id: 'r5',
    type: 'feeding',
    title: 'เวลาให้น้ำ',
    description: 'เปลี่ยนน้ำสะอาด',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    dueISO: '2026-04-24T08:00:00',
    read: true,
  },
  {
    id: 'r6',
    type: 'appointment',
    title: 'ฉีดวัคซีนรวม',
    description: 'อังคาร 12 พ.ค. เวลา 10:00',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    dueISO: '2026-05-11T10:00:00',
    leadTimeLabel: 'ล่วงหน้า 1 วัน',
    read: false,
  },
  {
    id: 'r7',
    type: 'chat',
    title: 'หมอ ปิยะพร ตอบข้อความแล้ว',
    description: 'อาการคันลดลงไหม ลองทาครีมที่ให้ไป 3 วันก่อน',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    dueISO: '2026-04-23T14:32:00',
    read: false,
  },
  {
    id: 'r8',
    type: 'call',
    title: 'นัดปรึกษาทางโทรศัพท์',
    description: 'หมอ สมหญิง โทรกลับเวลา 16:30',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    dueISO: '2026-04-25T16:30:00',
    leadTimeLabel: 'ล่วงหน้า 30 นาที',
    read: false,
  },
  {
    id: 'r9',
    type: 'order',
    title: 'คำสั่งซื้อ #ORD-2025 จัดส่งแล้ว',
    description: 'Prescription Diet 7kg · ถึงภายใน 2 วัน',
    dueISO: '2026-04-24T09:15:00',
    read: false,
  },
  {
    id: 'r10',
    type: 'order',
    title: 'สินค้าถึงปลายทางแล้ว',
    description: 'Royal Canin 4kg ส่งสำเร็จ — ขอบคุณที่ใช้บริการ',
    dueISO: '2026-04-22T13:40:00',
    read: true,
  },
  {
    id: 'r11',
    type: 'order',
    title: 'สินค้าโปรดของคุณกลับมาแล้ว',
    description: 'Memory Foam Pet Bed M ลด 20% — เหลือ 1,290฿',
    dueISO: '2026-04-23T10:00:00',
    read: false,
  },
];

export type FeedingScheduleType = 'food' | 'water';

export type FeedingSchedule = {
  id: string;
  type: FeedingScheduleType;
  petId: string;
  petName: string;
  petEmoji: string;
  time: string; // "07:00"
  amount: string; // "80g" or "1 ชาม"
  note?: string;
  enabled: boolean;
  daysOfWeek: number[]; // 0=Sun..6=Sat, empty = every day
};

export const mockSchedules: FeedingSchedule[] = [
  {
    id: 's1',
    type: 'food',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    time: '07:00',
    amount: '80 กรัม',
    note: 'อาหารเม็ด Prescription',
    enabled: true,
    daysOfWeek: [],
  },
  {
    id: 's2',
    type: 'food',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    time: '18:30',
    amount: '80 กรัม',
    enabled: true,
    daysOfWeek: [],
  },
  {
    id: 's3',
    type: 'water',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    time: '08:00',
    amount: 'เปลี่ยนน้ำ 1 ชาม',
    enabled: true,
    daysOfWeek: [],
  },
  {
    id: 's4',
    type: 'food',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    time: '06:30',
    amount: '30 กรัม',
    enabled: true,
    daysOfWeek: [],
  },
  {
    id: 's5',
    type: 'food',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    time: '19:00',
    amount: '30 กรัม',
    enabled: false,
    daysOfWeek: [],
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

export const relativeTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffMin) < 60) {
    if (diffMin >= 0) return `อีก ${diffMin} นาที`;
    return `${Math.abs(diffMin)} นาทีที่แล้ว`;
  }
  if (Math.abs(diffHr) < 24) {
    if (diffHr >= 0) return `อีก ${diffHr} ชม.`;
    return `${Math.abs(diffHr)} ชม. ที่แล้ว`;
  }
  if (Math.abs(diffDay) < 7) {
    if (diffDay >= 0) return `อีก ${diffDay} วัน`;
    return `${Math.abs(diffDay)} วันที่แล้ว`;
  }
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
