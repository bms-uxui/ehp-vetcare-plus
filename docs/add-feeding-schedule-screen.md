# เอกสารหน้า Add Feeding Schedule Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Add Feeding Schedule (`src/screens/AddFeedingScheduleScreen.tsx`) — สร้างตารางให้อาหาร / น้ำใหม่ พร้อมเลือกหลายน้องในครั้งเดียว

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Widget Breakdown](#3-widget-breakdown)
   - [3.1 Sticky AppBar](#31-sticky-appbar)
   - [3.2 Hero Title Block](#32-hero-title-block)
   - [3.3 Type Card (FeedingTypeCard)](#33-type-card-feedingtypecard)
   - [3.4 Pet Selector (multi-select)](#34-pet-selector-multi-select)
   - [3.5 ปริมาณ Field](#35-ปริมาณ-field)
   - [3.6 Day Picker](#36-day-picker)
   - [3.7 Time Picker (chips)](#37-time-picker-chips)
   - [3.8 หมายเหตุ Field (multiline)](#38-หมายเหตุ-field-multiline)
   - [3.9 Submit Button](#39-submit-button)
4. [State Management](#4-state-management)
5. [Event Flow / Navigation](#5-event-flow--navigation)
6. [Edge Cases & Validation](#6-edge-cases--validation)
7. [ส่วนที่อาจปรับในอนาคต](#7-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้คล้าย `MealTimeSettingScreen` แต่แตกต่างกันที่ :
- **Multi-select pets** : เลือกได้หลายน้องในครั้งเดียว → จะสร้างตารางแยกให้แต่ละน้อง
- **Single time** + **multi day** : เลือกเวลาเดียว แต่หลายวัน
- **เพิ่มเท่านั้น** ไม่มี edit (ใช้ `MealTimeSetting` แทนสำหรับ edit)
- ใช้ context `useSchedules()` (ไม่ใช่ mutate `mockSchedules` โดยตรง)

หน้านี้เข้าจาก notifications page → "ตารางให้อาหาร" → "+ เพิ่ม"

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | สำหรับ pet selector |
| `useSchedules()` | `data/schedulesContext` | `addSchedule(...)` → push ใหม่ |
| `notifyNow()` | `lib/notifications` | แสดง local notification confirm |

### Constants

```
DAYS = [จ, อ, พ, พฤ., ศ, ส, อา.]  (key 0..6, index 0=Sun)
TIME_OPTIONS = ['06:00','07:00','08:00','12:00','15:00','18:00','19:00','21:00']
```

---

## 3. Widget Breakdown

### 3.1 Sticky AppBar

- title : "เพิ่มตาราง"
- leading : ChevronLeft → goBack
- fade ตาม scrollY (start 60, end 120)

### 3.2 Hero Title Block

```
เพิ่มตาราง
ตั้งเวลาและปริมาณสำหรับการแจ้งเตือน
```

- ตัวอักษรใหญ่ (h1) + caption สีรอง

### 3.3 Type Card (FeedingTypeCard)

ใช้ shared component `<FeedingTypeCard value={type} onChange={setType} />`

- กดสลับระหว่าง "อาหาร" / "น้ำ"
- รูป cat-meal / cat-water ขวา-บน

### 3.4 Pet Selector (multi-select)

```
[avatar] [avatar] [avatar] [avatar]
ชื่อ      ชื่อ      ชื่อ      ชื่อ
```

- ใช้ `<PetAvatar>` (shared) ขนาด 56px
- เลือก/ยกเลิกการเลือกแต่ละน้องอิสระ (`Set<petId>`)
- **Active** : ring ที่ป้อมขึ้น + check badge ขวา-ล่าง
- ค่าเริ่มต้น : เลือก `mockPets[0]` (1 ตัวแรก)

### 3.5 ปริมาณ Field

- TextInput แบบ box (border 1px)
- placeholder dynamic ตาม `type` :
  - food : "เช่น 80 กรัม"
  - water : "เช่น 1 ชาม"

### 3.6 Day Picker

```
[จ] [อ] [พ] [พฤ.] [ศ] [ส] [อา.]
```

- 7 chips กลม (40×40)
- Active : สีพื้น primary + ตัวอักษรขาว
- Inactive : สีพื้น `#F2F2F3` + ตัวอักษรเข้ม
- ค่าเริ่มต้น : ทุกวัน (Set([0..6]))

### 3.7 Time Picker (chips)

```
[06:00] [07:00] [08:00] [12:00]
[15:00] [18:00] [19:00] [21:00]
```

- 4 columns × 2 rows
- เลือกได้ **1 เวลาเท่านั้น** (single-select)
- Active : สีพื้น primary + ตัวอักษรขาว

### 3.8 หมายเหตุ Field (multiline)

- TextInput multiline
- minHeight 96 + textAlignVertical top
- placeholder : "เช่น อาหารเม็ด Prescription"

### 3.9 Submit Button

```
[บันทึกตาราง]
```

- Disabled (`#D0D0D4`) ถ้า :
  - ไม่ได้เลือกน้องเลย
  - ไม่ได้เลือกเวลา
  - amount ว่าง
- Enabled : สีพื้น primary

---

## 4. State Management

| State | ประเภท | ค่าเริ่มต้น |
|---|---|---|
| `type` | `FeedingType` | `'food'` |
| `selectedPetIds` | `Set<string>` | `new Set([mockPets[0].id])` |
| `days` | `Set<number>` | `Set([0..6])` (ทุกวัน) |
| `time` | `string \| null` | `null` |
| `amount` | `string` | `''` |
| `note` | `string` | `''` |

### Reanimated

| SharedValue | หน้าที่ |
|---|---|
| `scrollY` | sync StickyAppBar fade |

---

## 5. Event Flow / Navigation

```
[Back]                        → goBack
[Type pill]                   → setType
[Pet avatar]                  → togglePet(id) (Set add/remove)
[Day chip]                    → toggleDay(key)
[Time chip]                   → setTime(t)
[Amount/Note input]           → setAmount/setNote

[Submit (canSubmit=true)]
├─ for each selected pet :
│   addSchedule({ type, petId, time, amount, note, daysOfWeek, enabled:true })
├─ notifyNow({ title:'บันทึกตารางเรียบร้อย', body:'<type> · <time> · <amount>' })
└─ navigation.goBack()
```

---

## 6. Edge Cases & Validation

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่เลือกน้องเลย | submit disabled |
| ไม่เลือกเวลา | submit disabled |
| amount เป็น whitespace | submit disabled (เช็ค `amount.trim()`) |
| `days` ครบ 7 | save เป็น `daysOfWeek: []` (ทุกวัน) |
| `days` < 7 | save เป็น array ของ keys (เรียงน้อย → มาก) |
| `note` ว่าง | save เป็น `undefined` (clean) |
| amount มี whitespace นำหน้า/ตาม | `trim()` ก่อน save |

---

## 7. ส่วนที่อาจปรับในอนาคต

- รองรับ custom time นอก preset (ใช้ DateTimePicker)
- multi-time per schedule (ตอนนี้ 1 schedule = 1 เวลา → ผู้ใช้ต้องสร้างหลายตาราง)
- preview ดูตารางสรุปก่อน submit
- recurrence pattern อื่น (เช่น ทุก 3 วัน, weekend only) แทน weekday
- Date range (เริ่ม - หมดอายุ)
