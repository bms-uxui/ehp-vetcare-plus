/**
 * คิวของ "ทัวร์คำแนะนำ" — กดดูคำแนะนำจากหน้าตั้งค่าแล้วไล่สอนต่อเนื่อง
 * หน้าแรก → สัตว์เลี้ยง → เพิ่มสัตว์เลี้ยง → นัดหมาย → จองนัด → ร้านค้า.
 * แต่ละหน้าเช็คว่า queue[0] เป็นของตัวเองไหม
 * ตอนได้ focus ถ้าใช่ก็เริ่ม guide แล้วพอจบ (หรือกดข้าม) ก็ shift ตัวเอง
 * ออกจากคิวแล้วพาไปหน้าถัดไป. กากบาทล้างคิวทั้งหมด = ออกจากทัวร์.
 *
 * เป็น ref ระดับโมดูลเพราะหน้าแท็บไม่ถูก unmount เวลาสลับหน้า — สถานะใน
 * storage อย่างเดียวปลุกหน้าที่ mount ค้างอยู่ไม่ได้.
 */
export type TourPage = 'home' | 'pets' | 'addpet' | 'vet' | 'booking' | 'shop';

export const guideTour = { queue: [] as TourPage[] };

export function startGuideTour() {
  guideTour.queue.splice(
    0,
    guideTour.queue.length,
    'home',
    'pets',
    'addpet',
    'vet',
    'booking',
    'shop',
  );
}

export function endGuideTour() {
  guideTour.queue.length = 0;
}
