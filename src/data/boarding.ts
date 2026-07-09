import { mockBoardingClinics, TeleVet } from './televet';

export type BoardingActivityStatus = 'done' | 'upcoming' | 'skipped';

export type BoardingActivity = {
  id: string;
  time: string; // "08:00"
  label: string; // "ให้อาหารเช้า"
  icon: string; // Lucide icon name
  status: BoardingActivityStatus;
  note?: string;
  /** Optional photo attached by the caretaker (URL or local require) */
  photoUrl?: string;
};

export type Boarding = {
  id: string;
  petId: string;
  clinicId: string;
  clinicName: string;
  /** Drop-off date (inclusive) — ISO YYYY-MM-DD */
  startDateISO: string;
  /** Pick-up date (inclusive) — ISO YYYY-MM-DD */
  endDateISO: string;
  /** Today's activity schedule from the boarding facility */
  todaySchedule: BoardingActivity[];
  /** Caretaker / staff contact phone (mock) */
  caretakerName?: string;
  caretakerPhone?: string;
};

const _today = new Date();
const _addDays = (n: number): string => {
  const d = new Date(_today);
  d.setDate(_today.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const mockBoardings: Boarding[] = [
  {
    id: 'bd-active-1',
    petId: 'p1',
    clinicId: 'bd1',
    clinicName: 'Pawmely Pet Boarding สุขุมวิท',
    startDateISO: _addDays(-2),
    endDateISO: _addDays(3),
    caretakerName: 'พี่หนิง · ผู้ดูแลประจำห้อง 3',
    caretakerPhone: '+66 89 234 5678',
    todaySchedule: [
      {
        id: 'a1',
        time: '07:30',
        label: 'ให้อาหารเช้า',
        icon: 'UtensilsCrossed',
        status: 'done',
        note: 'กินหมดชาม',
        photoUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=900&h=900&fit=crop',
      },
      {
        id: 'a2',
        time: '08:30',
        label: 'พาเดินเล่นรอบสนาม',
        icon: 'Footprints',
        status: 'done',
        note: '15 นาที',
        photoUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&h=900&fit=crop',
      },
      { id: 'a3', time: '10:00', label: 'เปลี่ยนน้ำดื่ม', icon: 'Droplet', status: 'done' },
      {
        id: 'a4',
        time: '12:00',
        label: 'ให้อาหารกลางวัน',
        icon: 'UtensilsCrossed',
        status: 'done',
        photoUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=900&h=900&fit=crop',
      },
      { id: 'a5', time: '15:00', label: 'พาเดินเล่น + เล่นบอล', icon: 'Footprints', status: 'upcoming' },
      { id: 'a6', time: '17:30', label: 'อาบน้ำ-แปรงขน', icon: 'Bath', status: 'upcoming' },
      { id: 'a7', time: '18:30', label: 'ให้อาหารเย็น', icon: 'UtensilsCrossed', status: 'upcoming' },
      { id: 'a8', time: '21:00', label: 'เช็คอุณหภูมิห้อง · เข้านอน', icon: 'Moon', status: 'upcoming' },
    ],
  },
];

/** Number of nights — pick-up date minus drop-off date in days. */
export const boardingNights = (b: Boarding): number => {
  const start = new Date(b.startDateISO);
  const end = new Date(b.endDateISO);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
};

/** Returns boardings that are currently active — today is between start and end. */
export const getActiveBoardings = (boardings: Boarding[] = mockBoardings): Boarding[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return boardings.filter((b) => {
    const start = new Date(b.startDateISO);
    const end = new Date(b.endDateISO);
    return start <= today && today <= end;
  });
};

// ── การเลือกสถานที่ฝากเลี้ยง ────────────────────────────────────────────────

/** รัศมี "ใกล้ฉัน" (กม.) — ไกลกว่านี้ไม่เสนอ เพราะขับไปส่งทุกวันไม่ไหว */
export const NEARBY_RADIUS_KM = 10;

/** จำนวนที่พักนอกเครือที่คัดมาแสดง — มากกว่านี้กลายเป็นลิสต์ให้ไถ ไม่ใช่คำแนะนำ */
export const POPULAR_LIMIT = 3;

/**
 * คะแนนความนิยม = Bayesian weighted rating
 *
 *   score = (v / (v + m)) * R  +  (m / (v + m)) * C
 *
 * ใช้แทน `rating` เปล่า ๆ เพราะที่ที่มีรีวิว 187 ครั้งแล้วได้ 4.96 ยังพิสูจน์
 * ตัวเองน้อยกว่าที่ที่มีรีวิว 538 ครั้งแล้วได้ 4.92 — ค่าเฉลี่ยของกลุ่ม (C)
 * จะถ่วงคะแนนของที่ที่มีรีวิวน้อยให้เข้าใกล้กลาง จนกว่าจะมีรีวิวมากพอ.
 */
function popularityScore(place: TeleVet, meanRating: number, priorReviews: number): number {
  const v = place.reviewCount;
  const R = place.rating;
  return (v / (v + priorReviews)) * R + (priorReviews / (v + priorReviews)) * meanRating;
}

export type BoardingOptions = {
  /** ที่พักในเครือ EHP Vetcare — slot ว่างเชื่อมกับระบบจริง จองได้ทันที */
  partners: TeleVet[];
  /** ที่พักนอกเครือที่อยู่ใกล้และได้รับความนิยมสูงสุด */
  popularNearby: TeleVet[];
};

/**
 * ที่พักในเครือ (เรียงตามระยะทาง) + ที่พักใกล้ ๆ นอกเครือที่นิยมที่สุด.
 * ผู้ใช้จึงเทียบ "จองผ่านแอปได้เลย" กับ "ตัวเลือกที่คนแถวนี้ชอบ" ได้ในหน้าเดียว.
 */
export function getBoardingOptions(
  places: TeleVet[] = mockBoardingClinics,
): BoardingOptions {
  const byDistance = (a: TeleVet, b: TeleVet) =>
    (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);

  const partners = places.filter((p) => p.ehpPartner).sort(byDistance);

  const nearby = places.filter(
    (p) => !p.ehpPartner && (p.distanceKm ?? Infinity) <= NEARBY_RADIUS_KM,
  );
  // Prior = ค่าเฉลี่ยรีวิวของกลุ่ม → ที่ที่รีวิวน้อยกว่าค่าเฉลี่ยจะถูกถ่วงแรงกว่า
  const meanRating =
    places.reduce((s, p) => s + p.rating, 0) / Math.max(1, places.length);
  const priorReviews =
    places.reduce((s, p) => s + p.reviewCount, 0) / Math.max(1, places.length);

  const popularNearby = [...nearby]
    .sort(
      (a, b) =>
        popularityScore(b, meanRating, priorReviews) -
        popularityScore(a, meanRating, priorReviews),
    )
    .slice(0, POPULAR_LIMIT);

  return { partners, popularNearby };
}
