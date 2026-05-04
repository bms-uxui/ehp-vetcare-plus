# เอกสารหน้า Appointment Detail Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Appointment Detail (`src/screens/AppointmentDetailScreen.tsx`) — รายละเอียดของการนัดหมาย 1 รายการพร้อม CTAs และตัวเลือกยกเลิก

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Status States](#3-status-states)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Header](#41-header)
   - [4.2 Status Badge](#42-status-badge)
   - [4.3 Pet + Date Card](#43-pet--date-card)
   - [4.4 Vet Info Card](#44-vet-info-card)
   - [4.5 Service Details](#45-service-details)
   - [4.6 Action Buttons](#46-action-buttons)
   - [4.7 Cancel Confirmation Modal](#47-cancel-confirmation-modal)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases](#7-edge-cases)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้แสดงรายละเอียดของการนัดหมาย 1 รายการ + CTA หลัก ๆ ตาม status :
- **upcoming** : เริ่ม video call (online), ส่งข้อความ vet, ยกเลิกนัด
- **completed** : ดูสรุป/ผลลัพธ์, จองครั้งใหม่
- **cancelled** : ดูเหตุผล, จองใหม่

Header มี back button + share/menu (ถ้ามี)

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockAppointments` | `data/appointments.ts` | หา appointment จาก `route.params.appointmentId` |
| `mockPets` | `data/pets.ts` | หา pet จาก `appointment.petId` |
| `mockVets` | `data/televet.ts` | หา vet จาก `appointment.vetId?` |
| `mockConversations` | `data/televet.ts` | หา conversation ที่ตรงกับ vet (สำหรับปุ่มแชท) |
| `route.params.appointmentId` | navigation | id ของนัดหมาย |

### Helper

- `isDayReached(dateISO)` — เช็คว่าวันนัดถึงแล้วหรือยัง
- `thFullDate(iso)` / `thWeekday(iso)` — รูปแบบวันที่ไทย

---

## 3. Status States

```
type Status = 'upcoming' | 'completed' | 'cancelled'
```

| Status | Badge | สี | CTA หลัก |
|---|---|---|---|
| `upcoming` (วันยังไม่ถึง) | "นัดหมายแล้ว" | yellow | เริ่ม video call (online), แชท, ยกเลิก |
| `upcoming` (วันถึงแล้ว) | "ถึงเวลานัดแล้ว" | yellow แบบ active | (เน้น CTA ทำตอนนี้) |
| `completed` | "เสร็จสิ้น" | green `#4FB36C` | จองครั้งใหม่ |
| `cancelled` | "ยกเลิกแล้ว" | red `#E14B4B` | จองใหม่ |

---

## 4. Widget Breakdown

### 4.1 Header

ใช้ shared `<SubPageHeader title="รายละเอียดนัดหมาย" onBack={...} />`

### 4.2 Status Badge

```
+------------------+
| ● <status text> |
+------------------+
```

- บนสุดของ scroll content
- สีตาม `statusMap[status]`

### 4.3 Pet + Date Card

- Pet avatar (ใหญ่) + ชื่อน้อง + species
- วันที่นัด + เวลา + duration
- Format : "พฤหัสบดี · 30 เม.ย. 2569 · 14:30 - 15:00"

### 4.4 Vet Info Card

- Avatar vet (online dot ถ้า `vet.status === 'online'`)
- ชื่อ vet + specialty + คลินิก
- กด → navigate `VetDetail { vetId }`

ถ้า `appointment.vetId` ไม่มี (วัคซีน/บริการไม่ได้ระบุหมอ) → ไม่แสดง section นี้

### 4.5 Service Details

```
ประเภทบริการ : ตรวจสุขภาพประจำปี
รูปแบบ      : ออนไลน์ / ที่คลินิก
สถานที่      : EHP VetCare สาขาสุขุมวิท
หมายเหตุ    : <notes>
```

### 4.6 Action Buttons

#### Upcoming (online + day reached)
```
[🎥 เริ่ม Video Call]    primary
[💬 ส่งข้อความ]          secondary
[ยกเลิกนัด]              text danger
```

#### Upcoming (clinic + day not reached)
```
[💬 ส่งข้อความถึงหมอ]    secondary
[ยกเลิกนัด]              text danger
```

#### Completed
```
[จองนัดอีกครั้ง]          primary
```

#### Cancelled
```
[จองใหม่]                 primary
```

### 4.7 Cancel Confirmation Modal

ใช้ shared `<ConfirmModal>` :
- title : "ยืนยันการยกเลิก?"
- message : "หากยกเลิกแล้วจะกู้คืนไม่ได้"
- confirm : "ใช่, ยกเลิก" (danger)
- cancel : "ไม่ใช่"
- onConfirm → mutate appointment.status = 'cancelled' + close modal + flashMessage back

---

## 5. State Management

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `now` | `Date` | timestamp ปัจจุบัน (อัพเดททุก 1 นาทีถ้าจำเป็น) |
| `cancelModalOpen` | `boolean` | toggle confirm modal |

### 5.2 Memos

- `appointment` = `mockAppointments.find(...)`
- `pet` = `mockPets.find(p.id === appointment.petId)`
- `vet` = `mockVets.find(v.id === appointment.vetId)`
- `existing conversation` = `mockConversations.find(c.vetId === vet.id)`
- `isUpcoming` = `appointment.status === 'upcoming'`
- `dayReached` = `isUpcoming && isDayReached(dateISO)`

---

## 6. Event Flow / Navigation

```
[Back]                            → goBack
[Vet card tap]                    → navigate VetDetail { vetId }

[Video Call]
└─ if (teleVet) → navigate VideoCall { vetId }

[ส่งข้อความ]
├─ existing = mockConversations.find(c.vetId === vet.id)
└─ navigate Chat { conversationId: existing.id }

[ยกเลิกนัด]                       → setCancelModalOpen(true)
[Confirm cancel]
├─ appointment.status = 'cancelled'
├─ closeModal
└─ navigation.popTo('Home', { flashMessage: 'ยกเลิกนัดแล้ว' })

[จองนัดใหม่]                      → navigate BookAppointment { prefillPetId, prefillVetId, ... }
```

---

## 7. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| `appointmentId` ไม่มีใน mock | render "ไม่พบนัดหมาย" + back |
| `vetId` undefined (วัคซีน/grooming ไม่ระบุ vet) | ซ่อน vet card |
| `vet.status === 'offline'` + อยากเริ่ม call | ปุ่ม video disable (opacity 0.3) |
| ไม่มี existing conversation กับ vet | สร้าง conversation ใหม่ก่อน navigate (todo) |
| ยกเลิกแล้วยังคลิก video call (race) | safeguard : ตรวจ status ก่อน execute |

---

## 8. ส่วนที่อาจปรับในอนาคต

- `mockAppointments` mutate → context-based store
- ตอนนี้ปุ่ม "ส่งข้อความ" ถ้าไม่มี conversation → ต้องสร้างใหม่ (ยังไม่มี logic)
- รองรับการเลื่อนนัด (reschedule) ไม่ใช่แค่ยกเลิก
- รองรับการแก้ไขรายละเอียด (notes, time)
- recurring appointments
