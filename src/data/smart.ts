export type Recommendation = {
  id: string;
  petId: string;
  type: 'food' | 'activity' | 'wellness';
  title: string;
  description: string;
  icon: string;
};

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rc1',
    petId: 'p1',
    type: 'food',
    title: 'ให้อาหาร Hypoallergenic ต่อเนื่อง',
    description: 'ด้วยประวัติภูมิแพ้ผิวหนัง ควรเลี่ยงสูตรที่มีเนื้อไก่ และเลือกสูตรปลาหรือเนื้อแกะ',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'rc2',
    petId: 'p1',
    type: 'activity',
    title: 'พาวิ่ง 30 นาที/วัน',
    description: 'ชิบะ อินุ 3 ปี 9 กก. ควรออกกำลังสม่ำเสมอเพื่อรักษาน้ำหนัก',
    icon: 'Activity',
  },
  {
    id: 'rc3',
    petId: 'p1',
    type: 'wellness',
    title: 'แปรงขนสัปดาห์ละ 2 ครั้ง',
    description: 'ช่วงผลัดขนฤดูร้อน ควรแปรงเพื่อลดการร่วงและตรวจผิวหนัง',
    icon: 'Sparkles',
  },
  {
    id: 'rc4',
    petId: 'p2',
    type: 'food',
    title: 'อาหารแมวสูตรน้ำหนักเหมาะสม',
    description: 'มะลิ 2 ปี 3.8 กก. น้ำหนักอยู่ในเกณฑ์ ควรรักษาไว้',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'rc5',
    petId: 'p2',
    type: 'activity',
    title: 'เล่นด้วย 15 นาที วันละ 2 ครั้ง',
    description: 'แมวในร่มควรได้รับการกระตุ้นจากของเล่นเพื่อป้องกันโรคอ้วน',
    icon: 'ToyBrick',
  },
  {
    id: 'rc6',
    petId: 'p3',
    type: 'wellness',
    title: 'ตัดเล็บเดือนละครั้ง',
    description: 'กระต่ายขนาดเล็กควรตรวจเล็บและฟันเป็นประจำ',
    icon: 'Scissors',
  },
];

// Common symptoms by pet kind — for the symptom check flow.
export const COMMON_SYMPTOMS = [
  { id: 'sy1', label: 'อาเจียน', icon: 'CloudRain' },
  { id: 'sy2', label: 'ท้องเสีย', icon: 'Droplet' },
  { id: 'sy3', label: 'ไม่กินอาหาร', icon: 'Utensils' },
  { id: 'sy4', label: 'ซึม/ไม่ร่าเริง', icon: 'Frown' },
  { id: 'sy5', label: 'ไอ/จาม', icon: 'Wind' },
  { id: 'sy6', label: 'คันผิวหนัง', icon: 'PawPrint' },
  { id: 'sy7', label: 'เดินกะเผลก', icon: 'Bone' },
  { id: 'sy8', label: 'มีไข้', icon: 'Thermometer' },
];

export const DURATION_OPTIONS = [
  { key: 'today', label: 'วันนี้' },
  { key: '2-3days', label: '2-3 วัน' },
  { key: 'week', label: 'มากกว่า 1 สัปดาห์' },
];

export const SEVERITY_OPTIONS = [
  { key: 'mild', label: 'เล็กน้อย', color: '#4FB36C' },
  { key: 'moderate', label: 'ปานกลาง', color: '#E8A87C' },
  { key: 'severe', label: 'รุนแรง', color: '#C25450' },
];

export type AnalysisResult = {
  urgency: 'self-care' | 'monitor' | 'vet-soon' | 'emergency';
  possibleConditions: string[];
  recommendations: string[];
  shouldBook: boolean;
};

// Fake analysis logic — picks urgency based on selected symptoms/severity.
export function analyzeSymptoms({
  symptoms,
  severity,
  duration,
}: {
  symptoms: string[];
  severity: string | null;
  duration: string | null;
}): AnalysisResult {
  const hasRedFlag = symptoms.includes('sy1') && symptoms.includes('sy2'); // vomit + diarrhea
  const noAppetite = symptoms.includes('sy3');
  const lethargy = symptoms.includes('sy4');

  if (severity === 'severe' || (hasRedFlag && duration !== 'today')) {
    return {
      urgency: 'emergency',
      possibleConditions: ['ลำไส้อักเสบเฉียบพลัน', 'ภาวะขาดน้ำ', 'ได้รับสารพิษ'],
      recommendations: [
        'พาไปพบสัตวแพทย์ทันที',
        'จดบันทึกอาการและเวลาเกิดอาการ',
        'งดให้อาหารและน้ำจนกว่าจะพบแพทย์',
      ],
      shouldBook: true,
    };
  }

  if ((hasRedFlag || (noAppetite && lethargy)) && severity === 'moderate') {
    return {
      urgency: 'vet-soon',
      possibleConditions: ['กระเพาะอักเสบ', 'ติดเชื้อทางเดินอาหาร', 'ภูมิแพ้อาหาร'],
      recommendations: [
        'นัดพบสัตวแพทย์ภายใน 24 ชม.',
        'ให้ทานอาหารอ่อน แบ่งมื้อเล็ก',
        'สังเกตปริมาณน้ำดื่มและการขับถ่าย',
      ],
      shouldBook: true,
    };
  }

  if (symptoms.includes('sy6')) {
    return {
      urgency: 'monitor',
      possibleConditions: ['ภูมิแพ้ผิวหนัง', 'การระคายเคืองจากอาหาร', 'แพ้เห็บ/หมัด'],
      recommendations: [
        'สังเกตอาการ 2-3 วัน',
        'ตรวจหาเห็บหมัดและอาบน้ำ',
        'พิจารณาเปลี่ยนอาหารเป็นสูตร hypoallergenic',
      ],
      shouldBook: false,
    };
  }

  return {
    urgency: 'self-care',
    possibleConditions: ['ความเครียดชั่วคราว', 'อากาศเปลี่ยน'],
    recommendations: [
      'พักผ่อนและให้น้ำเพียงพอ',
      'สังเกตอาการต่อเนื่อง 1-2 วัน',
      'หากไม่ดีขึ้นให้พบสัตวแพทย์',
    ],
    shouldBook: false,
  };
}

export const urgencyMeta = {
  'self-care': { label: 'ดูแลที่บ้าน', color: '#4FB36C', bg: '#E7F5E9', icon: 'Home' },
  'monitor': { label: 'สังเกตอาการ', color: '#4A8FD1', bg: '#E0F0FB', icon: 'Eye' },
  'vet-soon': { label: 'ควรพบสัตวแพทย์', color: '#E8A87C', bg: '#FFF3E6', icon: 'Calendar' },
  'emergency': { label: 'พบแพทย์ด่วน', color: '#C25450', bg: '#FDECEC', icon: 'AlertOctagon' },
} as const;

export const recTypeMeta = {
  food: { label: 'อาหาร', color: '#D99A20', bg: '#FFF6D9' },
  activity: { label: 'กิจกรรม', color: '#4FB36C', bg: '#E7F5E9' },
  wellness: { label: 'สุขภาพทั่วไป', color: '#B86A7C', bg: '#F5E4E7' },
} as const;
