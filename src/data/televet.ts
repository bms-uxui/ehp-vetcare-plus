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
  /** Days of week the vet is available (0=Sun, 1=Mon, ..., 6=Sat) */
  workingDays: number[];
  /** Time slots available within each working day */
  timeSlots: string[];
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
    workingDays: [1, 2, 3, 4, 5, 6],
    timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
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
    workingDays: [1, 2, 3, 4, 5],
    timeSlots: ['10:00', '11:00', '14:00', '15:00', '16:00'],
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
    workingDays: [2, 3, 4, 5, 6, 0],
    timeSlots: ['11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
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
    workingDays: [1, 3, 5],
    timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00'],
  },
  {
    id: 'tv5',
    name: 'สพ.ญ. เปรมจิต สุวรรณภักดี',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
    specialty: 'จักษุวิทยาสัตว์',
    clinic: 'EHP VetCare สาขาทองหล่อ',
    experienceYears: 7,
    experiences: [
      { years: '2022-2026', description: 'หัวหน้าคลินิกจักษุสัตว์ EHP VetCare สาขาทองหล่อ ดูแลโรคต้อกระจก ตาแห้ง และต้อหินในสัตว์เลี้ยง' },
      { years: '2019-2022', description: 'แพทย์ประจำ Eye Vet Clinic ผ่าตัดต้อกระจกและรักษาโรคจอประสาทตา' },
      { years: '2014-2019', description: 'จบคณะสัตวแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย ฝึกอบรมเฉพาะทางที่ Asia Veterinary Ophthalmology' },
    ],
    ratePerMin: 22,
    rating: 4.85,
    reviewCount: 178,
    status: 'online',
    // กะบ่ายถึงเย็น เปิด จ-ศ
    workingDays: [1, 2, 3, 4, 5],
    timeSlots: ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  },
  {
    id: 'tv6',
    name: 'สพ. ธนากร ภูริเดชา',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face',
    specialty: 'หัวใจและหลอดเลือด',
    clinic: 'EHP VetCare สาขาสุขุมวิท',
    experienceYears: 14,
    experiences: [
      { years: '2018-2026', description: 'ผู้เชี่ยวชาญด้านโรคหัวใจสุนัขและแมว ทำ Echocardiography มากกว่า 3,000 เคส' },
      { years: '2014-2018', description: 'แพทย์ประจำโรงพยาบาลสัตว์ในประเทศญี่ปุ่น Tokyo Animal Cardiology Center' },
      { years: '2010-2014', description: 'จบคณะสัตวแพทยศาสตร์ ม.เกษตรศาสตร์ Fellowship ด้านโรคหัวใจสัตว์' },
    ],
    ratePerMin: 28,
    rating: 4.92,
    reviewCount: 264,
    status: 'busy',
    // เปิดเฉพาะกลางสัปดาห์ — ตรวจคนไข้ที่นัดล่วงหน้า
    workingDays: [3, 5, 6],
    timeSlots: ['13:00', '14:00', '15:00', '16:00', '17:00'],
  },
  {
    id: 'tv-ai',
    name: 'หมอเหมียว',
    avatar: '',
    specialty: 'AI Assistant',
    clinic: 'EHP VetCare AI',
    experienceYears: 0,
    experiences: [],
    ratePerMin: 0,
    rating: 5,
    reviewCount: 0,
    status: 'online',
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    timeSlots: [],
  },
  {
    id: 'tv7',
    name: 'สพ.ญ. พิมพ์พิศา ศรีสะอาด',
    avatar: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200&h=200&fit=crop&crop=face',
    specialty: 'ทันตกรรมสัตว์เลี้ยง',
    clinic: 'EHP VetCare สาขาอารีย์',
    experienceYears: 5,
    experiences: [
      { years: '2023-2026', description: 'แพทย์ประจำคลินิกทันตกรรมสัตว์ EHP VetCare ดูแลขูดหินปูน ถอนฟัน และผ่าตัดเหงือก' },
      { years: '2021-2023', description: 'แพทย์ฝึกหัดด้านทันตกรรมสัตว์เลี้ยง ที่ Pet Dental Specialty Clinic' },
      { years: '2016-2021', description: 'จบคณะสัตวแพทยศาสตร์ ม.มหิดล ปริญญาโทเอกทันตกรรมสัตว์' },
    ],
    ratePerMin: 16,
    rating: 4.75,
    reviewCount: 132,
    status: 'online',
    // เปิดเสาร์-อาทิตย์เป็นหลัก กับวันธรรมดาตอนเย็น
    workingDays: [0, 2, 4, 6],
    timeSlots: ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c-ai',
    vetId: 'tv-ai',
    lastMessage: 'พร้อมช่วยตอบคำถามเกี่ยวกับน้องของคุณค่ะ',
    lastSentAtISO: '2026-04-30T08:00:00',
    unread: 0,
  },
  {
    id: 'c1',
    vetId: 'tv3',
    lastMessage: 'ส่งรูปผื่นบริเวณคอมาให้หมอดูได้เลยนะคะ',
    lastSentAtISO: '2026-04-26T17:45:00',
    unread: 3,
  },
  {
    id: 'c2',
    vetId: 'tv2',
    lastMessage: 'นัดผ่าตัดสำเร็จเรียบร้อย พักให้แผลแห้งสนิทก่อนนะคะ',
    lastSentAtISO: '2026-04-26T11:20:00',
    unread: 1,
  },
  {
    id: 'c3',
    vetId: 'tv1',
    lastMessage: 'อาหารสูตรเดิมได้เลยค่ะ ไม่ต้องเปลี่ยน',
    lastSentAtISO: '2026-04-24T10:12:00',
    unread: 0,
  },
  {
    id: 'c4',
    vetId: 'tv4',
    lastMessage: 'กระต่ายควรมีหญ้า Timothy แห้งให้กินตลอดเวลาค่ะ',
    lastSentAtISO: '2026-04-22T14:08:00',
    unread: 5,
  },
  {
    id: 'c5',
    vetId: 'tv2',
    lastMessage: 'สามารถนำมาเย็บแผลออกได้ในวันที่ 30 เม.ย. นะคะ',
    lastSentAtISO: '2026-04-21T09:30:00',
    unread: 0,
  },
  {
    id: 'c6',
    vetId: 'tv1',
    lastMessage: 'ขอบคุณค่ะคุณหมอ ดีขึ้นมากแล้ว',
    lastSentAtISO: '2026-04-19T20:15:00',
    unread: 0,
  },
  {
    id: 'c7',
    vetId: 'tv3',
    lastMessage: 'ทาครีมแบบนี้สม่ำเสมอ 7 วันเห็นผลแน่นอนค่ะ',
    lastSentAtISO: '2026-04-15T16:42:00',
    unread: 0,
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

export const AI_VET_ID = 'tv-ai';
export const AI_CONVERSATION_ID = 'c-ai';

export type AiCategory = {
  key: string;
  label: string;
  icon: string;
  /** Prompt sent as the user message. {pet} is replaced with the pet name. */
  prompt: string;
  /** Canned AI reply. {pet} is replaced with the pet name. */
  reply: string;
};

export const AI_CATEGORIES: AiCategory[] = [
  {
    key: 'symptom',
    label: 'วิเคราะห์อาการเบื้องต้น',
    icon: 'Stethoscope',
    prompt: 'ช่วยวิเคราะห์อาการเบื้องต้นของน้อง{pet}หน่อยค่ะ',
    reply:
      'จากข้อมูลทั่วไปของน้อง{pet} แนะนำให้สังเกต 3 จุดหลักค่ะ:\n• การกินอาหาร/น้ำ ผิดปกติไหม\n• ระดับความตื่นตัวและการเล่น\n• อาการทางผิวหนัง/ทางเดินอาหาร\nหากอาการต่อเนื่องเกิน 24 ชม. แนะนำให้ปรึกษาสัตวแพทย์ค่ะ',
  },
  {
    key: 'food',
    label: 'แนะนำอาหาร/กิจกรรม',
    icon: 'Salad',
    prompt: 'แนะนำอาหาร/กิจกรรมที่เหมาะสมสำหรับน้อง{pet}หน่อยค่ะ',
    reply:
      'สำหรับน้อง{pet} แนะนำอาหารโปรตีนคุณภาพสูง 25-30% ไขมัน 12-15% ค่ะ\nแบ่งมื้อ 2 ครั้ง/วัน เช้า-เย็น และมีน้ำสะอาดตลอดเวลา\nกิจกรรม: เดิน/เล่น 20-30 นาที/วัน เพื่อรักษาน้ำหนักและสุขภาพข้อต่อค่ะ',
  },
  {
    key: 'portion',
    label: 'คำนวณปริมาณอาหาร',
    icon: 'Scale',
    prompt: 'ช่วยคำนวณปริมาณอาหารที่เหมาะสมสำหรับน้อง{pet}หน่อยค่ะ',
    reply:
      'จากน้ำหนักของน้อง{pet} แนะนำปริมาณอาหารต่อวันดังนี้ค่ะ:\n• โปรตีน 25-30 กรัม/น้ำหนักตัว 1 กก.\n• แบ่ง 2 มื้อ เช้า-เย็น\n• ปรับขึ้น 10% หากน้องเล่นเยอะ ลด 10% หากน้องอ้วน\nควรชั่งน้ำหนักทุก 2 สัปดาห์เพื่อปรับให้พอดีค่ะ',
  },
  {
    key: 'meds',
    label: 'ตรวจสอบยาที่ใช้อยู่',
    icon: 'Pill',
    prompt: 'ช่วยตรวจสอบยาที่น้อง{pet}กำลังใช้อยู่หน่อยค่ะ',
    reply:
      'จากประวัติของน้อง{pet} ยาที่ใช้อยู่ปัจจุบัน:\n• ตรวจสอบความถี่และปริมาณตามที่สัตวแพทย์สั่ง\n• สังเกตอาการข้างเคียง เช่น เบื่ออาหาร อาเจียน ท้องเสีย\n• ห้ามผสมยาคนกับยาสัตว์โดยไม่ปรึกษาสัตวแพทย์\nหากต้องการรายละเอียดเพิ่มเติม แนะนำคุยกับคุณหมอที่สั่งยาค่ะ',
  },
  {
    key: 'ageCare',
    label: 'แนะนำการดูแลตามอายุ',
    icon: 'HeartPulse',
    prompt: 'แนะนำการดูแลที่เหมาะสมตามอายุ/พันธุ์ของน้อง{pet}ค่ะ',
    reply:
      'การดูแลน้อง{pet} ตามอายุและสายพันธุ์:\n• ตรวจสุขภาพประจำปี + วัคซีนตามตาราง\n• ขูดหินปูน/ตรวจช่องปากทุก 6-12 เดือน\n• ออกกำลังกายสม่ำเสมอตามวัย\n• ควบคุมน้ำหนัก + อาหารเสริมข้อต่อในวัยซีเนียร์\n• สังเกตการเปลี่ยนแปลงพฤติกรรมเพื่อตรวจจับโรคแต่เนิ่นๆ',
  },
  {
    key: 'breed',
    label: 'ข้อมูลสายพันธุ์',
    icon: 'PawPrint',
    prompt: 'อยากรู้ข้อมูลสายพันธุ์ของน้อง{pet}',
    reply:
      'ข้อมูลทั่วไปของสายพันธุ์น้อง{pet}:\n• อายุขัยเฉลี่ย: 12-15 ปี\n• อุปนิสัย: ฉลาด รักครอบครัว\n• ปัญหาสุขภาพที่พบบ่อย: ภูมิแพ้ผิวหนัง, ข้อสะโพก\n• การดูแล: แปรงขน 2-3 ครั้ง/สัปดาห์',
  },
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
