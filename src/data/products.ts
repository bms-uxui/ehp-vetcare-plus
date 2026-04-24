export type ProductCategory = 'food' | 'treats' | 'toys' | 'supplies' | 'health';

export type Product = {
  id: string;
  category: ProductCategory;
  emoji: string;
  name: string;
  brand: string;
  description: string;
  priceBaht: number;
  originalPriceBaht?: number;
  rating: number;
  reviewCount: number;
  subscriptionEligible: boolean;
  subscriptionDiscountPct?: number; // e.g. 10 = 10% off on subscribe
  recommendedFor: ('dog' | 'cat' | 'rabbit')[];
  tags?: string[]; // e.g. "hypoallergenic", "senior"
  clinic?: string; // clinic that fulfills the order
};

const DEFAULT_CLINIC = 'EHP VetCare สาขาสุขุมวิท';

export const categoryMeta: Record<ProductCategory, { label: string; icon: string; bg: string; color: string }> = {
  food: { label: 'อาหาร', icon: 'UtensilsCrossed', bg: '#FFF6D9', color: '#D99A20' },
  treats: { label: 'ขนม', icon: 'Cookie', bg: '#F5E4E7', color: '#B86A7C' },
  toys: { label: 'ของเล่น', icon: 'ToyBrick', bg: '#E7F5E9', color: '#4FB36C' },
  supplies: { label: 'อุปกรณ์', icon: 'Package', bg: '#E0F0FB', color: '#4A8FD1' },
  health: { label: 'สุขภาพ', icon: 'Pill', bg: '#EEE4FF', color: '#7B5CC8' },
};

export const mockProducts: Product[] = [
  {
    id: 'pr1',
    category: 'food',
    emoji: '🥘',
    name: 'Prescription Diet Hypoallergenic',
    brand: 'Hills',
    description: 'อาหารสูตรลดการแพ้ เหมาะกับสุนัขที่มีภูมิแพ้ผิวหนังหรือระบบทางเดินอาหาร',
    priceBaht: 1850,
    originalPriceBaht: 1990,
    rating: 4.8,
    reviewCount: 124,
    subscriptionEligible: true,
    subscriptionDiscountPct: 10,
    recommendedFor: ['dog'],
    tags: ['hypoallergenic', '7kg'],
    clinic: 'EHP VetCare สาขาสุขุมวิท',
  },
  {
    id: 'pr2',
    category: 'food',
    emoji: '🍗',
    name: 'Royal Canin Indoor Adult',
    brand: 'Royal Canin',
    description: 'สูตรสำหรับแมวอยู่ในร่ม ช่วยควบคุมน้ำหนักและลดกลิ่นอุจจาระ',
    priceBaht: 780,
    rating: 4.9,
    reviewCount: 312,
    subscriptionEligible: true,
    subscriptionDiscountPct: 12,
    recommendedFor: ['cat'],
    tags: ['indoor', '4kg'],
    clinic: 'EHP VetCare สาขาสุขุมวิท',
  },
  {
    id: 'pr3',
    category: 'food',
    emoji: '🥬',
    name: 'Timothy Hay Premium',
    brand: 'Oxbow',
    description: 'หญ้าทิโมธีคุณภาพสูง สำหรับกระต่ายและหนูแกสบี้ แหล่งใยอาหารที่ดีที่สุด',
    priceBaht: 420,
    rating: 4.7,
    reviewCount: 89,
    subscriptionEligible: true,
    subscriptionDiscountPct: 10,
    recommendedFor: ['rabbit'],
    tags: ['fiber', '1kg'],
    clinic: 'EHP VetCare สาขาทองหล่อ',
  },
  {
    id: 'pr4',
    category: 'treats',
    emoji: '🦴',
    name: 'Dental Chew Small',
    brand: 'Whimzees',
    description: 'ขนมขัดฟันรูปแปรงสีฟัน ช่วยลดคราบหินปูน',
    priceBaht: 320,
    rating: 4.6,
    reviewCount: 156,
    subscriptionEligible: false,
    recommendedFor: ['dog'],
  },
  {
    id: 'pr5',
    category: 'toys',
    emoji: '🎾',
    name: 'Interactive Ball Launcher',
    brand: 'Chuckit!',
    description: 'ลูกบอลยางทนทาน ใช้คู่กับที่โยนเพื่อออกกำลังกาย',
    priceBaht: 590,
    rating: 4.8,
    reviewCount: 98,
    subscriptionEligible: false,
    recommendedFor: ['dog'],
  },
  {
    id: 'pr6',
    category: 'toys',
    emoji: '🐭',
    name: 'Feather Teaser Wand',
    brand: 'Petstages',
    description: 'ของเล่นตกแมว กระตุ้นสัญชาตญาณนักล่า',
    priceBaht: 180,
    rating: 4.7,
    reviewCount: 204,
    subscriptionEligible: false,
    recommendedFor: ['cat'],
  },
  {
    id: 'pr7',
    category: 'supplies',
    emoji: '🛏️',
    name: 'Memory Foam Pet Bed Medium',
    brand: 'PetComfort',
    description: 'เตียงโฟมรองรับน้ำหนัก เหมาะกับสุนัขอายุมากหรือข้อต่ออักเสบ',
    priceBaht: 1290,
    originalPriceBaht: 1590,
    rating: 4.9,
    reviewCount: 67,
    subscriptionEligible: false,
    recommendedFor: ['dog', 'cat'],
  },
  {
    id: 'pr8',
    category: 'supplies',
    emoji: '🧴',
    name: 'Chlorhexidine Shampoo 250ml',
    brand: 'Virbac',
    description: 'แชมพูรักษาผิวหนัง ใช้ในกรณีแพ้หรือติดเชื้อผิวหนัง',
    priceBaht: 450,
    rating: 4.6,
    reviewCount: 78,
    subscriptionEligible: true,
    subscriptionDiscountPct: 8,
    recommendedFor: ['dog', 'cat'],
    tags: ['hypoallergenic'],
  },
  {
    id: 'pr9',
    category: 'health',
    emoji: '💊',
    name: 'Frontline Plus Spot-On',
    brand: 'Frontline',
    description: 'ยาหยอดป้องกันเห็บหมัด 3 แพ็ค',
    priceBaht: 690,
    rating: 4.8,
    reviewCount: 412,
    subscriptionEligible: true,
    subscriptionDiscountPct: 10,
    recommendedFor: ['dog', 'cat'],
  },
  {
    id: 'pr10',
    category: 'health',
    emoji: '🍵',
    name: 'Joint Support Supplement',
    brand: 'Nutramax',
    description: 'อาหารเสริมบำรุงข้อต่อ Glucosamine + Chondroitin',
    priceBaht: 890,
    rating: 4.7,
    reviewCount: 145,
    subscriptionEligible: true,
    subscriptionDiscountPct: 15,
    recommendedFor: ['dog', 'cat'],
    tags: ['senior'],
  },
];

export const fmtBaht = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
