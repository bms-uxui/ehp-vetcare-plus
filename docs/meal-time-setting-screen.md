# เอกสารหน้า Meal Time Setting Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Meal Time Setting (`src/screens/MealTimeSettingScreen.tsx`) — สร้าง / แก้ไขตารางให้อาหาร 1 ตาราง

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [โหมดการทำงาน (Modes)](#3-โหมดการทำงาน-modes)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 AppBar (header)](#41-appbar-header)
   - [4.2 ประเภท (Type Card)](#42-ประเภท-type-card)
   - [4.3 สัตว์เลี้ยง (Pet Selector)](#43-สัตว์เลี้ยง-pet-selector)
   - [4.4 ปริมาณ (TextField)](#44-ปริมาณ-textfield)
   - [4.5 วันที่ (Day Chips)](#45-วันที่-day-chips)
   - [4.6 เวลา (Time Preset Chips)](#46-เวลา-time-preset-chips)
   - [4.7 Custom Time Picker](#47-custom-time-picker)
   - [4.8 ปุ่มลบ](#48-ปุ่มลบ)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases & Validation](#7-edge-cases--validation)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้ใช้ทั้งโหมด **สร้างใหม่** (no `scheduleId`) และ **แก้ไข** (มี `scheduleId`) ตารางให้อาหาร / น้ำ ของน้อง 1 ตัว

โครงสร้าง :
- AppBar : back, title, save
- Form fields เรียงแนวตั้งใน KeyboardAwareScrollView :
  1. Type card (อาหาร / น้ำ) ← shared component `FeedingTypeCard`
  2. Pet selector (horizontal)
  3. ปริมาณ (TextField)
  4. วันที่ (7 day chips)
  5. เวลา (6 preset + 1 custom picker)
  6. ปุ่มลบ (เฉพาะ edit mode)

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | รายการน้องสำหรับ pet selector |
| `mockSchedules` | `data/reminders.ts` | array ที่ persist schedule (mutate ได้) |
| `route.params` | navigation | `petId` (เริ่มต้น) + `scheduleId?` |

### Constants

```
TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
PRESET_TIMES = ['06:00', '07:00', '08:00', '12:00', '15:00', '18:00']
DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ.', 'ศ', 'ส', 'อา.']
DAY_INDEXES = [1, 2, 3, 4, 5, 6, 0]   // map UI → Date.getDay()
```

---

## 3. โหมดการทำงาน (Modes)

| Mode | เงื่อนไข | พฤติกรรม |
|---|---|---|
| Create | `!scheduleId` | `initial = makeNewSchedule(petId)` ; กด save → `mockSchedules.push(draft)` |
| Edit | มี `scheduleId` | `initial = mockSchedules.find(s.id === scheduleId)` ; save → splice แทนที่ |

ทั้ง 2 โหมดใช้ field `draft` เป็น single source of truth (state)

---

## 4. Widget Breakdown

### 4.1 AppBar (header)

```
[<-]   เพิ่มตาราง / แก้ไขตาราง   [บันทึก]
```

- title : `isNew ? 'เพิ่มตาราง' : 'แก้ไขตาราง'`
- save : disabled ถ้า `hasErrors === true`
- back : `navigation.goBack()`

### 4.2 ประเภท (Type Card)

ใช้ component `<FeedingTypeCard value={draft.type} onChange={(v) => update('type', v)} />` (shared with `AddFeedingScheduleScreen`)

- Card สีเหลืองครีม + รูปประกอบ (cat-meal / cat-water) ขวาบน
- 2 toggle pills "อาหาร" / "น้ำ" — กดสลับ
- Active pill : สีน้ำตาลทอง (food: `#D99A20`) / น้ำเงินอ่อน (water: `#4A8FD1`)

### 4.3 สัตว์เลี้ยง (Pet Selector)

```
[avatar] [avatar] [avatar] [avatar]   →  scroll horizontal
ชื่อ      ชื่อ     ชื่อ      ชื่อ
```

- horizontal ScrollView, 76px กว้างต่อ item
- avatar 72×72 + ring สีขาว
- **Active state** : ring สี `#B86A7C` + check badge ขวา-ล่าง
- **กด** → `selectPet(id)` updates `draft.petId/petName/petEmoji`

### 4.4 ปริมาณ (TextField)

ใช้ component `<TextField label="ปริมาณ" placeholder="เช่น 80 กรัม" ... />`

- Underline-style input
- focus border : สี primary
- อักษร 17pt

### 4.5 วันที่ (Day Chips)

```
[จ] [อ] [พ] [พฤ.] [ศ] [ส] [อา.]
```

- แต่ละ chip 44×44 ค่อนข้างกลม (borderRadius 999, flex:1)
- **Active** : สีพื้น `#A4596B` + ตัวอักษรขาว
- **Inactive** : สีพื้นขาว + border + ตัวอักษรสี primary

#### พฤติกรรม `daysOfWeek`

```
daysOfWeek = []          → ทุกวัน (UI ทุก chip active)
daysOfWeek = [1,3,5]     → จ, พ, ศ active
```

ตอน toggle :
1. ถ้า prev = [] → expand เป็น [0..6] → toggle dayIdx นั้น
2. ถ้าเลือกครบทั้ง 7 → store เป็น [] (cleaner)

### 4.6 เวลา (Time Preset Chips)

```
[06:00] [07:00] [08:00]       (3 cols × 2 rows)
[12:00] [15:00] [18:00]
[+กำหนดเอง]                    (ลำดับที่ 7)
```

- grid 3 columns (`width: 32%`, `justifyContent: space-between`)
- Active chip (= `draft.time`) : สีพื้น primary + ข้อความขาว
- Inactive : สี cream `#EFE6DD` + ข้อความดำ

### 4.7 Custom Time Picker

- Chip "กำหนดเอง" → กดเปิด `Modal` time spinner (DateTimePicker spinner mode)
- ถ้า `draft.time` ตรงกับ preset → chip "กำหนดเอง" inactive (icon Plus)
- ถ้า `draft.time` ไม่ตรงกับ preset → chip "กำหนดเอง" active แสดงค่า `draft.time` (icon Clock)
- Modal มีปุ่ม "ตกลง" / "ยกเลิก"

### 4.8 ปุ่มลบ

- แสดงเฉพาะ `!isNew`
- ข้อความ : "ลบตารางนี้" สีแดง `#C25450`
- กด → `mockSchedules.splice(idx, 1)` → goBack

---

## 5. State Management

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `draft` | `FeedingSchedule` | snapshot ของฟอร์ม (single source of truth) |
| `open` (in CustomTimeChip) | `boolean` | modal เปิด/ปิด |
| `pending` (in CustomTimeChip) | `Date` | ค่าที่ user กำลังเลือกใน spinner |

### 5.2 Refs / Memos

| ตัว | หน้าที่ |
|---|---|
| `initial` (`useMemo`) | คำนวณ initial draft ครั้งเดียวจาก `petId` + `scheduleId` |

### 5.3 Validation

```
errs.time = TIME_RE.test(draft.time) ? undefined : 'รูปแบบเวลาไม่ถูกต้อง'
hasErrors = !!errs.time
```

`save` ถูกบล็อกเมื่อ `hasErrors === true`

---

## 6. Event Flow / Navigation

```
[Back]                         → goBack

[Save]
├─ if (hasErrors) return
├─ if (isNew)  : mockSchedules.push(draft)
├─ else        : splice(findIndex, 1, draft)
└─ navigation.popTo('PetDetail', { petId, flashMessage: 'บันทึกเรียบร้อยแล้ว' })

[Pet selector tap]             → selectPet(id) → update draft.petId/Name/Emoji

[Type pill tap]                → update('type', 'food'/'water')

[Day chip tap]                 → toggleDay(dayIdx)

[Time preset tap]              → update('time', presetValue)
[Custom time tap]              → open modal → confirm → update('time', formatted)

[Delete button]                → mockSchedules.splice(idx, 1) → goBack
```

---

## 7. Edge Cases & Validation

| สถานการณ์ | พฤติกรรม |
|---|---|
| `scheduleId` ไม่มีใน `mockSchedules` | fallback ไป `makeNewSchedule(petId)` |
| `draft.time` ผิด format | `errs.time` ปรากฏ + save ปิด |
| ทุก preset chip กดเลือก → กลับมา preset เดิม | replace |
| ผู้ใช้พิมพ์ amount ว่าง | save ยังกดได้ (ไม่ validate amount) |
| `daysOfWeek` ครบ 7 → จะ store เป็น `[]` | UI ยัง active ทุกวัน |
| `petId` ไม่อยู่ใน mockPets | fallback name='', emoji='🐾' |

---

## 8. ส่วนที่อาจปรับในอนาคต

- amount/note validation (ตอนนี้ amount ว่างก็ save ได้)
- รองรับหลาย time ต่อตาราง (ตอนนี้ 1 schedule = 1 เวลา)
- ผูก `mockSchedules` กับ context (ตอนนี้ใช้ splice mutate)
- AI suggestion : คำนวณปริมาณอาหารจากน้ำหนัก/อายุของน้อง
