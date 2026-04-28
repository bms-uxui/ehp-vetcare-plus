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

export type Pet = {
  id: string;
  name: string;
  emoji: string;
  /** Optional photo. require() a local asset; falls back to emoji avatar. */
  photo?: number;
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
