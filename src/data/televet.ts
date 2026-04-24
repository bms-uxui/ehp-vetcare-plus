export type OnlineStatus = 'online' | 'busy' | 'offline';

export type TeleVet = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  clinic: string;
  ratePerMin: number;
  rating: number;
  reviewCount: number;
  status: OnlineStatus;
  nextAvailable?: string; // ISO if offline
};

export type Message = {
  id: string;
  conversationId: string;
  fromVet: boolean;
  text?: string;
  image?: string;
  sentAtISO: string;
};

export type Conversation = {
  id: string;
  vetId: string;
  lastMessage: string;
  lastSentAtISO: string;
  unread: number;
};

export const mockVets: TeleVet[] = [
  {
    id: 'tv1',
    name: 'สพ.ญ. ปิยะพร วรรณศิลป์',
    avatar: '👩‍⚕️',
    specialty: 'อายุรกรรมทั่วไป',
    clinic: 'EHP VetCare สาขาสุขุมวิท',
    ratePerMin: 15,
    rating: 4.9,
    reviewCount: 342,
    status: 'online',
  },
  {
    id: 'tv2',
    name: 'สพ. อนุพงษ์ ทองใจ',
    avatar: '👨‍⚕️',
    specialty: 'ศัลยกรรมและกระดูก',
    clinic: 'EHP VetCare สาขาสุขุมวิท',
    ratePerMin: 20,
    rating: 4.8,
    reviewCount: 218,
    status: 'busy',
  },
  {
    id: 'tv3',
    name: 'สพ.ญ. ณัฐา กิตติคุณ',
    avatar: '👩‍⚕️',
    specialty: 'ผิวหนังและภูมิแพ้',
    clinic: 'EHP VetCare สาขาทองหล่อ',
    ratePerMin: 18,
    rating: 4.95,
    reviewCount: 512,
    status: 'online',
  },
  {
    id: 'tv4',
    name: 'สพ. กิตติพงศ์ ใจดี',
    avatar: '👨‍⚕️',
    specialty: 'สัตว์เลี้ยงเล็กเฉพาะทาง',
    clinic: 'EHP VetCare สาขาอารีย์',
    ratePerMin: 20,
    rating: 4.7,
    reviewCount: 96,
    status: 'offline',
    nextAvailable: '2026-04-25T09:00:00',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    vetId: 'tv1',
    lastMessage: 'อาหารสูตรเดิมได้เลยค่ะ ไม่ต้องเปลี่ยน',
    lastSentAtISO: '2026-04-24T10:12:00',
    unread: 0,
  },
  {
    id: 'c2',
    vetId: 'tv3',
    lastMessage: 'ส่งรูปผื่นบริเวณคอมาให้หมอดูได้เลยนะคะ',
    lastSentAtISO: '2026-04-23T17:45:00',
    unread: 2,
  },
];

export const mockMessages: Message[] = [
  // c1 - checkup follow up
  { id: 'm1', conversationId: 'c1', fromVet: false, text: 'สวัสดีค่ะคุณหมอ ขอสอบถามเรื่องอาหารของข้าวปั้นค่ะ', sentAtISO: '2026-04-24T09:55:00' },
  { id: 'm2', conversationId: 'c1', fromVet: true, text: 'สวัสดีค่ะ ได้เลยค่ะ อาหารที่ให้อยู่สูตรไหนคะ?', sentAtISO: '2026-04-24T09:58:00' },
  { id: 'm3', conversationId: 'c1', fromVet: false, text: 'Prescription Diet สำหรับสุนัขภูมิแพ้ค่ะ', sentAtISO: '2026-04-24T10:00:00' },
  { id: 'm4', conversationId: 'c1', fromVet: true, text: 'อาการคันดีขึ้นมั้ยคะหลังใช้ Apoquel?', sentAtISO: '2026-04-24T10:05:00' },
  { id: 'm5', conversationId: 'c1', fromVet: false, text: 'ดีขึ้นค่ะ เหลือคันแค่ตอนเช้านิดหน่อย', sentAtISO: '2026-04-24T10:10:00' },
  { id: 'm6', conversationId: 'c1', fromVet: true, text: 'อาหารสูตรเดิมได้เลยค่ะ ไม่ต้องเปลี่ยน', sentAtISO: '2026-04-24T10:12:00' },

  // c2 - skin rash
  { id: 'm7', conversationId: 'c2', fromVet: false, text: 'คุณหมอคะ มะลิมีผื่นที่คอ', sentAtISO: '2026-04-23T17:30:00' },
  { id: 'm8', conversationId: 'c2', fromVet: true, text: 'ส่งรูปผื่นบริเวณคอมาให้หมอดูได้เลยนะคะ', sentAtISO: '2026-04-23T17:45:00' },
];

export const thTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const thRelative = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'เมื่อครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชม. ที่แล้ว`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

export const statusMeta: Record<OnlineStatus, { label: string; color: string }> = {
  online: { label: 'ออนไลน์', color: '#4FB36C' },
  busy: { label: 'ไม่ว่าง', color: '#E8A87C' },
  offline: { label: 'ออฟไลน์', color: '#9A9AA0' },
};
