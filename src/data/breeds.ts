export type BreedSpecies = 'dog' | 'cat' | 'rabbit';

export type BreedSize = 'tiny' | 'small' | 'medium' | 'large';

export type Breed = {
  id: string;
  species: BreedSpecies;
  nameTh: string;
  nameEn: string;
  emoji: string;
  origin: string;
  size: BreedSize;
  weightRange: string; // เช่น "8-12 กก."
  lifespanYears: string; // เช่น "12-15 ปี"
  temperament: string[]; // tags
  description: string; // 1-2 ประโยค
  careLevel: 'easy' | 'medium' | 'high'; // ความยากในการดูแล
  shedding: 'low' | 'medium' | 'high'; // ระดับการผลัดขน
  energyLevel: 'low' | 'medium' | 'high';
  commonHealthIssues: string[];
  goodFor: string[]; // เช่น "อพาร์ตเมนต์", "ครอบครัว", "มือใหม่"
  groomingFrequency: string;
};

export const breedSizeLabel: Record<BreedSize, string> = {
  tiny: 'จิ๋ว',
  small: 'เล็ก',
  medium: 'กลาง',
  large: 'ใหญ่',
};

export const careLevelLabel: Record<Breed['careLevel'], string> = {
  easy: 'ง่าย',
  medium: 'ปานกลาง',
  high: 'ต้องดูแลมาก',
};

export const sheddingLabel: Record<Breed['shedding'], string> = {
  low: 'น้อย',
  medium: 'ปานกลาง',
  high: 'มาก',
};

export const energyLevelLabel: Record<Breed['energyLevel'], string> = {
  low: 'สงบ',
  medium: 'ปานกลาง',
  high: 'พลังเยอะ',
};

export const mockBreeds: Breed[] = [
  // ── สุนัข ──
  {
    id: 'b-shiba',
    species: 'dog',
    nameTh: 'ชิบะ อินุ',
    nameEn: 'Shiba Inu',
    emoji: '🐕',
    origin: 'ญี่ปุ่น',
    size: 'small',
    weightRange: '8-11 กก.',
    lifespanYears: '13-16 ปี',
    temperament: ['ฉลาด', 'อิสระ', 'ภักดี', 'ขี้ระแวง'],
    description:
      'สุนัขขนาดเล็กถึงกลางจากญี่ปุ่น มีบุคลิกเหมือนแมว ฉลาดและรักความเป็นอิสระ ขนหนาผลัดเยอะ 2 ครั้ง/ปี',
    careLevel: 'medium',
    shedding: 'high',
    energyLevel: 'high',
    commonHealthIssues: ['ภูมิแพ้ผิวหนัง', 'ข้อสะโพกผิดรูป', 'ต้อหิน'],
    goodFor: ['คนรักความเป็นอิสระ', 'บ้านมีบริเวณ'],
    groomingFrequency: 'แปรงสัปดาห์ละ 2-3 ครั้ง · อาบน้ำเดือนละ 1 ครั้ง',
  },
  {
    id: 'b-golden',
    species: 'dog',
    nameTh: 'โกลเด้น รีทรีฟเวอร์',
    nameEn: 'Golden Retriever',
    emoji: '🦮',
    origin: 'สก็อตแลนด์',
    size: 'large',
    weightRange: '25-34 กก.',
    lifespanYears: '10-12 ปี',
    temperament: ['ใจดี', 'ฉลาด', 'อ่อนโยน', 'รักครอบครัว'],
    description:
      'สุนัขใหญ่ขนยาว ใจดีและซื่อสัตย์ เหมาะกับครอบครัวที่มีเด็ก ต้องออกกำลังกายมาก',
    careLevel: 'medium',
    shedding: 'high',
    energyLevel: 'high',
    commonHealthIssues: ['ข้อสะโพกผิดรูป', 'มะเร็ง', 'โรคหัวใจ'],
    goodFor: ['ครอบครัว', 'มีเด็ก', 'บ้านมีสวน'],
    groomingFrequency: 'แปรงทุกวัน · อาบน้ำเดือนละ 1-2 ครั้ง',
  },
  {
    id: 'b-pomeranian',
    species: 'dog',
    nameTh: 'ปอมเมอเรเนียน',
    nameEn: 'Pomeranian',
    emoji: '🐶',
    origin: 'เยอรมนี/โปแลนด์',
    size: 'tiny',
    weightRange: '1.4-3.2 กก.',
    lifespanYears: '12-16 ปี',
    temperament: ['ร่าเริง', 'ขี้เห่า', 'ฉลาด', 'ผูกพันกับเจ้าของ'],
    description: 'สุนัขจิ๋วขนฟู เป็นเพื่อนใกล้ชิดเจ้าของ เห่าเก่ง เหมาะกับคอนโด',
    careLevel: 'medium',
    shedding: 'medium',
    energyLevel: 'medium',
    commonHealthIssues: ['สะบ้าหลุด', 'ฟันผุ', 'หลอดลมยุบ', 'หัวใจ'],
    goodFor: ['คอนโด', 'อพาร์ตเมนต์', 'ผู้สูงอายุ'],
    groomingFrequency: 'แปรงสัปดาห์ละ 3-4 ครั้ง · ตัดขนทุก 2-3 เดือน',
  },
  {
    id: 'b-poodle',
    species: 'dog',
    nameTh: 'พุดเดิ้ลทอย',
    nameEn: 'Toy Poodle',
    emoji: '🐩',
    origin: 'ฝรั่งเศส/เยอรมนี',
    size: 'tiny',
    weightRange: '2-4 กก.',
    lifespanYears: '12-15 ปี',
    temperament: ['ฉลาด', 'ฝึกง่าย', 'ขี้เล่น', 'รักเจ้าของ'],
    description:
      'สุนัขจิ๋วฉลาดเป็นอันดับต้น ๆ ของโลก ขนหยิกไม่ค่อยผลัด เหมาะกับคนแพ้ขนสัตว์',
    careLevel: 'medium',
    shedding: 'low',
    energyLevel: 'medium',
    commonHealthIssues: ['สะบ้าหลุด', 'โรคตา', 'โรคหัวใจ'],
    goodFor: ['คอนโด', 'คนแพ้ขนสัตว์', 'มือใหม่'],
    groomingFrequency: 'แปรงทุกวัน · ตัดขนทุก 4-6 สัปดาห์',
  },
  {
    id: 'b-bulldog-fr',
    species: 'dog',
    nameTh: 'เฟรนช์ บูลด็อก',
    nameEn: 'French Bulldog',
    emoji: '🐶',
    origin: 'ฝรั่งเศส',
    size: 'small',
    weightRange: '8-13 กก.',
    lifespanYears: '10-12 ปี',
    temperament: ['ขี้เล่น', 'ใจดี', 'ขี้กลัว', 'ผูกพัน'],
    description:
      'หน้าสั้น ตัวกล้าม ขี้เล่นแต่ไม่ต้องออกกำลังหนัก เหมาะกับคอนโด แต่ระวังร้อน',
    careLevel: 'high',
    shedding: 'medium',
    energyLevel: 'low',
    commonHealthIssues: ['หายใจลำบาก (BOAS)', 'ผิวหนังพับ', 'กระดูกสันหลัง'],
    goodFor: ['คอนโด', 'คนทำงานบ้าน'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1-2 ครั้ง · ทำความสะอาดรอยพับทุกวัน',
  },

  // ── แมว ──
  {
    id: 'b-scottish-fold',
    species: 'cat',
    nameTh: 'สก็อตติช โฟลด์',
    nameEn: 'Scottish Fold',
    emoji: '🐈',
    origin: 'สก็อตแลนด์',
    size: 'medium',
    weightRange: '3-6 กก.',
    lifespanYears: '11-15 ปี',
    temperament: ['สงบ', 'อ่อนโยน', 'ปรับตัวง่าย', 'เข้ากับคนได้ดี'],
    description:
      'แมวหูพับเอกลักษณ์เฉพาะ บุคลิกเงียบสงบ เหมาะกับเด็กและสัตว์อื่น ไม่ต้องการเจ้าของจู้จี้',
    careLevel: 'easy',
    shedding: 'medium',
    energyLevel: 'low',
    commonHealthIssues: ['ข้อกระดูกผิดรูป (Osteochondrodysplasia)', 'หัวใจ', 'ทางเดินปัสสาวะ'],
    goodFor: ['คอนโด', 'ครอบครัว', 'มือใหม่'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1-2 ครั้ง · ตรวจหูประจำ',
  },
  {
    id: 'b-british-sh',
    species: 'cat',
    nameTh: 'บริติช ช็อตแฮร์',
    nameEn: 'British Shorthair',
    emoji: '🐈‍⬛',
    origin: 'อังกฤษ',
    size: 'medium',
    weightRange: '3.5-7.7 กก.',
    lifespanYears: '12-17 ปี',
    temperament: ['ใจเย็น', 'อิสระ', 'ใจดี', 'ไม่ขี้อ้อน'],
    description: 'แมวตัวกลม หน้ากลมขาสั้น บุคลิกใจเย็น ไม่เรียกร้องความสนใจ เหมาะกับคนทำงาน',
    careLevel: 'easy',
    shedding: 'medium',
    energyLevel: 'low',
    commonHealthIssues: ['อ้วน', 'หัวใจ HCM', 'ทางเดินปัสสาวะ'],
    goodFor: ['คอนโด', 'คนทำงาน', 'มือใหม่'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1-2 ครั้ง',
  },
  {
    id: 'b-persian',
    species: 'cat',
    nameTh: 'เปอร์เซีย',
    nameEn: 'Persian',
    emoji: '🐱',
    origin: 'อิหร่าน',
    size: 'medium',
    weightRange: '3-5.5 กก.',
    lifespanYears: '12-17 ปี',
    temperament: ['อ่อนโยน', 'เงียบ', 'ขี้เล่น', 'รักความสงบ'],
    description: 'แมวขนยาวหรูหรา หน้าแบน ต้องดูแลขนทุกวัน เหมาะกับบ้านที่สงบ',
    careLevel: 'high',
    shedding: 'high',
    energyLevel: 'low',
    commonHealthIssues: ['น้ำตาไหล', 'ทางเดินหายใจ', 'PKD (โรคไต)'],
    goodFor: ['คอนโด', 'คนรักการดูแลขน'],
    groomingFrequency: 'แปรงทุกวัน · เช็ดน้ำตาวันละ 2 ครั้ง',
  },
  {
    id: 'b-siamese',
    species: 'cat',
    nameTh: 'วิเชียรมาศ (สยาม)',
    nameEn: 'Siamese',
    emoji: '🐈',
    origin: 'ไทย',
    size: 'small',
    weightRange: '2.5-5 กก.',
    lifespanYears: '12-20 ปี',
    temperament: ['ฉลาด', 'ขี้อ้อน', 'พูดเก่ง', 'ติดเจ้าของ'],
    description:
      'แมวสายพันธุ์ไทยโบราณ ฉลาดและสื่อสารด้วยเสียงร้องเก่งมาก เหมาะกับคนที่อยู่บ้าน',
    careLevel: 'medium',
    shedding: 'low',
    energyLevel: 'high',
    commonHealthIssues: ['หัวใจ', 'อะไมลอยโดซิส', 'ฟันผุ'],
    goodFor: ['ครอบครัว', 'คนรักแมวพูดเก่ง'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1 ครั้ง',
  },
  {
    id: 'b-american-sh',
    species: 'cat',
    nameTh: 'อเมริกัน ช็อตแฮร์',
    nameEn: 'American Shorthair',
    emoji: '🐈',
    origin: 'อเมริกา',
    size: 'medium',
    weightRange: '3.6-6.8 กก.',
    lifespanYears: '15-20 ปี',
    temperament: ['ปรับตัวง่าย', 'ใจดี', 'นิ่ง', 'ขี้เล่นปานกลาง'],
    description: 'แมวเลี้ยงง่าย แข็งแรง ทนทาน เหมาะกับครอบครัวและมือใหม่',
    careLevel: 'easy',
    shedding: 'medium',
    energyLevel: 'medium',
    commonHealthIssues: ['HCM (โรคหัวใจ)', 'อ้วน'],
    goodFor: ['ครอบครัว', 'มือใหม่', 'มีเด็ก'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1 ครั้ง',
  },

  // ── กระต่าย ──
  {
    id: 'b-netherland-dwarf',
    species: 'rabbit',
    nameTh: 'เนเธอร์แลนด์ ดวอร์ฟ',
    nameEn: 'Netherland Dwarf',
    emoji: '🐰',
    origin: 'เนเธอร์แลนด์',
    size: 'tiny',
    weightRange: '0.5-1.4 กก.',
    lifespanYears: '7-12 ปี',
    temperament: ['ขี้เล่น', 'ฉลาด', 'อยากรู้อยากเห็น', 'ขี้ตื่น'],
    description: 'กระต่ายตัวเล็กที่สุด หูสั้นกลม น่ารัก แต่ต้องการพื้นที่วิ่งและของเล่น',
    careLevel: 'medium',
    shedding: 'medium',
    energyLevel: 'high',
    commonHealthIssues: ['ฟันยาวเกิน', 'ระบบทางเดินอาหาร (GI stasis)', 'ติดเชื้อหู'],
    goodFor: ['คอนโด', 'คนมีเวลาเล่นด้วย'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1-2 ครั้ง · ตัดเล็บเดือนละครั้ง',
  },
  {
    id: 'b-holland-lop',
    species: 'rabbit',
    nameTh: 'ฮอลแลนด์ ลอป',
    nameEn: 'Holland Lop',
    emoji: '🐇',
    origin: 'เนเธอร์แลนด์',
    size: 'tiny',
    weightRange: '0.9-1.8 กก.',
    lifespanYears: '7-14 ปี',
    temperament: ['ใจดี', 'ขี้เล่น', 'ติดคน', 'อ่อนโยน'],
    description:
      'กระต่ายหูตกตัวเล็ก น่ารักและเป็นมิตร เหมาะกับครอบครัวที่มีเด็ก',
    careLevel: 'medium',
    shedding: 'medium',
    energyLevel: 'medium',
    commonHealthIssues: ['ฟันยาวเกิน', 'ติดเชื้อหู (เพราะหูตก)', 'GI stasis'],
    goodFor: ['ครอบครัว', 'มีเด็ก'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1-2 ครั้ง · ทำความสะอาดหูประจำ',
  },
  {
    id: 'b-mini-rex',
    species: 'rabbit',
    nameTh: 'มินิ เร็กซ์',
    nameEn: 'Mini Rex',
    emoji: '🐰',
    origin: 'อเมริกา',
    size: 'small',
    weightRange: '1.4-2 กก.',
    lifespanYears: '8-12 ปี',
    temperament: ['สงบ', 'รักการกอด', 'ขี้เล่น', 'ปรับตัวง่าย'],
    description: 'ขนนุ่มเหมือนกำมะหยี่ บุคลิกเป็นมิตร เหมาะกับมือใหม่',
    careLevel: 'easy',
    shedding: 'low',
    energyLevel: 'medium',
    commonHealthIssues: ['ฟันยาวเกิน', 'ปัญหาทางเดินอาหาร'],
    goodFor: ['มือใหม่', 'ครอบครัว', 'คอนโด'],
    groomingFrequency: 'แปรงสัปดาห์ละ 1 ครั้ง',
  },
];

export const breedsBySpecies = (species: BreedSpecies) =>
  mockBreeds.filter((b) => b.species === species);

export const breedById = (id: string) => mockBreeds.find((b) => b.id === id);

export const speciesLabel: Record<BreedSpecies, string> = {
  dog: 'สุนัข',
  cat: 'แมว',
  rabbit: 'กระต่าย',
};
