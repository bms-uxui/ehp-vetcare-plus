export type VaccineRecord = {
  id: string;
  name: string;
  date: string;
  nextDue?: string;
  clinic?: string;
};

export type HealthCondition = {
  id: string;
  name: string;
  since: string;
  notes?: string;
};

export type Medication = {
  name: string;
  qty: string;
  instructions: string;
};

export type LabResult = {
  type: 'lab' | 'xray' | 'ultrasound' | 'other';
  name: string;
  result: string;
};

export type VisitRecord = {
  id: string;
  date: string;
  vetName: string;
  clinic: string;
  vitals: {
    weightKg: number;
    heightCm?: number;
    temperatureC: number;
  };
  symptoms: string;
  diagnosis: string;
  labResults?: LabResult[];
  medications?: Medication[];
};

export type Pet = {
  id: string;
  name: string;
  emoji: string;
  /** Optional photo. require() a local asset or runtime { uri }; falls back to emoji avatar. */
  photo?: number | { uri: string };
  species: 'dog' | 'cat' | 'rabbit' | 'other';
  speciesLabel: string;
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  weightKg: number;
  color: string;
  microchipId?: string;
  neutered: boolean;
  neuteredDate?: string;
  vaccines: VaccineRecord[];
  conditions: HealthCondition[];
  visits?: VisitRecord[];
};

export const mockPets: Pet[] = [
  {
    id: 'p1',
    name: 'ข้าวปั้น',
    emoji: '🐕',
    photo: require('../../assets/shiba.jpg'),
    species: 'dog',
    speciesLabel: 'สุนัข',
    breed: 'ชิบะ อินุ',
    gender: 'male',
    birthDate: '2022-08-12',
    weightKg: 9.4,
    color: 'ส้มขาว',
    microchipId: '900164000123456',
    neutered: true,
    neuteredDate: '2023-11-02',
    vaccines: [
      { id: 'v1', name: 'วัคซีนรวม 5 โรค', date: '2025-03-15', nextDue: '2026-03-15', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
      { id: 'v2', name: 'วัคซีนพิษสุนัขบ้า', date: '2025-03-15', nextDue: '2026-03-15', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
      { id: 'v3', name: 'วัคซีนลายม์', date: '2024-09-20', nextDue: '2025-09-20', clinic: 'โรงพยาบาลสัตว์ทองหล่อ' },
      { id: 'v4', name: 'วัคซีนเลปโตสไปโรซิส', date: '2024-12-04', nextDue: '2025-12-04', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
      { id: 'v5', name: 'วัคซีนหวัดสุนัข (Bordetella)', date: '2024-06-18', nextDue: '2025-06-18', clinic: 'โรงพยาบาลสัตว์ทองหล่อ' },
      { id: 'v6', name: 'วัคซีนพยาธิหนอนหัวใจ', date: '2025-01-22', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
    ],
    conditions: [
      { id: 'c1', name: 'ภูมิแพ้ผิวหนัง', since: '2024-05-10', notes: 'หลีกเลี่ยงอาหารเนื้อไก่' },
    ],
    visits: [
      {
        id: 'vt1',
        date: '2026-03-08',
        vetName: 'สพ.ญ. ปรียา จันทรัตน์',
        clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
        vitals: { weightKg: 9.4, heightCm: 41, temperatureC: 38.6 },
        symptoms: 'คันบริเวณท้องและขาหลัง เกาบ่อย',
        diagnosis: 'ภูมิแพ้ผิวหนังเรื้อรังกำเริบ ไม่พบเชื้อรา/ปรสิต',
        labResults: [
          { type: 'lab', name: 'CBC + Skin scraping', result: 'ปกติ ไม่พบไรขี้เรื้อน' },
        ],
        medications: [
          { name: 'Apoquel 16 mg', qty: '14 เม็ด', instructions: 'ครึ่งเม็ด เช้า–เย็น 7 วัน' },
          { name: 'Cetirizine 10 mg', qty: '7 เม็ด', instructions: '1 เม็ด หลังอาหารเช้า' },
        ],
      },
      {
        id: 'vt2',
        date: '2025-12-04',
        vetName: 'สพ.ช. สมชาย วงศ์เจริญ',
        clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
        vitals: { weightKg: 9.1, heightCm: 41, temperatureC: 38.4 },
        symptoms: 'ตรวจสุขภาพประจำปี + ฉีดเลปโตสไปโรซิส',
        diagnosis: 'สุขภาพแข็งแรงดี ไม่พบความผิดปกติ',
        medications: [],
      },
      {
        id: 'vt3',
        date: '2025-09-20',
        vetName: 'สพ.ญ. ปรียา จันทรัตน์',
        clinic: 'โรงพยาบาลสัตว์ทองหล่อ',
        vitals: { weightKg: 8.7, heightCm: 40, temperatureC: 38.9 },
        symptoms: 'ขาหลังขวาเดินกะเผลก หลังจากวิ่งเล่น',
        diagnosis: 'ข้อต่อสะโพกอักเสบเล็กน้อย พักการออกกำลังกาย',
        labResults: [
          { type: 'xray', name: 'X-ray สะโพก', result: 'ไม่มีกระดูกหัก ข้อต่อปกติ' },
        ],
        medications: [
          { name: 'Carprofen 50 mg', qty: '10 เม็ด', instructions: '1 เม็ด หลังอาหารเช้า 5 วัน' },
        ],
      },
      {
        id: 'vt4',
        date: '2025-06-15',
        vetName: 'สพ.ญ. ปรียา จันทรัตน์',
        clinic: 'โรงพยาบาลสัตว์ทองหล่อ',
        vitals: { weightKg: 8.3, heightCm: 39, temperatureC: 38.5 },
        symptoms: 'ตรวจสุขภาพและถ่ายพยาธิ',
        diagnosis: 'สุขภาพดี ตรวจอุจจาระไม่พบไข่พยาธิ',
        medications: [
          { name: 'Drontal Plus', qty: '1 เม็ด', instructions: 'รับประทานครั้งเดียว' },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: 'มะลิ',
    emoji: '🐈',
    photo: require('../../assets/mali.jpg'),
    species: 'cat',
    speciesLabel: 'แมว',
    breed: 'สก็อตติช โฟลด์',
    gender: 'female',
    birthDate: '2023-04-28',
    weightKg: 3.8,
    color: 'ครีม',
    microchipId: '900164000789012',
    neutered: true,
    neuteredDate: '2024-02-14',
    vaccines: [
      { id: 'v7', name: 'วัคซีนรวม 3 โรค (FVRCP)', date: '2025-05-08', nextDue: '2026-05-08', clinic: 'โรงพยาบาลสัตว์ทองหล่อ' },
      { id: 'v8', name: 'วัคซีนพิษสุนัขบ้า', date: '2025-05-08', nextDue: '2026-05-08', clinic: 'โรงพยาบาลสัตว์ทองหล่อ' },
      { id: 'v9', name: 'วัคซีนลิวคีเมียแมว (FeLV)', date: '2024-11-12', nextDue: '2025-11-12', clinic: 'คลินิกแมวมะลิ' },
      { id: 'v10', name: 'วัคซีน FIP', date: '2024-08-30', nextDue: '2025-08-30', clinic: 'คลินิกแมวมะลิ' },
    ],
    conditions: [],
    visits: [
      {
        id: 'vt5',
        date: '2026-02-14',
        vetName: 'สพ.ญ. ณัฐกานต์ ศิริทรัพย์',
        clinic: 'คลินิกแมวมะลิ',
        vitals: { weightKg: 3.8, heightCm: 24, temperatureC: 38.7 },
        symptoms: 'ตรวจสุขภาพประจำปี',
        diagnosis: 'สุขภาพแข็งแรง น้ำหนักอยู่ในเกณฑ์เหมาะสม',
        labResults: [
          { type: 'lab', name: 'Blood chemistry', result: 'ค่าตับ ไต ปกติ' },
        ],
        medications: [],
      },
      {
        id: 'vt6',
        date: '2025-11-12',
        vetName: 'สพ.ช. ธนพล อินทรา',
        clinic: 'คลินิกแมวมะลิ',
        vitals: { weightKg: 3.6, temperatureC: 39.1 },
        symptoms: 'อาเจียน 2 วัน เบื่ออาหาร',
        diagnosis: 'กระเพาะอาหารอักเสบเฉียบพลัน อาจกินขนหรือของแปลกปลอม',
        labResults: [
          { type: 'ultrasound', name: 'Ultrasound ช่องท้อง', result: 'ไม่พบสิ่งแปลกปลอม กระเพาะอักเสบเล็กน้อย' },
        ],
        medications: [
          { name: 'Cerenia 16 mg', qty: '3 เม็ด', instructions: '1 เม็ด วันละครั้ง 3 วัน' },
          { name: 'Probiotic FortiFlora', qty: '7 ซอง', instructions: 'โรยบนอาหาร วันละ 1 ซอง' },
        ],
      },
      {
        id: 'vt7',
        date: '2025-05-08',
        vetName: 'สพ.ญ. ณัฐกานต์ ศิริทรัพย์',
        clinic: 'โรงพยาบาลสัตว์ทองหล่อ',
        vitals: { weightKg: 3.5, temperatureC: 38.5 },
        symptoms: 'ฉีดวัคซีนรวม + พิษสุนัขบ้า',
        diagnosis: 'พร้อมรับวัคซีน ไม่มีอาการผิดปกติ',
        medications: [],
      },
    ],
  },
  {
    id: 'p3',
    name: 'ต้นข้าว',
    emoji: '🐰',
    photo: require('../../assets/rabbit.jpg'),
    species: 'rabbit',
    speciesLabel: 'กระต่าย',
    breed: 'เนเธอร์แลนด์ ดวอร์ฟ',
    gender: 'male',
    birthDate: '2024-06-01',
    weightKg: 1.2,
    color: 'น้ำตาลเทา',
    neutered: false,
    vaccines: [
      { id: 'v11', name: 'วัคซีน RHDV (โรคไวรัสกระต่าย)', date: '2024-12-10', nextDue: '2025-12-10', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
      { id: 'v12', name: 'วัคซีน Myxomatosis', date: '2024-12-10', nextDue: '2025-12-10', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
      { id: 'v13', name: 'วัคซีนรวม Pasteurella', date: '2025-02-18', nextDue: '2026-02-18', clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic' },
    ],
    conditions: [],
    visits: [
      {
        id: 'vt8',
        date: '2026-02-18',
        vetName: 'สพ.ญ. ปรียา จันทรัตน์',
        clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
        vitals: { weightKg: 1.2, heightCm: 18, temperatureC: 39.0 },
        symptoms: 'ตรวจสุขภาพและฉีดวัคซีน Pasteurella',
        diagnosis: 'สุขภาพดี ฟันยาวเล็กน้อย แนะนำเสริมหญ้าและของขบเคี้ยว',
        medications: [],
      },
      {
        id: 'vt9',
        date: '2025-12-10',
        vetName: 'สพ.ญ. ปรียา จันทรัตน์',
        clinic: 'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic',
        vitals: { weightKg: 1.1, heightCm: 17, temperatureC: 38.8 },
        symptoms: 'ฉีดวัคซีน RHDV + Myxomatosis',
        diagnosis: 'พร้อมรับวัคซีน',
        medications: [],
      },
    ],
  },
];

export const petAgeString = (birthDate: string): string => {
  const now = new Date();
  const b = new Date(birthDate);
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} ปี ${months} เดือน ${days} วัน`;
};
