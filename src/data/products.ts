export type ProductCategory = 'food' | 'treats' | 'toys' | 'supplies' | 'health';

export type Product = {
  id: string;
  category: ProductCategory;
  emoji: string;
  imageUrl?: string;
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

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&auto=format&fit=crop&q=80`;

// Shared gallery photos appended after each product's primary image.
// Each product ends up with 3 swipeable images.
export const categoryGallery: Record<ProductCategory, string[]> = {
  food:     [img('1601758228041-f3b2795255f1'), img('1546069901-ba9599a7e63c')],
  treats:   [img('1543466835-00a7907e9de1'),    img('1583337130417-3346a1be7dee')],
  toys:     [img('1518791841217-8f162f1e1131'),  img('1592194996308-7b43878e84a6')],
  supplies: [img('1601758125946-6ec2ef64daf8'),  img('1591946614720-90a587da4a36')],
  health:   [img('1576091160399-112ba8d25d1f'),  img('1607619056574-7b8d3ee536b2')],
};

export const getProductImages = (p: Product): string[] => {
  const list: string[] = [];
  if (p.imageUrl) list.push(p.imageUrl);
  list.push(...categoryGallery[p.category]);
  return list;
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
    imageUrl: img('1568640347023-a616a30bc3bd'),
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
    imageUrl: img('1574231164645-d6f0e8553590'),
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
    imageUrl: img('1583337130417-3346a1be7dee'),
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
    imageUrl: img('1605568427561-40dd23c2acea'),
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
    imageUrl: img('1576201836106-db1758fd1c97'),
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
    imageUrl: img('1535268647677-300dbf3d78d1'),
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
    imageUrl: img('1541599468348-e96984315921'),
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
    imageUrl: img('1556228720-195a672e8a03'),
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
    imageUrl: img('1584308666744-24d5c474f2ae'),
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
    imageUrl: img('1607619056574-7b8d3ee536b2'),
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
