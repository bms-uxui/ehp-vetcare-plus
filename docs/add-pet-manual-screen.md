# เอกสารหน้า Add Pet Manual Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Add Pet Manual (`src/screens/AddPetManualScreen.tsx`) — เพิ่มสัตว์เลี้ยงผ่านการกรอกข้อมูลแบบ 3 ขั้นตอน (multi-step form)

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Step Flow](#3-step-flow)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Top AppBar](#41-top-appbar)
   - [4.2 Step Progress Indicator](#42-step-progress-indicator)
   - [4.3 Avatar Display](#43-avatar-display)
   - [4.4 Step 0 — เลือกชนิดสัตว์เลี้ยง](#44-step-0--เลือกชนิดสัตว์เลี้ยง)
   - [4.5 Step 1 — ข้อมูลพื้นฐาน](#45-step-1--ข้อมูลพื้นฐาน)
   - [4.6 Step 2 — ตรวจสอบข้อมูล](#46-step-2--ตรวจสอบข้อมูล)
   - [4.7 Bottom Action Bar](#47-bottom-action-bar)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases](#7-edge-cases)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้ใช้สำหรับการเพิ่มสัตว์เลี้ยงใหม่แบบกรอกข้อมูลเอง — แบ่งเป็น **3 steps** :

| Step | Title | Required | UI หลัก |
|---|---|---|---|
| 0 | เลือกชนิดสัตว์เลี้ยง | species ≠ null | Grid 4 ตัวเลือก (สุนัข/แมว/กระต่าย/อื่นๆ) |
| 1 | ข้อมูลพื้นฐาน | name | Form fields + DropdownField (สายพันธุ์) + gender chips + neuter |
| 2 | ตรวจสอบข้อมูล | (ไม่มี) | ReviewRow list + ปุ่มยืนยัน |

หน้านี้ยังรองรับ **prefill** จาก route param (เพื่อรับข้อมูลจาก scan flow → AddPetScan → AddPetMicrochip → AddPetManual)

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | array ที่ append เมื่อ submit สำเร็จ |
| `breedOptions` | `data/breeds.ts` | breed list ตาม species |
| `SPECIES` (local) | inline | metadata ของแต่ละ species + emoji + photo |
| `BREEDS` (local — note ใช้จาก breedOptions) | `data/breeds.ts` | dropdown options ตาม species |
| `route.params.prefill?` | navigation | ค่าจาก scan flow (name, breed, birthDate, microchipId, ...) |
| `route.params.startStep?` | navigation | กระโดดไปขั้นตอนนั้นเลย (สำหรับ resume) |

---

## 3. Step Flow

```
0 ─────► 1 ─────► 2 ─────► submit → mockPets.push → goBack/Pet List
   ▲        ▲        ▲
   └────────┴────────┘  ปุ่ม "ย้อนกลับ"
```

#### `canProceed` rule (ปุ่ม Next enabled เมื่อใด)

```
stepIndex === 0  →  !!species
stepIndex === 1  →  name.trim().length > 0
stepIndex === 2  →  true (submit)
```

---

## 4. Widget Breakdown

### 4.1 Top AppBar

```
[<-]   ตรวจสอบข้อมูล
       ตรวจสอบความถูกต้องก่อนบันทึก
```

- back : ถ้า `stepIndex > 0` → `setStepIndex(prev - 1)` ; ถ้า 0 → `goBack()`
- title + subtitle ตาม `STEPS[stepIndex]`

### 4.2 Step Progress Indicator

- 3 dots/segments แสดงความคืบหน้า
- ขับเคลื่อนด้วย `progress` SharedValue (`withTiming(320ms, easeInOutCubic)`)
- Active dot : สี primary, ใหญ่ขึ้น
- Past dots : สี primary แต่เล็ก
- Future dots : สีเทา

### 4.3 Avatar Display

- แสดงด้านบนตลอดทุก step (เปลี่ยนตาม `species`)
- ถ้ามี `speciesPhoto` (เช่น สุนัข, แมว, กระต่าย) → render Image
- ถ้าไม่มี → emoji 56pt + dashed border (`avatarDashed`)

### 4.4 Step 0 — เลือกชนิดสัตว์เลี้ยง

```
Grid 2 columns × 2 rows :
┌────────────┐ ┌────────────┐
│ 🐶 สุนัข    │ │ 🐱 แมว     │
└────────────┘ └────────────┘
┌────────────┐ ┌────────────┐
│ 🐰 กระต่าย  │ │ 🐾 อื่นๆ   │
└────────────┘ └────────────┘
```

- กดเลือก → `setSpecies(key)`
- Active : สีพื้น primary, ตัวอักษรสีขาว
- Inactive : สีพื้นขาว + border, ตัวอักษรเข้ม

### 4.5 Step 1 — ข้อมูลพื้นฐาน

ฟิลด์เรียงแนวตั้ง :

| Field | Component | Note |
|---|---|---|
| ชื่อ | FormField | required |
| สายพันธุ์ | DropdownField (`options=breedOptions[species]`) | dropdown |
| สี | FormField | optional |
| น้ำหนัก (กก.) | FormField (decimal-pad) | optional |
| เพศ | gender chips inline | required (default "male") |
| วันเกิด | FormField | text input (ยังไม่มี date picker จริง) |
| ไมโครชิป | FormField | optional, ตัวเลขอย่างเดียว |
| ทำหมัน | toggle chips (yes/no) | default false |

#### Gender chips (inline)

```
[♂ ผู้]    [♀ เมีย]
```

Active : สีพื้น = accent (`#4A8FD6` / `#D6478D`)

#### Neuter toggle (chips)

```
[ใช่]   [ไม่]
```

Active : สีพื้น primary

### 4.6 Step 2 — ตรวจสอบข้อมูล

`ReviewRow(label, value)` list :

```
ชนิด          : สุนัข
ชื่อ           : ข้าวปั้น
สายพันธุ์       : ชิบะ อินุ
สี             : ส้มขาว
น้ำหนัก         : 9.4 กก.
เพศ            : ผู้
วันเกิด         : 2022-08-12
ไมโครชิป       : 900164000123456
ทำหมัน         : ใช่
```

ค่าเปล่า → แสดง `'-'`

### 4.7 Bottom Action Bar

#### Step 0–1
```
[← ย้อนกลับ]    [ถัดไป →]
```
- `ถัดไป` disabled ถ้า !canProceed

#### Step 2
```
[← ย้อนกลับ]    [✓ บันทึก]
```
- กด → push เข้า `mockPets` + popTo PetsList

---

## 5. State Management

### 5.1 React State

| State | ค่าเริ่มต้น | หน้าที่ |
|---|---|---|
| `stepIndex` | clamp(`startStep`, 0, 2) | step ปัจจุบัน |
| `species` | `'dog'` | ชนิดสัตว์เลี้ยง |
| `gender` | `'male'` | เพศ |
| `name` | `prefill?.name ?? ''` | ชื่อ |
| `breed` | `prefill?.breed ?? ''` | สายพันธุ์ |
| `birthDate` | `prefill?.birthDate ?? ''` | วันเกิด |
| `weight` | `''` | น้ำหนัก (string ยังไม่ parse) |
| `color` | `''` | สี |
| `microchipId` | `prefill?.microchipId ?? ''` | ไมโครชิป |
| `neutered` | `prefill?.neutered ?? false` | ทำหมัน |

### 5.2 Refs / Memos

- `scrollRef` : scroll to top เมื่อเปลี่ยน step (`useRef<ScrollView>`)
- `speciesMeta` : derived จาก `SPECIES.find(species)`

### 5.3 Reanimated SharedValues

| SharedValue | หน้าที่ |
|---|---|
| `progress` | step animation (0..2) |

---

## 6. Event Flow / Navigation

```
[Back]
├─ stepIndex > 0 → setStepIndex(prev - 1) + scrollTo(0)
└─ stepIndex = 0 → navigation.goBack()

[Next]
└─ canProceed → setStepIndex(prev + 1) + scrollTo(0)

[Save (step 2)]
├─ build new Pet { id: timestamp, ... }
├─ mockPets.push(newPet)
└─ navigation.popTo('PetsList' / 'Main')

[Species tile tap]   → setSpecies(key)
[Field input]        → setX(value)
[Gender chip]        → setGender(g)
[Neuter chip]        → setNeutered(b)
```

---

## 7. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| `prefill` มาจาก scan แต่ species ไม่ระบุ | default = 'dog' |
| `startStep` < 0 หรือ > 2 | clamp ไป 0..2 |
| ผู้ใช้กรอกน้ำหนักผิดรูปแบบ | `Number(weight)` = NaN → fallback เป็น 0 |
| ผู้ใช้กรอกไมโครชิปมีตัวอักษรอื่น | ไม่มี validation strict — save ได้ |
| `species` change → breed list เปลี่ยน | ไม่ reset breed (อาจเหลือค่าเก่า) |
| Step 2 → save → กลับไป step 1 → save อีก | สร้าง pet ซ้ำ (id ใช้ Date.now() อาจชนกัน) |
| `name.trim() === ''` ใน step 1 | next button disabled |

---

## 8. ส่วนที่อาจปรับในอนาคต

- date picker จริงสำหรับวันเกิด + วันที่ทำหมัน
- breed list reset เมื่อ species เปลี่ยน
- validation รอบ ๆ field (ไม่ใช่เฉพาะ name)
- generate id แบบ uuid แทน Date.now() (กันชน)
- แสดง preview ของรูปสัตว์เลี้ยง (อนาคตเพิ่ม upload ได้)
- รองรับ prefill ครบทุก field (รวม weight, color, gender จาก scan)
