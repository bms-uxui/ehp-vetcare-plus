export type LabResult = {
  id: string;
  name: string;
  type: 'lab' | 'xray' | 'ultrasound';
  result: string;
  resultStatus: 'normal' | 'attention' | 'abnormal';
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
};

export type ClinicVisit = {
  id: string;
  petId: string;
  dateISO: string;
  vetName: string;
  clinicName: string;
  weightKg: number;
  heightCm?: number;
  temperatureC: number;
  symptoms: string;
  diagnosis: string;
  labs: LabResult[];
  medications: Medication[];
  notes?: string;
};

export const mockVisits: ClinicVisit[] = [
  {
    id: 'vs1',
    petId: 'p1',
    dateISO: '2026-03-15',
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 9.4,
    temperatureC: 38.7,
    symptoms: 'มาฉีดวัคซีนประจำปี ไม่มีอาการผิดปกติ',
    diagnosis: 'สุขภาพแข็งแรงดี',
    labs: [],
    medications: [],
  },
  {
    id: 'vs2',
    petId: 'p1',
    dateISO: '2025-12-04',
    vetName: 'สพ. อนุพงษ์',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 9.2,
    temperatureC: 39.1,
    symptoms: 'คันตามผิวหนังบริเวณคอและขาหลัง',
    diagnosis: 'ภูมิแพ้ผิวหนังกำเริบ — อาจเกิดจากโปรตีนไก่ในอาหาร',
    labs: [
      { id: 'l1', name: 'ตรวจขูดผิวหนัง (Skin scrape)', type: 'lab', result: 'ไม่พบปรสิต', resultStatus: 'normal' },
      { id: 'l2', name: 'Complete Blood Count', type: 'lab', result: 'Eosinophil สูงเล็กน้อย', resultStatus: 'attention' },
    ],
    medications: [
      { id: 'm1', name: 'Apoquel 5.4mg', dose: '1 เม็ด', frequency: 'วันละ 2 ครั้ง', duration: '14 วัน' },
      { id: 'm2', name: 'Shampoo Chlorhexidine', dose: 'ทาให้ทั่ว', frequency: 'สัปดาห์ละ 2 ครั้ง', duration: '1 เดือน' },
    ],
    notes: 'ควรเปลี่ยนอาหารเป็นสูตร hypoallergenic',
  },
  {
    id: 'vs3',
    petId: 'p1',
    dateISO: '2025-08-18',
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 9.0,
    temperatureC: 38.5,
    symptoms: 'ตรวจประจำทุก 6 เดือน',
    diagnosis: 'สุขภาพแข็งแรง',
    labs: [],
    medications: [],
  },
  {
    id: 'vs4',
    petId: 'p1',
    dateISO: '2025-03-15',
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 8.6,
    temperatureC: 38.6,
    symptoms: 'ฉีดวัคซีนประจำปี',
    diagnosis: 'สุขภาพดี',
    labs: [],
    medications: [],
  },
  {
    id: 'vs5',
    petId: 'p2',
    dateISO: '2026-03-08',
    vetName: 'สพ.ญ. ปิยะพร',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 3.8,
    temperatureC: 38.4,
    symptoms: 'ตรวจสุขภาพทั่วไป',
    diagnosis: 'สุขภาพแข็งแรงดี',
    labs: [
      { id: 'l3', name: 'ตรวจเลือดเบื้องต้น', type: 'lab', result: 'ปกติทุกค่า', resultStatus: 'normal' },
    ],
    medications: [],
  },
  {
    id: 'vs6',
    petId: 'p2',
    dateISO: '2025-09-22',
    vetName: 'สพ. อนุพงษ์',
    clinicName: 'EHP VetCare สาขาสุขุมวิท',
    weightKg: 3.6,
    temperatureC: 38.7,
    symptoms: 'อาเจียน 2 ครั้งเมื่อวาน',
    diagnosis: 'กระเพาะอักเสบเฉียบพลัน (Gastritis)',
    labs: [
      { id: 'l4', name: 'Ultrasound ช่องท้อง', type: 'ultrasound', result: 'ไม่พบสิ่งผิดปกติในกระเพาะ', resultStatus: 'normal' },
    ],
    medications: [
      { id: 'm3', name: 'Famotidine 10mg', dose: '1/4 เม็ด', frequency: 'วันละ 2 ครั้ง', duration: '7 วัน' },
      { id: 'm4', name: 'อาหารอ่อน Prescription Diet', dose: 'มื้อละ 30g', frequency: 'วันละ 3 มื้อ', duration: '5 วัน' },
    ],
  },
];

export const visitsForPet = (petId: string) =>
  mockVisits
    .filter((v) => v.petId === petId)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

export const thDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
