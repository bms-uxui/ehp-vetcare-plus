# เอกสารหน้า Pets List Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Pets List (`src/screens/PetsListScreen.tsx`)

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [ค่าที่คำนวณ (Derived Values)](#3-ค่าที่คำนวณ-derived-values)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Hero Section](#41-hero-section)
   - [4.2 Add + Edit-Toggle Row](#42-add--edit-toggle-row)
   - [4.3 Pet Card](#43-pet-card)
   - [4.4 Edit Mode (Reorder)](#44-edit-mode-reorder)
   - [4.5 Loading Skeleton](#45-loading-skeleton)
   - [4.6 Sticky AppBar](#46-sticky-appbar)
5. [State Management Summary](#5-state-management-summary)
6. [Event Flow / Navigation Map](#6-event-flow--navigation-map)
7. [Edge Cases & Fallbacks](#7-edge-cases--fallbacks)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้า Pets List แสดงรายการสัตว์เลี้ยงของผู้ใช้ในรูปแบบการ์ดที่มีสีต่างกันตามตัว ผู้ใช้สามารถเข้าโหมด **edit** เพื่อจัดเรียงลำดับการ์ดด้วยการลาก (drag-and-drop) ได้ และเข้าหน้ารายละเอียดของน้องโดยกดที่การ์ดในโหมดปกติ

โครงสร้างหลัก
- **Hero** : หัวเรื่อง + รูปประกอบ + AppBackground gradient
- **Add / Edit-toggle row** : ปุ่ม "เพิ่มสัตว์เลี้ยง" + ไอคอนสลับโหมดจัดเรียง (เมื่ออยู่ในโหมด edit จะกลายเป็นปุ่ม "เสร็จสิ้น")
- **Pet cards list** : การ์ดของน้องแต่ละตัว รองรับการลาก-ย้ายในโหมด edit
- **Sticky AppBar** : header ที่ fade-in เมื่อ scroll ผ่าน hero

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | ประเภทข้อมูล |
|---|---|---|
| `mockPets` | `data/pets.ts` | รายการน้องทั้งหมดของผู้ใช้ |
| `petAgeString(birthDate)` | `data/pets.ts` | helper แปลงวันเกิด → "X ปี Y เดือน Z วัน" |
| `Pet` (type) | `data/pets.ts` | type ของสัตว์เลี้ยง |

**หมายเหตุ** : `mockPets` เป็น array ที่ mutate ได้ (mutable) เมื่อผู้ใช้กด "เสร็จสิ้น" ใน edit mode `mockPets.splice(0, length, ...reordered)` จะถูกเรียกเพื่อ persist ลำดับใหม่ในเซสชันปัจจุบัน

---

## 3. ค่าที่คำนวณ (Derived Values)

```typescript
orderedPets        // useMemo([petOrder]) — รายการน้องเรียงตาม petOrder ปัจจุบัน
                   //   = petOrder.map(id => mockPets.find(p => p.id === id))
                   //   ตัด nullable ทิ้งด้วย .filter

accentByPetId      // useMemo([]) — Map<petId, CardAccent>
                   //   สร้างครั้งเดียวจาก mockPets ตามลำดับเริ่มต้น
                   //   ใช้เพื่อ "สีของน้องไม่เปลี่ยนระหว่างลาก"
```

`CARD_PALETTE` = 6 สีที่หมุนเวียน (sky blue, warm amber, fresh mint, pink-purple, coral, lavender)

---

## 4. Widget Breakdown

### 4.1 Hero Section

```
+----------------------------------------+
| สัตว์เลี้ยง                              |
| รวมข้อมูลสัตว์เลี้ยงของคุณไว้ในที่เดียว    |
|                                  🐶  |
+----------------------------------------+
```

- **HERO_HEIGHT** = 220 + insets.top
- พื้นหลัง gradient `#FFF2DC` → `#FFFDFB`
- รูปประกอบ : `pet-profile-hero.png` วางขวา-ล่าง
- ฝัง bottom-fade gradient เพื่อกลืนเข้ากับสีพื้นด้านล่าง

### 4.2 Add + Edit-Toggle Row

#### โหมดปกติ (editMode=false)

```
+--------------------------+ +-----+
| + เพิ่มสัตว์เลี้ยง         | |  ↕  |
+--------------------------+ +-----+
   ปุ่ม primary (มี shimmer)   ปุ่มไอคอน
```

- ปุ่ม primary มี **shimmer animation** ทำงานวนทุกประมาณ 2.7s
- ปุ่มไอคอน `ArrowUpDown` → กดเพื่อเข้า edit mode

#### โหมด Edit (editMode=true)

```
+----------------------------------+
| ✓ เสร็จสิ้น                      |
+----------------------------------+
   ปุ่ม primary
```

- กด "เสร็จสิ้น" → `finishEdit()` → mutate `mockPets` ตามลำดับใหม่ + `setEditMode(false)`

### 4.3 Pet Card

```
+----------------------------------------+
| [photo] | ชื่อน้อง                       |  ← cardTop (สีขาว)
| circle  +-------------------------------+
|         | สายพันธุ์   น้ำหนัก             |
| [♂/♀]   | --------    ----              |  ← cardBottom (สีตามน้อง)
| chip    | อายุ                          |
| pill    | --------                      |
+----------------------------------------+
```

#### Layout
- **`cardShadow`** : wrapper ที่มี marginHorizontal + shadow
- **`card`** : minHeight 174px, borderRadius `radii.xl`, สีพื้นจาก `accent.bg`
  - **`cardTop`** (สีขาว) : ชื่อน้อง
  - **`cardBottom`** (สีพื้นน้อง + paw pattern) : สายพันธุ์ / น้ำหนัก / อายุ
- **`avatarWrap`** (ลอย absolute ที่ left:14, top:18) : รูป + gender badge
- **`chipPillWrap`** (absolute, top:138) : เลขไมโครชิป

#### Content States

| field | ค่าจริง | fallback |
|---|---|---|
| `pet.photo` | `<Image>` | emoji 44pt |
| `pet.microchipId` | `formatMicrochip(id)` (แบ่ง 3 ตัวอักษร-) | "ไม่พบเลขไมโครชิป" |
| `pet.gender` | Mars (ผู้) / Venus (เมีย) icon | — |

### 4.4 Edit Mode (Reorder)

ใช้ `react-native-draggable-flatlist` เป็น **scroll container ระดับหน้าจอ** (ไม่ใช่ wrap ScrollView)

#### ส่วนประกอบ

| Element | หน้าที่ |
|---|---|
| `<ScaleDecorator activeScale={1.08}>` | ขยายการ์ดที่ลากอยู่ 8% |
| Drag handle (`GripVertical` icon) | ขวาของการ์ด, longPress 120ms = เริ่มลาก |
| `onDragEnd({data})` | update `petOrder` ตามลำดับใหม่ |

#### พฤติกรรม

- `activationDistance` = 8 (edit mode) / 9999 (โหมดปกติ ปิดการลาก)
- `autoscrollSpeed = 140` `autoscrollThreshold = 100` → ลากใกล้ขอบบน/ล่างจะ scroll ตาม
- **กดการ์ด** : ปิดในโหมด edit (`onPress = undefined`), เปิดในโหมดปกติ → `navigation.navigate('PetDetail', { petId })`
- **สีของน้อง** : ใช้ `accentByPetId.get(pet.id)` → ตรึงสีตามตัวน้อง ไม่ขึ้นกับ index ปัจจุบัน
  - ป้องกันการ "เปลี่ยนสี" ระหว่างลาก

#### หมายเหตุสำคัญ

- ตั้ง `app.json` → `newArchEnabled: false` เพราะ library v4 ยังเข้ากับ Fabric (New Architecture) ไม่ดี เกิดอาการ "phantom slot" หลังปล่อยมือ

### 4.5 Loading Skeleton

- เมื่อ `loading=true` (เริ่มเปิดหน้า, flip เป็น false หลัง 700ms)
- แสดง 3 การ์ด `PetCardSkeleton` ที่มี shimmer sweeping animation
- การ์ด skeleton ใช้ `cardSized` (`minHeight: 174`) เหมือนการ์ดจริง — กันไม่ให้ความสูง "เด้ง" เมื่อสลับเป็นข้อมูลจริง

### 4.6 Sticky AppBar

- ใช้ component `StickyAppBar` (shared)
- `fadeStartAt = HERO_HEIGHT - 40` (180)
- `fadeEndAt = HERO_HEIGHT + 10` (230)
- title : `ข้อมูลสัตว์เลี้ยง`
- `scrollY` (SharedValue) ถูก update ผ่าน `onScrollOffsetChange` worklet ของ `DraggableFlatList`

---

## 5. State Management Summary

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `loading` | `boolean` | mock skeleton state (true 700ms แรก) |
| `editMode` | `boolean` | สลับ UI ระหว่างโหมดปกติ ↔ edit |
| `petOrder` | `string[]` | array ของ petId ตามลำดับปัจจุบัน |

### 5.2 Refs

| Ref | ประเภท | หน้าที่ |
|---|---|---|
| (ไม่มี) | — | DraggableFlatList จัดการ ref ภายในเอง |

### 5.3 Reanimated SharedValues

| SharedValue | ค่า | หน้าที่ |
|---|---|---|
| `scrollY` | scroll Y position | sync StickyAppBar fade |
| `shimmer` | 0..1 | shimmer ของปุ่ม "เพิ่มสัตว์เลี้ยง" |
| `skeleton` | 0..1 | shimmer ของ skeleton cards |

### 5.4 Memoized Callbacks

- `onAddPet`, `onOpenPet`, `finishEdit`, `onDragEnd`, `renderDraggableItem`, `renderHeader` → ทุกตัวห่อด้วย `useCallback` เพื่อให้ `PetCard` (ที่ห่อด้วย `memo`) ไม่ re-render ระหว่างลาก

---

## 6. Event Flow / Navigation Map

```
[ปุ่ม + เพิ่มสัตว์เลี้ยง]      → navigate AddPet
[ปุ่ม ↕ (edit toggle)]         → setEditMode(true)
[ปุ่ม ✓ เสร็จสิ้น]              → finishEdit() → mutate mockPets + setEditMode(false)

[Pet card — โหมดปกติ]          → navigate PetDetail { petId }
[Pet card — โหมด edit]         → ไม่ทำอะไรกับ tap
[Drag handle (long press)]     → drag() → DFL ทำการลาก
[Drop ปลายทาง]                 → onDragEnd({data}) → setPetOrder
```

---

## 7. Edge Cases & Fallbacks

| สถานการณ์ | พฤติกรรม |
|---|---|
| `mockPets` ว่าง | DraggableFlatList แสดง list ว่าง (ไม่ crash) |
| สัตว์เลี้ยงไม่มี photo | แสดง emoji 44pt แทน |
| `pet.microchipId` ว่าง | แสดง "ไม่พบเลขไมโครชิป" |
| pet ถูกเพิ่มจากหน้าอื่นหลัง mount | `useEffect([])` reconcile : merge `petOrder` ปัจจุบัน + `mockPets.id` ที่ขาดเข้าท้าย |
| pet ถูกลบจากหน้าอื่น | `petOrder.filter(id => mockPets.includes(id))` กรองออก |
| ลากการ์ดไปยังตำแหน่งเดิม | `onDragEnd` ยัง fire แต่ลำดับเหมือนเดิม |
| กดการ์ดในโหมด edit (ตั้งใจหรือไม่ตั้งใจ) | ไม่นำทาง (onPress=undefined) |

---

## 8. ส่วนที่อาจปรับในอนาคต

- `mockPets` ↔ context/store จริง (ตอนนี้ mutate ผ่าน `splice` ไม่ใช้ pattern reactive)
- เพิ่มฟีเจอร์ "ลบสัตว์เลี้ยง" ในโหมด edit
- มากกว่า 6 ตัว → `CARD_PALETTE` วนซ้ำสี ควรขยายหรือใช้สี gradient
- ขนาด skeleton สูง 174px อาจไม่ตรง 100% กับการ์ดจริง (ของจริง dynamic height) → consider `getItemLayout`
- กลับสู่ New Architecture เมื่อ library `react-native-draggable-flatlist` รองรับสมบูรณ์
