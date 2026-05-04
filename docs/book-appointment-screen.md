# เอกสารหน้า Book Appointment Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Book Appointment (`src/screens/BookAppointmentScreen.tsx`) — flow จองนัดสัตวแพทย์แบบ multi-step

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Step / canProceed Rules](#3-step--canproceed-rules)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Header + StepProgress](#41-header--stepprogress)
   - [4.2 Step 0 — เลือกน้อง](#42-step-0--เลือกน้อง)
   - [4.3 Step 1 — เลือกรูปแบบ (online/clinic)](#43-step-1--เลือกรูปแบบ-onlineclinic)
   - [4.4 Step 2 — เลือกวันและเวลา](#44-step-2--เลือกวันและเวลา)
   - [4.5 Step 3 — เลือกสัตวแพทย์](#45-step-3--เลือกสัตวแพทย์)
   - [4.6 Step 4 — บันทึก notes](#46-step-4--บันทึก-notes)
   - [4.7 Calendar Sheet](#47-calendar-sheet)
   - [4.8 Confirm Modals](#48-confirm-modals)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases](#7-edge-cases)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้า multi-step สำหรับการจองนัดสัตวแพทย์ ผู้ใช้ต้องเลือก :
1. น้องที่จะพาไปตรวจ
2. รูปแบบ (online / clinic)
3. วัน + เวลา
4. สัตวแพทย์
5. หมายเหตุ (optional)

จากนั้น navigate ไป `BookAppointmentSummary` เพื่อยืนยัน

หน้านี้รับ `prefill` ผ่าน route param เพื่อ resume / pre-select จากหน้าอื่น (เช่น `VetDetail`, `AppointmentDetail` reschedule)

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | pet selector |
| `mockVets` | `data/televet.ts` | vet selector |
| `route.params.prefill?` | navigation | pre-selected fields |
| `route.params.selectedVetId?` | navigation | จาก VetDetail "จองนัดกับหมอนี้" |

---

## 3. Step / canProceed Rules

```
Step 0 (Pet)        : !!petId
Step 1 (Mode)       : !!mode
Step 2 (Date+Time)  : !!date && !!time
Step 3 (Vet)        : !!vetId
Step 4 (Notes)      : true (notes optional)
```

ปุ่ม "ถัดไป" disabled ถ้าไม่ผ่าน rule

---

## 4. Widget Breakdown

### 4.1 Header + StepProgress

- `<SubPageHeader title="จองนัดหมาย" onBack={...} />`
- `<StepProgress current={stepIndex} steps={[...]} />` — 5 steps progress dots

### 4.2 Step 0 — เลือกน้อง

- Card list ของ `mockPets`
- กดเลือก → `setPetId`
- Active : ring + check icon

### 4.3 Step 1 — เลือกรูปแบบ (online/clinic)

```
[🎥 ออนไลน์]    [🏥 ที่คลินิก]
```

- 2 cards ใหญ่ + caption อธิบาย
- กดเลือก → `setMode`

### 4.4 Step 2 — เลือกวันและเวลา

- ปุ่มเปิด `<CalendarSheet>` แสดงปฏิทิน → เลือกวัน → setDate
- หลังเลือกวัน : แสดง time slots (filtered จาก vet availability)
- กดเวลา → setTime

### 4.5 Step 3 — เลือกสัตวแพทย์

- list ของ `mockVets` (filtered ตาม mode + day availability)
- card vet : avatar + ชื่อ + specialty + rating + ratePerMin
- กด avatar/name → navigate `VetDetail` (preview profile)
- กด select chip → `setVetId`

### 4.6 Step 4 — บันทึก notes

- `<Input multiline>` placeholder : "เพิ่มเติม..."
- กด "ดูสรุป" → navigate `BookAppointmentSummary { petId, mode, dateISO, time, vetId, notes }`

### 4.7 Calendar Sheet

ใช้ shared `<CalendarSheet>` :
- props : `value`, `onChange`, `minDate`
- bottom sheet style
- แสดงเดือนปัจจุบัน, รองรับ swipe เปลี่ยนเดือน

### 4.8 Confirm Modals

#### `noVetModalOpen`
- title : "ยังไม่ได้เลือกสัตวแพทย์"
- ใช้ shared `<ConfirmModal singleAction>` 

#### `leaveModalOpen`
- title : "ออกจากการจอง?"
- กรณีกด back กลางคัน → confirm before exit
- confirm : "ออก" → goBack
- cancel : "อยู่ต่อ"

---

## 5. State Management

### 5.1 React State

| State | ค่าเริ่มต้น | หน้าที่ |
|---|---|---|
| `stepIndex` | 0 | step ปัจจุบัน |
| `petId` | `prefill?.prefillPetId ?? null` | น้องที่เลือก |
| `mode` | `prefill?.prefillMode ?? null` | online / clinic |
| `date` | parse `prefill?.prefillDateISO` | วัน |
| `datePickerOpen` | false | calendar sheet |
| `time` | `prefill?.prefillTime ?? null` | เวลา |
| `vetId` | `incomingVetId ?? null` | vet |
| `notes` | `prefill?.prefillNotes ?? ''` | หมายเหตุ |
| `noVetModalOpen` | false | warning modal |
| `leaveModalOpen` | false | confirm exit modal |

### 5.2 Refs

- `scrollRef` : scroll to top เมื่อเปลี่ยน step

---

## 6. Event Flow / Navigation

```
[Back]
├─ form dirty (มี state ใส่ไว้) → setLeaveModalOpen(true)
└─ ไม่ dirty → goBack

[Step item tap]                  → setX(value)
[ถัดไป (canProceed)]              → setStepIndex(prev + 1)
[ย้อนกลับ (step > 0)]             → setStepIndex(prev - 1)

[Date button]                    → setDatePickerOpen(true)
[Calendar select]                → setDate + setDatePickerOpen(false)

[ดูสรุป (step 4)]
└─ navigate BookAppointmentSummary { petId, mode, dateISO, time, vetId, notes }
```

---

## 7. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| `prefill.prefillVetId` มีค่า แต่ vet offline | ยังเลือกได้ แต่อาจมี warning modal ตอนยืนยัน |
| ไม่มี vet ที่ available ในวัน/เวลานั้น | step 3 list ว่าง — ผู้ใช้ต้องกลับไปเปลี่ยนวัน |
| `prefill.prefillDateISO` ในอดีต | filter ออก (ใช้ today เป็น minDate) |
| ผู้ใช้ navigate ออกขณะ form dirty | leaveModal warning |

---

## 8. ส่วนที่อาจปรับในอนาคต

- รองรับ "วันใกล้เคียง" suggestion ถ้าไม่มี slot ในวันที่เลือก
- save draft state ให้กลับมาเปิดหน้านี้ใหม่แล้วยังเหลือข้อมูล
- preview vet rating + reviews inline (ตอนนี้ต้องไป VetDetail)
- recurring booking
