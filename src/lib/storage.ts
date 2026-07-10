import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ชั้นกลางบาง ๆ ครอบที่เก็บข้อมูลถาวรบนเครื่อง.
 *
 * ทุกที่ในแอปเรียกผ่านไฟล์นี้เท่านั้น ไม่เรียก AsyncStorage ตรง ๆ — วันที่ทีม
 * อยากย้ายไปเก็บบน backend (เพื่อให้ผู้ใช้เปลี่ยนเครื่องแล้วไม่ต้องดู guide ซ้ำ)
 * หรือย้ายไป MMKV เพื่อความเร็ว จะแก้แค่ไฟล์นี้ไฟล์เดียว.
 *
 * อ่านไม่ออก/เขียนไม่ได้ = คืนค่า default เงียบ ๆ ไม่ throw. สถานะ onboarding
 * ไม่คุ้มที่จะทำให้แอปพัง.
 */

/**
 * คีย์ของ quick start guide แต่ละหน้า — ทุก guide เก็บสองค่า:
 * เวอร์ชันที่ดูจบแล้ว (bump เมื่อหน้าเปลี่ยนโครง) และขั้นที่ค้างไว้กลางคัน.
 */
export const guideKeys = (
  id: 'home' | 'pets' | 'addpet' | 'vet' | 'booking' | 'shop',
) => ({
  completedVersion: `guide.${id}.completedVersion`,
  step: `guide.${id}.step`,
});

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore — a failed write just means the guide shows again next launch
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function getNumber(key: string): Promise<number | null> {
  const raw = await getItem(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function setNumber(key: string, value: number): Promise<void> {
  await setItem(key, String(value));
}
