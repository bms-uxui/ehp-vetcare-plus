# เอกสารโปรเจกต์ EHP VetCare Plus

ดัชนีรวมเอกสาร **data flow** และ **widget states** ของแต่ละหน้าจอในแอป

---

## 📑 หน้าจอที่มีเอกสารแล้ว (15 หน้า)

### 🏠 Tab หลัก
- [Home Screen](./home-screen.md) — แดชบอร์ด + banner carousel + สรุปข้อมูล
- [Pets List Screen](./pets-list-screen.md) — รายการสัตว์เลี้ยง + drag-and-drop reorder
- [Pet Shop Screen](./pet-shop-screen.md) — ร้านค้าสินค้าสำหรับสัตว์เลี้ยง

### 🐾 Pet Profile
- [Pet Detail Screen](./pet-detail-screen.md) — รายละเอียดน้อง 4 แท็บ + AI หมอเหมียว
- [Pet Edit Screen](./pet-edit-screen.md) — แก้ไขข้อมูลน้อง
- [Add Pet Manual Screen](./add-pet-manual-screen.md) — เพิ่มน้องใหม่ 3-step form

### 🍽️ Feeding / Schedules
- [Meal Time Setting Screen](./meal-time-setting-screen.md) — สร้าง/แก้ไขตารางให้อาหาร
- [Add Feeding Schedule Screen](./add-feeding-schedule-screen.md) — เพิ่มตารางหลายน้องครั้งเดียว

### 🏥 Vet / Appointments
- [Vet Hub Screen](./vet-hub-screen.md) — แท็บ Vet หลัก
- [Book Appointment Screen](./book-appointment-screen.md) — flow จองนัดหมาย 5 steps
- [Appointment Detail Screen](./appointment-detail-screen.md) — รายละเอียดนัด + actions

### 💬 Chat
- [Chat Screen](./chat-screen.md) — แชทกับ vet / AI หมอเหมียว
- [Chat List Screen](./chat-list-screen.md) — รายการห้องสนทนา

### 🔔 Notifications & Expenses
- [Notifications Screen](./notifications-screen.md) — ศูนย์รวมการแจ้งเตือน + filter
- [Expenses Screen](./expenses-screen.md) — แดชบอร์ดค่าใช้จ่าย

---

## 📋 รูปแบบเอกสาร (Doc Template)

แต่ละไฟล์มีโครงสร้างคล้ายกัน :

1. **สารบัญ (TOC)** — anchor links ไปแต่ละ section
2. **ภาพรวม (Overview)** — 1-2 ย่อหน้าอธิบายหน้านี้
3. **แหล่งข้อมูล (Data Sources)** — `mockX` / `useX()` / `route.params` ที่ใช้
4. **ค่าที่คำนวณ (Derived Values)** — useMemo, computed state
5. **Widget Breakdown** — แต่ละ section ของ UI พร้อม layout, behavior, states
6. **State Management** — React state, Refs, Reanimated SharedValues
7. **Event Flow / Navigation Map** — ทุก action → handler → destination
8. **Edge Cases & Fallbacks** — สถานการณ์พิเศษและพฤติกรรม
9. **ส่วนที่อาจปรับในอนาคต** — ข้อสังเกต / known issues / TODO

---

## 🚧 หน้าจอที่ยังไม่ได้ทำเอกสาร (25 หน้า)

หน้าจอเหล่านี้เป็น **single-purpose** หรือ **simple form** ที่ความซับซ้อนต่ำ ตัดสินใจไม่ทำเอกสารเต็มใน scope ปัจจุบัน :

- **Auth** : Login, Signup
- **Cart / Checkout** : Cart, Checkout, OrderTracking
- **Add Pet flow (เสริม)** : AddPet (entry), AddPetScan, AddPetMicrochip
- **Settings / Profile** : Profile, ProfileInfo, Help, Security, ConnectedClinics
- **Booking sub-pages** : BookAppointmentSummary, BookTeleVet
- **Records** : HealthRecords, VisitDetail, Appointments (ไม่แน่ชัดว่ายังใช้)
- **Other** : ProductDetail, AddExpense, SmartFeatures, SymptomCheck, TeleVet, VetDetail, VideoCall

หากต้องการเอกสารเพิ่ม → ระบุชื่อหน้าจอและขอบเขตที่ต้องการ
