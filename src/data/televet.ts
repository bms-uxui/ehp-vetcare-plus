export type OnlineStatus = 'online' | 'busy' | 'offline';

export type ExperienceEntry = {
  years: string; // e.g. "2023-2026"
  description: string;
};

export type TeleVet = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  clinic: string;
  experienceYears: number;
  experiences: ExperienceEntry[];
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
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
    specialty: 'อายุรกรรมทั่วไป',
    clinic: 'EHP VetCare สาขาสุขุมวิท',
    experienceYears: 8,
    experiences: [
      { years: '2023-2026', description: 'ปฏิบัติงานในคลินิกสัตว์ โรงพยาบาลสัตว์สุขสวัสดิ์ และเรียนรู้การวินิจฉัย รักษา และดูแลสัตว์' },
      { years: '2021-2022', description: 'ปฎิบัติฝึกงานที่โรงพยาบาลสัตว์ Happy Pet และเรียนรู้วิธีการ รักษา ดูแลสัตว์ และ การวินิจฉัย' },
      { years: '2018-2022', description: 'จบคณะสัตวแพทยศาสตร์ ม.เกษตรศาสตร์ ปีการศึกษา 2563 เอกสัตวแพทยศาสตร์ทั่วไป' },
    ],
    ratePerMin: 15,
    rating: 4.9,
    reviewCount: 342,
    status: 'online',
  },
  {
    id: 'tv2',
    name: 'สพ. อนุพงษ์ ทองใจ',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
    specialty: 'ศัลยกรรมและกระดูก',
    clinic: 'EHP VetCare สาขาสุขุมวิท',
    experienceYears: 12,
    experiences: [
      { years: '2019-2026', description: 'หัวหน้าทีมศัลยกรรมและกระดูก โรงพยาบาลสัตว์สุขสวัสดิ์ ผ่าตัดสุนัขและแมวมากกว่า 1,000 เคส' },
      { years: '2016-2019', description: 'แพทย์ประจำคลินิกศัลยกรรม Animal Hospital ดูแลผ่าตัดและฟื้นฟูสัตว์เลี้ยง' },
      { years: '2014-2016', description: 'จบคณะสัตวแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย เอกศัลยกรรมและกระดูก' },
    ],
    ratePerMin: 20,
    rating: 4.8,
    reviewCount: 218,
    status: 'busy',
  },
  {
    id: 'tv3',
    name: 'สพ.ญ. ณัฐา กิตติคุณ',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face',
    specialty: 'ผิวหนังและภูมิแพ้',
    clinic: 'EHP VetCare สาขาทองหล่อ',
    experienceYears: 6,
    experiences: [
      { years: '2022-2026', description: 'ผู้เชี่ยวชาญด้านผิวหนังและภูมิแพ้ EHP VetCare สาขาทองหล่อ' },
      { years: '2020-2022', description: 'ฝึกอบรมเฉพาะทางโรคผิวหนังสัตว์เลี้ยง ที่ Asia Veterinary Dermatology Center' },
      { years: '2015-2020', description: 'จบคณะสัตวแพทยศาสตร์ ม.มหิดล ปีการศึกษา 2562' },
    ],
    ratePerMin: 18,
    rating: 4.95,
    reviewCount: 512,
    status: 'online',
  },
  {
    id: 'tv4',
    name: 'สพ. กิตติพงศ์ ใจดี',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face',
    specialty: 'สัตว์เลี้ยงเล็กเฉพาะทาง',
    clinic: 'EHP VetCare สาขาอารีย์',
    experienceYears: 10,
    experiences: [
      { years: '2020-2026', description: 'ดูแลสัตว์เลี้ยงเล็กเฉพาะทาง EHP VetCare สาขาอารีย์ ทั้งกระต่าย แฮมสเตอร์ และนก' },
      { years: '2017-2020', description: 'แพทย์ประจำคลินิกสัตว์เลี้ยงพิเศษ Exotic Pet Clinic' },
      { years: '2012-2016', description: 'จบคณะสัตวแพทยศาสตร์ ม.เชียงใหม่ เอกสัตว์เลี้ยงเล็กพิเศษ' },
    ],
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

export type VetReview = {
  id: string;
  vetId: string;
  userName: string;
  userAvatar: string | null; // null = user has no photo, show fallback avatar
  date: string;
  comment: string;
  rating: number;
};

const REVIEW_COMMENTS = [
  'หมอใจดี อธิบายละเอียด แมวอาการดีขึ้นเร็ว',
  'ตอบเร็ว ให้คำแนะนำชัดเจน',
  'ประทับใจมาก จะกลับมาปรึกษาอีกแน่นอน',
  'ผ่าตัดเรียบร้อย แผลหายดี',
  'หมอเชี่ยวชาญ ดูแลดีมาก',
  'แก้ปัญหาผื่นแมวได้ตรงจุด',
  'ละเอียดอ่อน ใส่ใจคนไข้',
  'หมอน่ารัก ให้คำปรึกษาดี',
  'พูดคุยเป็นกันเอง สบายใจ',
  'ราคาเหมาะสม คุ้มค่ามาก',
  'แนะนำการดูแลครบถ้วน',
  'หมอสุภาพ ตอบทุกคำถาม',
  'นัดง่าย ไม่ต้องรอนาน',
  'วินิจฉัยแม่นยำ',
  'ลูกแมวสบายดีหลังพบหมอ',
  'หมอตรวจละเอียดมาก',
  'ใจเย็น อธิบายดี',
  'แนะนำอาหารและยาได้ดี',
];

const USERNAMES = [
  'User123450', 'NongChomCham', 'PetLover99', 'KhunMaew', 'BowBow',
  'MaliFamily', 'CatLover', 'DogDad', 'KikiMom', 'NimNim',
  'SugarPet', 'PrincessCat', 'BunnyKing', 'MochaCare', 'MintFamily',
  'PoppyDog', 'RoxyLove', 'LunaPet', 'OreoCat', 'ZoroDog',
  'MingMing', 'BamBam', 'CookieCat', 'HappyPaw', 'SnowWhite',
];

// Real user photos. Some reviewers have null avatar → show pink fallback.
const USER_AVATARS: (string | null)[] = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  null,
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  null,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  null,
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  null,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
  null,
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=200&h=200&fit=crop&crop=face',
];

const buildReviewsForVet = (vetId: string, count: number, baseRating: number): VetReview[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${vetId}-r${i + 1}`,
    vetId,
    userName: USERNAMES[i % USERNAMES.length],
    userAvatar: USER_AVATARS[(i + vetId.length) % USER_AVATARS.length],
    date: `${((i % 28) + 1).toString().padStart(2, '0')} มี.ค. 2026`,
    comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
    rating: Math.max(4.0, Math.min(5.0, baseRating - ((i % 5) * 0.1))),
  }));

export const mockReviews: VetReview[] = [
  ...buildReviewsForVet('tv1', 25, 5.0),
  ...buildReviewsForVet('tv2', 18, 4.9),
  ...buildReviewsForVet('tv3', 22, 5.0),
  ...buildReviewsForVet('tv4', 12, 4.8),
];
