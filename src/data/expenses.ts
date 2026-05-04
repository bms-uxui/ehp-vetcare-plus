export type ExpenseCategory = 'food' | 'treatment' | 'grooming' | 'supplies' | 'other';

export type Expense = {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  dateISO: string;
  /** Single pet — kept for backward compatibility. New entries set `petIds`. */
  petId?: string;
  petName?: string;
  petEmoji?: string;
  /** Multiple pets sharing this expense (e.g. shopping for the whole household). */
  petIds?: string[];
  note?: string;
};

export const categoryMeta: Record<ExpenseCategory, { label: string; icon: string; color: string; bg: string }> = {
  food: { label: 'อาหาร', icon: 'UtensilsCrossed', color: '#D99A20', bg: '#FFF6D9' },
  treatment: { label: 'ค่ารักษา', icon: 'Stethoscope', color: '#B86A7C', bg: '#F5E4E7' },
  grooming: { label: 'อาบน้ำตัดขน', icon: 'Scissors', color: '#4A8FD1', bg: '#E0F0FB' },
  supplies: { label: 'อุปกรณ์', icon: 'Package', color: '#6CC28A', bg: '#E7F5E9' },
  other: { label: 'อื่นๆ', icon: 'CreditCard', color: '#6E6E74', bg: '#F2F2F3' },
};

export const mockExpenses: Expense[] = [
  { id: 'e1', category: 'food', title: 'Prescription Diet Hypoallergenic 7kg', amount: 1850, dateISO: '2026-04-20', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', note: 'สูตรใหม่ ลดภูมิแพ้ผิวหนัง — ใช้ได้ ~1 เดือน' },
  { id: 'e2', category: 'treatment', title: 'ยา Apoquel + ตรวจผิวหนัง', amount: 2400, dateISO: '2026-04-18', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', note: 'หมอ ปิยะพร นัดติดตามอีก 2 สัปดาห์' },
  { id: 'e3', category: 'food', title: 'อาหารแมว Royal Canin 4kg', amount: 780, dateISO: '2026-04-15', petId: 'p2', petName: 'มะลิ', petEmoji: '🐈' },
  { id: 'e4', category: 'grooming', title: 'อาบน้ำตัดขน', amount: 650, dateISO: '2026-04-10', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', note: 'ตัดขนสั้นรับหน้าร้อน + ตัดเล็บ' },
  { id: 'e5', category: 'supplies', title: 'ของเล่นและที่ข่วนเล็บ', amount: 420, dateISO: '2026-04-05', petId: 'p2', petName: 'มะลิ', petEmoji: '🐈' },
  { id: 'e6', category: 'treatment', title: 'ตรวจสุขภาพประจำปี', amount: 1200, dateISO: '2026-04-02', petId: 'p2', petName: 'มะลิ', petEmoji: '🐈', note: 'ตรวจเลือด + ปัสสาวะ ผลปกติ' },
  { id: 'e7', category: 'food', title: 'ขนมและของว่าง', amount: 290, dateISO: '2026-03-28', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕' },
  { id: 'e8', category: 'food', title: 'อาหารเม็ด 15kg', amount: 1650, dateISO: '2026-03-20', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', note: 'ซื้อจาก PetLover Online — มีโปรลด 10%' },
  { id: 'e9', category: 'treatment', title: 'ฉีดวัคซีนรวม + พิษสุนัขบ้า', amount: 900, dateISO: '2026-03-15', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', note: 'นัดถัดไป มี.ค. 2570' },
  { id: 'e10', category: 'grooming', title: 'อาบน้ำ', amount: 350, dateISO: '2026-03-12', petId: 'p2', petName: 'มะลิ', petEmoji: '🐈' },
  // Multi-pet expenses — render as stacked pet badge
  { id: 'e11', category: 'supplies', title: 'แชมพูสมุนไพรครอบครัว', amount: 890, dateISO: '2026-04-22', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', petIds: ['p1', 'p2'], note: 'ใช้ร่วมกันได้ทั้งหมา-แมว' },
  { id: 'e12', category: 'treatment', title: 'หยอดเห็บหมัด 3 ตัว', amount: 1290, dateISO: '2026-04-12', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', petIds: ['p1', 'p2', 'p3'], note: 'Frontline Plus — ทุกตัวพร้อมกัน' },
  { id: 'e13', category: 'food', title: 'ขนมตัวเล็กให้น้องทุกตัว', amount: 480, dateISO: '2026-04-08', petId: 'p1', petName: 'ข้าวปั้น', petEmoji: '🐕', petIds: ['p1', 'p2'] },
];

export const DEFAULT_MONTHLY_BUDGET = 8000;

export const sumByCategory = (items: Expense[]) => {
  const map: Record<ExpenseCategory, number> = {
    food: 0, treatment: 0, grooming: 0, supplies: 0, other: 0,
  };
  items.forEach((e) => { map[e.category] += e.amount; });
  return map;
};

export const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

export const fmtBaht = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export const thMonth = (iso: string) =>
  new Date(iso + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
