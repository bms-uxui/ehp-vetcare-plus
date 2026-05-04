# เอกสารหน้า Home Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Home (`src/screens/HomeScreen.tsx`)

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
   - [2.1 จาก src/data/](#21-จาก-srcdata)
   - [2.2 Helper / Format Functions](#22-helper--format-functions)
3. [ค่าที่คำนวณ (Derived Values)](#3-ค่าที่คำนวณ-derived-values)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Banner Carousel](#41-banner-carousel)
   - [4.2 Pets Row (Glass Card)](#42-pets-row-glass-card)
   - [4.3 Bento 2-Col](#43-bento-2-col)
   - [4.4 Vet Service Wide Card](#44-vet-service-wide-card)
   - [4.5 Products Grid](#45-products-grid)
   - [4.6 Empty Footer](#46-empty-footer)
5. [State Management Summary](#5-state-management-summary)
   - [5.1 React State](#51-react-state)
   - [5.2 Refs](#52-refs)
   - [5.3 Reanimated SharedValues](#53-reanimated-sharedvalues)
   - [5.4 Animated Styles](#54-animated-styles)
6. [Event Flow / Navigation Map](#6-event-flow--navigation-map)
7. [Edge Cases & Fallbacks](#7-edge-cases--fallbacks)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้า Home คือหน้าแรกที่ผู้ใช้เห็นหลัง login เข้ามาในแอป รวบรวมข้อมูลสำคัญของน้อง ๆ ในที่เดียว ประกอบด้วย 6 ส่วนหลัก เรียงจากบนลงล่าง

| ลำดับ | ส่วน | หน้าที่ |
|---|---|---|
| 1 | **Banner Carousel** | แสดงนัดหมาย/บริการที่ใกล้จะถึง สลับอัตโนมัติทุก 8 วินาที |
| 2 | **Pets Row** | รายการสัตว์เลี้ยง (สูงสุด 3 ตัว) + ปุ่มเพิ่ม |
| 3 | **Bento 2-Col** | ค่าใช้จ่ายเดือนนี้ + เวลาให้อาหารถัดไป |
| 4 | **Vet Service Card** | การ์ดบริการสัตวแพทย์ (จองนัด/ปรึกษาออนไลน์) |
| 5 | **Products Grid** | สินค้าแนะนำ 6 ชิ้น |
| 6 | **Empty Footer** | CTA ไปหน้าร้านค้า |

---

## 2. แหล่งข้อมูล (Data Sources)

ปัจจุบัน HomeScreen ดึงข้อมูลจาก **mock data** ทั้งหมด (ยังไม่เชื่อมต่อ backend จริง) ดังนี้

### 2.1 จาก `src/data/`

| ตัวแปร | Source | ประเภทข้อมูล |
|---|---|---|
| `mockPets` | `data/pets.ts` | รายชื่อสัตว์เลี้ยงทั้งหมดของผู้ใช้ |
| `mockAppointments` | `data/appointments.ts` | นัดหมายทุกประเภท (`upcoming`, `completed`, ...) |
| `mockProducts` | `data/products.ts` | สินค้าทั้งหมดในระบบ |
| `mockExpenses` | `data/expenses.ts` | รายการค่าใช้จ่ายของผู้ใช้ |
| `mockSchedules` | `data/reminders.ts` | ตารางให้อาหาร/น้ำ |
| `mockReminders` | `data/reminders.ts` | การแจ้งเตือน (วัคซีน, นัดหมาย, ฯลฯ) |
| `DEFAULT_MONTHLY_BUDGET` | `data/expenses.ts` | งบประมาณรายเดือนค่าเริ่มต้น |

### 2.2 Helper / Format Functions

| Function | หน้าที่ |
|---|---|
| `monthKey(iso)` | แปลง ISO date → `YYYY-MM` สำหรับเช็คเดือน |
| `fmtBaht(n)` | จัดรูปแบบจำนวนเงินเป็นบาท |
| `thFullDate(iso)` | แปลง ISO → "30 เม.ย. 2569" |
| `thWeekday(iso)`, `thDateShort(iso)` | สำหรับ banner วันที่นัด |
| `thTimeOfDayLabel(time)` | แปลงเวลา HH:MM → "มื้อเช้า/มื้อกลางวัน/มื้อเย็น" |

---

## 3. ค่าที่คำนวณ (Derived Values)

ทำงานในทุกครั้งที่ component re-render (ไม่ได้ memoize เพราะข้อมูลเป็น mock):

```
vaccineReminder        = แจ้งเตือนวัคซีนตัวแรก (mockReminders ที่ type='vaccine')
upcomingAppts          = นัดที่ status='upcoming' เรียงตามวันที่ (เก่า→ใหม่)
nextAppt               = นัดถัดไปที่ "petId ≠ vaccineReminder.petId"
                         → ทำให้ banner 1 และ banner 2 แสดงคนละน้อง
                         → ถ้าไม่มีตัวเลือกอื่น ใช้ตัวแรกของ list

thisMonth              = "YYYY-MM" ของวันนี้
monthExpenses          = รายการ expenses ที่อยู่ในเดือนปัจจุบัน
monthTotal             = ผลรวมค่าใช้จ่ายเดือนนี้
remaining              = DEFAULT_MONTHLY_BUDGET - monthTotal

nextFeeding            = ตารางให้อาหารตัวแรกที่ enabled=true
recommendedProducts    = mockProducts 6 ชิ้นแรก
```

---

## 4. Widget Breakdown

### 4.1 Banner Carousel

#### โครงสร้าง 4 ชั้น (จากหลังไปหน้า)

1. **Layer 1 – Background images** : รูปพื้นหลังของแต่ละ banner ที่ crossfade กัน (ใช้ `item.illustration` หรือสีพื้น `item.accent`)
2. **Layer 2 – Top fade gradient** : gradient ครีมบางส่วนเพื่อให้ logo และ status bar อ่านง่าย
3. **Layer 3 – Bottom fade gradient** : gradient ครีมที่ก้น banner เพื่อให้เนื้อหาด้านล่างอ่านง่ายและกลืนกับสีหน้า
4. **Layer 4 – Banner pages stack** : ข้อความ + รูปประกอบ + สวยป์ overlay

#### `BannerItem` (Type)

```typescript
{
  date: string;                       // "30 เม.ย. 2569" หรือ "พร้อมให้บริการตอนนี้"
  pet?: string;                       // ชื่อน้อง (ถ้ามี)
  petId?: string;                     // pet.id สำหรับ floating avatar
  actionTop: string;                  // "มีนัดบริการ" / "ปรึกษาสัตวแพทย์"
  actionBottom: string;               // typeLabel ของบริการ
  clinic: string;                     // ชื่อคลินิก / คำอธิบายเพิ่มเติม
  cta: string;                        // ข้อความปุ่ม → "ดูรายละเอียด" / "เริ่มสนทนา"
  onPress: () => void;                // Action เมื่อกด CTA
  illustration?:                      // (option) รูปพื้นหลัง full-bleed (PNG)
  cornerIllustration?:                // (option) รูปมุมขวา-ล่าง (PNG)
  IllustrationSvg?:                   // (option) รูปมุมขวา-ล่าง (SVG component)
  accent: string;                     // สี fallback ถ้าไม่มีรูป
}
```

#### Banner ที่ Render

| Banner | เงื่อนไข | ใช้รูป | Action |
|---|---|---|---|
| #1 วัคซีน | เสมอ (มี fallback) | `VaccinationIllus` (SVG) + Pet Avatar | navigate → `AppointmentDetail` |
| #2 นัดถัดไป | ถ้ามี `nextAppt` | `VaccinationIllus` (SVG) + Pet Avatar | navigate → `AppointmentDetail` |
| #3 Tele-Vet | เสมอ | `Hero-VetPage.png` (PNG corner) | navigate → tab `Vet` |

#### State ของ Carousel

```typescript
bannerIndex            // index ของ banner ที่กำลังแสดง (0..n-1)
isUserDragging         // ref boolean: ผู้ใช้กำลังจับลากอยู่หรือไม่
o0, o1, o2, o3         // SharedValue<number> สำหรับ opacity ของแต่ละ banner
swipeRef               // ref ของ ScrollView ที่ทำหน้าที่ปั้น swipe
```

#### พฤติกรรมของ Carousel

- **Auto-advance** : `setInterval` ทุก 8000ms เปลี่ยน `bannerIndex` ไปยัง banner ถัดไป
  - ถ้า `isUserDragging = true` จะ skip รอบนั้น (พักไว้)
- **Crossfade** : `useEffect([bannerIndex])` จะ animate `opacityValues[i]` → 1 (active) / 0 (inactive) ด้วย `withTiming(220ms)`
- **Manual swipe** : ScrollView โปร่งใสซ้อนทับด้านบน รองรับ horizontal pan
  - `onScrollBeginDrag` → set `isUserDragging = true`
  - `onMomentumScrollEnd` → คำนวณ index ใหม่ แล้ว set `bannerIndex` + reset `isUserDragging = false`
- **Sync swipe ↔ index** : เมื่อ `bannerIndex` เปลี่ยนโดยไม่ได้มาจากการลาก (auto-advance) → `swipeRef.scrollTo` กลับไปที่ตำแหน่ง index นั้น

#### Dot Indicator

แต่ละจุดมี 2 ค่าที่ animate พร้อมกันตามค่า opacity ของ banner นั้น ๆ

| Property | Inactive (opacity=0) | Active (opacity=1) |
|---|---|---|
| Width | 6px | 18px |
| Color | `#D0D0D4` | `semantic.primary` |

#### Floating Pet Avatar

แสดงเฉพาะ banner ที่มี `petId` (banner วัคซีน + นัดถัดไป) - ใช้ component `PetAvatar` ขนาด 56px วางลอยอยู่บน illustration ใช้ `petId` lookup ใน `mockPets` แบบ real-time

---

### 4.2 Pets Row (Glass Card)

#### Render
- แสดงน้อง 3 ตัวแรกจาก `mockPets.slice(0, 3)` + ปุ่ม "เพิ่ม"
- แต่ละตัวเป็น `Pressable` → navigate `PetDetail` พร้อม `petId`

#### States
- **มี photo** : แสดงรูปจริง
- **ไม่มี photo** : fallback เป็น emoji ของน้อง (`pet.emoji`)

#### Action
- กดน้อง → `navigation.navigate('PetDetail', { petId })`
- กดปุ่มเพิ่ม → `navigation.navigate('AddPet')`

---

### 4.3 Bento 2-Col

#### Tile 1 — ค่าใช้จ่ายเดือนนี้
- แสดง **"คงเหลือ"** = `DEFAULT_MONTHLY_BUDGET - monthTotal`
- **สีตัวเลข** :
  - ถ้า `remaining < 0` → สีแดง `#C25450`
  - ถ้า `remaining ≥ 0` → สีน้ำตาล `#B8552B`
- กด → navigate `Expenses`

#### Tile 2 — เวลาให้อาหาร
- แสดง **"มื้อเช้า/กลางวัน/เย็น"** จาก `thTimeOfDayLabel(nextFeeding.time)`
- แสดงชื่อน้อง + เวลา
- ถ้าไม่มี `nextFeeding` → แสดง "—" และ "--:--"
- กด → navigate `Notifications`

---

### 4.4 Vet Service Wide Card

- การ์ด wide ครอบ 2 บริการ : "จองนัดคลินิก" + "ปรึกษาออนไลน์"
- กด → navigate `BookAppointment`
- ใช้ `vet-service.png` ทางขวาเป็น illustration

---

### 4.5 Products Grid

- แสดง 6 ชิ้นแรกจาก `mockProducts` ใน grid 2 คอลัมน์
- ใช้ component `ProductTile` ที่ shared ระหว่างหน้า Home + ร้านค้า
- กดสินค้า → `navigation.navigate('ProductDetail', { productId })`

---

### 4.6 Empty Footer

- แสดง CTA "เข้าสู่ร้านค้า" สำหรับผู้ใช้ที่ไม่เจอสินค้าที่ต้องการ
- กด → navigate `PetShop`

---

## 5. State Management Summary

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `bannerIndex` | `number` | banner ที่กำลังแสดง |

### 5.2 Refs

| Ref | ประเภท | หน้าที่ |
|---|---|---|
| `isUserDragging` | `useRef<boolean>` | กำลังลาก banner อยู่หรือไม่ (ไม่ trigger render) |
| `swipeRef` | `useRef<ScrollView>` | reference สำหรับ scrollTo เมื่อ auto-advance |

### 5.3 Reanimated SharedValues

| SharedValue | ค่า | หน้าที่ |
|---|---|---|
| `o0, o1, o2, o3` | 0..1 | opacity ของแต่ละ banner สำหรับ crossfade |

### 5.4 Animated Styles

- `s0..s3` : opacity ของ banner page (ใช้กับ background + foreground stack)
- `dot0..dot3` : width + color ของ dot indicator (interpolate จาก opacity ของ banner ที่ตรงกัน)

---

## 6. Event Flow / Navigation Map

```
[Logo / Mail icon]
  └─ Mail → navigate Notifications

[Banner CTA]
  └─ ดูรายละเอียด → navigate AppointmentDetail
  └─ เริ่มสนทนา   → navigate Vet (tab)

[Banner Swipe]
  └─ ผู้ใช้ลาก → setBannerIndex + isUserDragging=false (รอบหน้าจะ auto)

[Pets Row]
  ├─ น้อง         → navigate PetDetail { petId }
  └─ + เพิ่ม       → navigate AddPet

[Bento]
  ├─ ค่าใช้จ่าย    → navigate Expenses
  └─ เวลาให้อาหาร → navigate Notifications

[Vet Service]
  └─ จองนัด       → navigate BookAppointment

[Products]
  └─ สินค้า        → navigate ProductDetail { productId }

[Empty Footer]
  └─ เข้าสู่ร้านค้า → navigate PetShop
```

---

## 7. Edge Cases & Fallbacks

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มี `vaccineReminder` | banner แรกใช้ pet `'ข้าวปั้น'` (`p1`) + วันที่วันนี้ |
| ไม่มี `nextAppt` (`upcomingAppts` ว่าง) | banner ที่ 2 ถูก `.filter(Boolean)` ทิ้ง — เหลือแค่ banner 1 + 3 |
| ทุกนัดเป็น petId เดียวกับ vaccineReminder | `nextAppt` fallback เป็น `upcomingAppts[0]` |
| ไม่มี `nextFeeding` (ไม่มี enabled schedule) | Tile แสดง "—" / "--:--" |
| `monthTotal > DEFAULT_MONTHLY_BUDGET` | `remaining` เป็นค่าลบ + แสดงสีแดง |
| สัตว์เลี้ยงไม่มี photo | แสดง emoji แทน (Pets Row) |
| Banner ไม่มี `IllustrationSvg` หรือ `cornerIllustration` | ไม่แสดง illustration ทางขวา (เนื้อหาขยายไปเต็ม) |
| Banner ไม่มี `illustration` | พื้นหลังใช้สี `item.accent` แทน |

---

## 8. ส่วนที่อาจปรับในอนาคต

- ผูก mock data เข้ากับ context/store จริง (ตอนนี้ `mockExpenses`/`mockSchedules` mutate ผ่าน `mockSchedules.splice` ใน screen อื่น แต่ HomeScreen ยังไม่ subscribe ดังนั้นต้องรีเฟรชเอง)
- `useMemo` สำหรับ derived values (`monthExpenses`, `nextAppt`, `bannerItems`) ตอนนี้ recompute ทุก render
- รองรับ Pull-to-refresh เมื่อเชื่อมต่อ backend
