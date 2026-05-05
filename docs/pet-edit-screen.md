# เอกสารหน้า Pet Edit Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Pet Edit (`src/screens/PetEditScreen.tsx`)

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Validation Rules](#3-validation-rules)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 AppBar](#41-appbar)
   - [4.2 Avatar + Camera Picker](#42-avatar--camera-picker)
   - [4.3 ฟอร์มข้อมูล](#43-ฟอร์มข้อมูล)
   - [4.4 Gender Chips](#44-gender-chips)
   - [4.5 Neuter Toggle (animated)](#45-neuter-toggle-animated)
   - [4.6 Photo Picker Sheet](#46-photo-picker-sheet)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases](#7-edge-cases)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้าแก้ไขข้อมูลสัตว์เลี้ยง 1 ตัว ใช้ form-based UI พร้อม validation real-time + animated neuter toggle และ photo picker (กล้อง / คลังภาพ)

โครงสร้าง :
- AppBar : back + title + save
- Avatar (กลม, ใหญ่) : กดเปิด photo picker
- ฟอร์ม : ชื่อ, สายพันธุ์ (dropdown), สี, น้ำหนัก, เพศ (chips), ไมโครชิป, ทำหมัน + วันที่
- ใช้ `KeyboardAwareScrollView` รองรับการ scroll ขึ้นเมื่อ keyboard ขึ้น (Android fix)

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | หา pet ด้วย `route.params.petId` |
| `breedOptions` | `data/breeds.ts` | breed list ตาม species (สำหรับ dropdown) |
| `Pet` (type) | `data/pets.ts` | type ของ draft |

---

## 3. Validation Rules

```typescript
function validatePet(p: Pet): PetErrors {
  if (!p.name.trim())              errs.name = 'กรุณากรอกชื่อ'
  if (!p.breed.trim())             errs.breed = 'กรุณากรอกสายพันธุ์'
  if (!p.color.trim())             errs.color = 'กรุณากรอกสี'
  if (weightKg <= 0)               errs.weightKg = 'น้ำหนักต้องมากกว่า 0'
  if (microchipId && !/^\d+$/)     errs.microchipId = 'ไมโครชิปต้องเป็นตัวเลข'
}
```

`hasErrors = some value truthy` → blocks save button

---

## 4. Widget Breakdown

### 4.1 AppBar

```
[<-]   แก้ไขข้อมูล   [บันทึก]
```

- `บันทึก` text-button : disabled (opacity 0.4) ถ้า `hasErrors`

### 4.2 Avatar + Camera Picker

- Avatar 132×132 borderRadius full
- ถ้ามี `pet.photo` → render Image ; ไม่มี → emoji 56pt
- Camera badge มุมขวา-ล่าง
- กด avatar → เปิด `pickerOpen` modal sheet

### 4.3 ฟอร์มข้อมูล

ใช้ shared component `<TextField>` (underline) และ `<DropdownField>` (bottom sheet picker)

| Field | Component | Source |
|---|---|---|
| ชื่อ | TextField | `draft.name` |
| สายพันธุ์ | DropdownField (`options=breedOptions[species]`) | `draft.breed` |
| สี | TextField | `draft.color` |
| น้ำหนัก (กก.) | TextField (`keyboardType="decimal-pad"`) | `draft.weightKg` |
| ไมโครชิป | TextField | `draft.microchipId` |

แต่ละ field แสดง error caption ใต้ field เมื่อ blur แล้วยังมี error

### 4.4 Gender Chips

```
[♂ ผู้]    [♀ เมีย]
```

- 2 chips กว้าง min 72px
- Active : สีพื้น = accent color (`#4A8FD6` male / `#D6478D` female), ข้อความขาว
- Inactive : สีพื้นขาว, border = accent, ข้อความ accent

### 4.5 Neuter Toggle (animated)

- Custom checkbox + label "ทำหมันแล้ว"
- ใช้ `useSharedValue(neutered ? 1 : 0)` + `withTiming(220ms)` + `interpolateColor`
- เมื่อ `draft.neutered === true` → กล่องเปลี่ยนจากขาว → primary, border ตามไป
- ถ้า neutered → expose date field "วันที่ทำหมัน"

### 4.6 Photo Picker Sheet

- เปิดเมื่อกด avatar → modal 3 ตัวเลือก :
  - ถ่ายรูป (`pickFromCamera()`)
  - เลือกจากคลัง (`pickFromLibrary()`)
  - ยกเลิก
- ใช้ `expo-image-picker` request permission
- หลังเลือก → `update('photo', { uri })` + ปิด modal

---

## 5. State Management

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `draft` | `Pet \| null` | snapshot ของ form (clone จาก initial) |
| `pickerOpen` | `boolean` | photo picker sheet |

### 5.2 Reanimated SharedValues

| SharedValue | หน้าที่ |
|---|---|
| `neuterProgress` | 0..1 ขับเคลื่อนสี checkbox neuter |

### 5.3 Animated Styles

| Style | Output |
|---|---|
| `checkboxAnimStyle` | backgroundColor + borderColor interpolate |

---

## 6. Event Flow / Navigation

```
[Back]                       → goBack
[Save]
├─ if (hasErrors) return
├─ mockPets[idx] = draft
└─ navigation.popTo('PetDetail', { petId, flashMessage: 'บันทึกเรียบร้อยแล้ว' })

[Avatar tap]                  → setPickerOpen(true)
[Pick from camera/library]    → ImagePicker → update('photo', { uri })

[Field input]                 → update(key, value) → re-validate
[Gender chip tap]             → update('gender', 'male'/'female')
[Neuter toggle]               → update('neutered', !prev)
```

---

## 7. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| `petId` ไม่มีใน mockPets | render "ไม่พบข้อมูลสัตว์เลี้ยง" |
| ผู้ใช้ปฏิเสธ permission กล้อง/คลัง | ไม่เปิด picker (silent) |
| `weightKg` เป็น NaN (ผู้ใช้พิมพ์ตัวอักษร) | `errs.weightKg` แสดง |
| `microchipId` ว่าง | OK (optional) |
| `microchipId` มีตัวอักษรอื่น | `errs.microchipId` แสดง |
| `species` change → breed list เปลี่ยน | ไม่มีการเลือก species ใน screen นี้ → static |
| neutered → unneutered → save | `neuteredDate` ยังอยู่ใน draft (อาจไม่ clear) |

---

## 8. ส่วนที่อาจปรับในอนาคต

- field "วันที่ทำหมัน" ตอนนี้ไม่มี date picker จริง — ควร integrate `DateTimePicker`
- รองรับการเปลี่ยน species (ต้องล้าง breed)
- ผูก `mockPets` กับ context
- เพิ่มการ edit conditions (โรคประจำตัว) ในหน้านี้
- รองรับหลายรูปต่อสัตว์เลี้ยง 1 ตัว
