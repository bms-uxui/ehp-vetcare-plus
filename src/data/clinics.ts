import { mockVets, TeleVet } from './televet';
import type { Pet } from './pets';

/**
 * คลินิกที่จองผ่านแอปได้ = คลินิกที่มีสัตวแพทย์อยู่ในระบบ (ดู mockVets)
 *
 * ประวัติการรักษา (pet.visits[].clinic) ไม่ใช่ "ตัวกรอง" ว่าจองที่ไหนได้ —
 * มันเป็นแค่ตัวจัดลำดับและป้ายบอกสถานะ. เหตุผล:
 *   1. สัตว์ที่เพิ่งเพิ่มเข้าแอปยังไม่มี visit ที่ไหนเลย ถ้ากรองจะจองไม่ได้สักที่
 *   2. จองให้สัตว์หลายตัวพร้อมกัน คลินิกที่ "ทุกตัวเคยไป" อาจไม่มีเลย
 *      (เช่น มะลิเคยไปแต่ทองหล่อ ต้นข้าวเคยไปแต่ปุกปุย)
 *
 * คลินิกที่อยู่ในประวัติแต่ไม่มีหมอในระบบ (เช่น "คลินิกแมวมะลิ") จองไม่ได้
 * แต่ต้องแสดงให้เห็น ไม่ใช่ซ่อน — ผู้ใช้เห็นชื่อนี้ในประวัติสุขภาพอยู่แล้ว.
 */

/** หมอที่ปรึกษาออนไลน์อย่างเดียว ไม่ใช่คลินิกจริง — ไม่ต้องอยู่ในรายการจอง */
const NON_CLINIC = new Set(['Pawmely AI']);

export type Clinic = {
  id: string;
  name: string;
  branch?: string;
  address?: string;
  phone?: string;
  openHours?: string;
  /** ระยะทางจากผู้ใช้ (กม.) — mock ในระบบจริงคำนวณจากพิกัด */
  distanceKm?: number;
  doctors: TeleVet[];
  /** เรตติ้งรวมของคลินิก — ถ่วงน้ำหนักด้วยจำนวนรีวิวของแพทย์แต่ละคน */
  rating: number;
  /** รีวิวรวมของแพทย์ทุกคนในคลินิก */
  reviewCount: number;
};

/** รายละเอียดเพิ่มเติมของคลินิก — คลินิกที่ไม่มีในนี้จะแสดงเท่าที่รู้ */
const CLINIC_META: Record<
  string,
  Omit<Clinic, 'id' | 'name' | 'doctors' | 'rating' | 'reviewCount'>
> = {
  'โรงพยาบาลสัตว์ทองหล่อ': {
    branch: 'สาขาทองหล่อ',
    address: '55 ซอยทองหล่อ 15 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    phone: '02-712-9000',
    openHours: 'จ.–ศ. 09:00–20:00 · ส.–อา. 10:00–18:00',
    distanceKm: 4.6,
  },
  'ปุกปุยสัตวแพทย์ PUKPUI Rabbit&Exotic Pet Clinic': {
    branch: 'สาขาลาดพร้าว',
    address: '128 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900',
    phone: '02-511-2233',
    openHours: 'อ., พฤ., ส.–อา. 10:00–18:00',
    distanceKm: 9.1,
  },
  'Pawmely สาขาสุขุมวิท': {
    branch: 'สาขาสุขุมวิท',
    address: '24 ซอยสุขุมวิท 24 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
    phone: '02-260-1188',
    openHours: 'ทุกวัน 09:00–20:00',
    distanceKm: 2.8,
  },
  'Pawmely สาขาทองหล่อ': {
    branch: 'สาขาทองหล่อ',
    address: '13 ซอยทองหล่อ 13 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    phone: '02-712-4455',
    openHours: 'ทุกวัน 10:00–20:00',
    distanceKm: 4.2,
  },
  'Pawmely สาขาอารีย์': {
    branch: 'สาขาอารีย์',
    address: '5 ซอยอารีย์ 5 แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
    phone: '02-279-3366',
    openHours: 'จ.–ส. 09:00–19:00',
    distanceKm: 1.2,
  },
};

const slug = (name: string) =>
  `clinic-${name.replace(/\s+/g, '-').toLowerCase()}`;

/** คลินิกทั้งหมดที่จองได้ — derive จากคลินิกของสัตวแพทย์ในระบบ */
export const CLINICS: Clinic[] = (() => {
  const byName = new Map<string, TeleVet[]>();
  for (const vet of mockVets) {
    if (NON_CLINIC.has(vet.clinic)) continue;
    const list = byName.get(vet.clinic) ?? [];
    list.push(vet);
    byName.set(vet.clinic, list);
  }
  return Array.from(byName, ([name, doctors]) => ({
    id: slug(name),
    name,
    doctors,
    // เรตติ้งคลินิก = ค่าเฉลี่ยของแพทย์ ถ่วงด้วยจำนวนรีวิว — หมอที่มีรีวิว 512
    // ครั้งควรมีน้ำหนักมากกว่าหมอที่มี 96 ครั้ง
    rating:
      doctors.reduce((s, d) => s + d.rating * d.reviewCount, 0) /
      Math.max(1, doctors.reduce((s, d) => s + d.reviewCount, 0)),
    reviewCount: doctors.reduce((s, d) => s + d.reviewCount, 0),
    ...CLINIC_META[name],
  }));
})();

const BOOKABLE_NAMES = new Set(CLINICS.map((c) => c.name));

/** ชื่อคลินิกที่สัตว์ตัวนี้เคยเปิด visit — เรียงจากครั้งล่าสุดก่อน */
function visitedClinicsOf(pet: Pet): { name: string; lastVisit: string }[] {
  const newest = new Map<string, string>();
  for (const v of pet.visits ?? []) {
    const prev = newest.get(v.clinic);
    if (!prev || v.date > prev) newest.set(v.clinic, v.date);
  }
  return Array.from(newest, ([name, lastVisit]) => ({ name, lastVisit })).sort(
    (a, b) => b.lastVisit.localeCompare(a.lastVisit),
  );
}

export type ClinicOption = {
  clinic: Clinic;
  /** สัตว์ที่เลือกไว้ซึ่งเคยเปิด visit ที่คลินิกนี้ */
  visitedBy: Pet[];
  /** สัตว์ที่เลือกไว้ซึ่งจะเปิดประวัติใหม่ที่คลินิกนี้ */
  newFor: Pet[];
  /** วันที่ล่าสุดที่สัตว์ที่เลือกไว้เคยมา (ISO) — undefined ถ้าไม่มีตัวไหนเคยมา */
  lastVisit?: string;
};

/**
 * คลินิกที่จองได้ทั้งหมด เรียงตาม "จำนวนสัตว์ที่เลือกซึ่งเคยมา" มากไปน้อย
 * แล้วตามครั้งล่าสุดที่มา — คลินิกประจำจึงลอยขึ้นบนโดยไม่ปิดกั้นคลินิกใหม่.
 */
export function clinicOptionsForPets(pets: Pet[]): ClinicOption[] {
  const visitedByPet = new Map(pets.map((p) => [p.id, visitedClinicsOf(p)]));

  return CLINICS.map((clinic) => {
    const visitedBy: Pet[] = [];
    const newFor: Pet[] = [];
    let lastVisit: string | undefined;

    for (const pet of pets) {
      const hit = visitedByPet.get(pet.id)?.find((v) => v.name === clinic.name);
      if (hit) {
        visitedBy.push(pet);
        if (!lastVisit || hit.lastVisit > lastVisit) lastVisit = hit.lastVisit;
      } else {
        newFor.push(pet);
      }
    }
    return { clinic, visitedBy, newFor, lastVisit };
  }).sort((a, b) => {
    // เคยไป > ไม่เคยไป, แล้วในกลุ่มเคยไป เรียงตามจำนวนสัตว์และครั้งล่าสุด
    if (b.visitedBy.length !== a.visitedBy.length) {
      return b.visitedBy.length - a.visitedBy.length;
    }
    if (a.lastVisit && b.lastVisit) return b.lastVisit.localeCompare(a.lastVisit);
    // กลุ่ม "ยังไม่เคยไป" = คลินิกใกล้ฉัน → ใกล้ที่สุดขึ้นก่อน
    const da = a.clinic.distanceKm ?? Infinity;
    const db = b.clinic.distanceKm ?? Infinity;
    if (da !== db) return da - db;
    return a.clinic.name.localeCompare(b.clinic.name);
  });
}

export type UnbookableClinic = { name: string; pets: Pet[]; lastVisit: string };

/**
 * คลินิกที่อยู่ในประวัติของสัตว์ที่เลือก แต่ไม่มีสัตวแพทย์ในระบบ — จองไม่ได้.
 * แสดงแบบจางเพื่อให้ผู้ใช้รู้ว่าแอปเห็นประวัติครบ ไม่ใช่ทำหาย.
 */
export function unbookableClinicsForPets(pets: Pet[]): UnbookableClinic[] {
  const acc = new Map<string, UnbookableClinic>();
  for (const pet of pets) {
    for (const { name, lastVisit } of visitedClinicsOf(pet)) {
      if (BOOKABLE_NAMES.has(name)) continue;
      const entry = acc.get(name);
      if (!entry) {
        acc.set(name, { name, pets: [pet], lastVisit });
      } else {
        entry.pets.push(pet);
        if (lastVisit > entry.lastVisit) entry.lastVisit = lastVisit;
      }
    }
  }
  return Array.from(acc.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
}
