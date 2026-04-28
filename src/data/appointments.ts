export type AppointmentType = 'checkup' | 'vaccine' | 'grooming' | 'consultation';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  petId: string;
  petName: string;
  petEmoji: string;
  type: AppointmentType;
  typeLabel: string;
  dateISO: string; // ISO date
  time: string; // "14:30"
  durationMin: number;
  vetName: string;
  clinicName: string;
  status: AppointmentStatus;
  notes?: string;
};

export const typeMeta: Record<AppointmentType, { label: string; icon: string; color: string }> = {
  checkup: { label: 'ตรวจสุขภาพ', icon: 'Stethoscope', color: '#B86A7C' },
  vaccine: { label: 'ฉีดวัคซีน', icon: 'Syringe', color: '#4FB36C' },
  grooming: { label: 'อาบน้ำตัดขน', icon: 'Scissors', color: '#4A8FD1' },
  consultation: { label: 'ปรึกษาสัตวแพทย์', icon: 'MessageCircle', color: '#E8A87C' },
};

// Compute relative dates so Video call button works on any "current day"
const _today = new Date();
const _isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const _addDays = (n: number) => {
  const d = new Date(_today);
  d.setDate(_today.getDate() + n);
  return _isoOf(d);
};
const TODAY_ISO = _isoOf(_today);
const ONLINE_FUTURE_ISO = _addDays(27);

export const mockAppointments: Appointment[] = [
  {
    id: 'ap1',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    type: 'checkup',
    typeLabel: 'ตรวจสุขภาพประจำปี',
    dateISO: '2026-04-30',
    time: '14:30',
    durationMin: 30,
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    status: 'upcoming',
  },
  {
    id: 'ap2',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    type: 'vaccine',
    typeLabel: 'ฉีดวัคซีนรวม',
    dateISO: '2026-05-12',
    time: '10:00',
    durationMin: 20,
    vetName: 'สพ. อนุพงษ์',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    status: 'upcoming',
  },
  {
    id: 'ap3',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    type: 'grooming',
    typeLabel: 'อาบน้ำและตัดขน',
    dateISO: '2026-05-20',
    time: '11:00',
    durationMin: 90,
    vetName: 'คุณฝน',
    clinicName: 'EHP Grooming',
    status: 'upcoming',
  },
  {
    id: 'ap_online_today',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    type: 'consultation',
    typeLabel: 'ปรึกษาอาการเบื้องต้น',
    dateISO: TODAY_ISO,
    time: '16:00',
    durationMin: 30,
    vetName: 'สพ.ญ. ณัฐา',
    clinicName: 'ปรึกษาออนไลน์',
    status: 'upcoming',
  },
  {
    id: 'ap_online_future',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    type: 'consultation',
    typeLabel: 'ติดตามอาการ',
    dateISO: ONLINE_FUTURE_ISO,
    time: '10:30',
    durationMin: 30,
    vetName: 'สพ. อนุพงษ์',
    clinicName: 'ปรึกษาออนไลน์',
    status: 'upcoming',
  },
  {
    id: 'ap4',
    petId: 'p2',
    petName: 'มะลิ',
    petEmoji: '🐈',
    type: 'checkup',
    typeLabel: 'ตรวจสุขภาพทั่วไป',
    dateISO: '2026-03-08',
    time: '09:30',
    durationMin: 30,
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    status: 'completed',
    notes: 'สุขภาพแข็งแรง ไม่มีปัญหา',
  },
  {
    id: 'ap5',
    petId: 'p1',
    petName: 'ข้าวปั้น',
    petEmoji: '🐕',
    type: 'vaccine',
    typeLabel: 'วัคซีนพิษสุนัขบ้า',
    dateISO: '2026-03-15',
    time: '15:00',
    durationMin: 20,
    vetName: 'สพ. อนุพงษ์',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    status: 'completed',
  },
];

export const MOCK_VETS = [
  { id: 'v1', name: 'สพ.ญ. ปิยะพร', specialty: 'อายุรกรรมทั่วไป', clinic: 'EHP VetCare สาขาสุขุมวิท' },
  { id: 'v2', name: 'สพ. อนุพงษ์', specialty: 'ศัลยกรรม', clinic: 'EHP VetCare สาขาสุขุมวิท' },
  { id: 'v3', name: 'สพ.ญ. ณัฐา', specialty: 'ผิวหนังและภูมิแพ้', clinic: 'EHP VetCare สาขาทองหล่อ' },
];

export const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const thDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export const thWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { weekday: 'short' });
