# เอกสารหน้า Pet Detail Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Pet Detail (`src/screens/PetDetailScreen.tsx`)

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [ค่าที่คำนวณ (Derived Values)](#3-ค่าที่คำนวณ-derived-values)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Hero Banner](#41-hero-banner)
   - [4.2 Tab Bar (4 แท็บ)](#42-tab-bar-4-แท็บ)
   - [4.3 ข้อมูลทั่วไป (general)](#43-ข้อมูลทั่วไป-general)
   - [4.4 ประวัติสุขภาพ (health)](#44-ประวัติสุขภาพ-health)
   - [4.5 ประวัติวัคซีน (vaccines)](#45-ประวัติวัคซีน-vaccines)
   - [4.6 เวลาให้อาหาร (feeding)](#46-เวลาให้อาหาร-feeding)
   - [4.7 Sticky AppBar](#47-sticky-appbar)
   - [4.8 หมอเหมียว FAB (AI)](#48-หมอเหมียว-fab-ai)
   - [4.9 Toast](#49-toast)
   - [4.10 Bottom Sheet — ที่มาของข้อมูล](#410-bottom-sheet--ที่มาของข้อมูล)
5. [State Management Summary](#5-state-management-summary)
6. [Event Flow / Navigation Map](#6-event-flow--navigation-map)
7. [Edge Cases & Fallbacks](#7-edge-cases--fallbacks)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้ารายละเอียดของน้องที่เลือก แสดงทุกอย่างของสัตว์เลี้ยง 1 ตัว ผ่าน **4 แท็บ** : ข้อมูลทั่วไป / ประวัติสุขภาพ / ประวัติวัคซีน / เวลาให้อาหาร พร้อมปุ่ม **AI หมอเหมียว** สำหรับขอคำปรึกษาเบื้องต้น

โครงสร้าง
- **Hero banner** : รูปน้อง full-bleed + ชื่อ + อายุ
- **Tab bar (horizontal scroll)** : สลับ 4 แท็บ
- **Pager (horizontal scroll, paged)** : เนื้อหาของแต่ละแท็บ swipe ได้
- **Sticky AppBar** : back, edit, title (fade-in)
- **AI FAB** : "คุยกับหมอเหมียว" + animation ลูปทุก 6s
- **Toast** : แจ้ง flashMessage จากหน้าก่อนหน้า

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockPets` | `data/pets.ts` | หา pet ด้วย `petId` (route param) |
| `mockSchedules` | `data/reminders.ts` | ตารางให้อาหารเฉพาะของน้อง |
| `pet.visits` | `Pet.visits` | ประวัติการเข้ารับบริการ |
| `pet.vaccines` | `Pet.vaccines` | ประวัติวัคซีน |
| `pet.conditions` | `Pet.conditions` | โรคประจำตัว |
| `route.params` | navigation | `petId`, `flashMessage?` |

### Helper

- `thDate(iso)` / `thDateShort(iso)` — รูปแบบวันที่ไทย
- `petAgeFull(birthDate)` — "X ปี Y เดือน Z วัน"

---

## 3. ค่าที่คำนวณ (Derived Values)

```
initialPet         = mockPets.find(p => p.id === petId)
livePet            = state ที่ refresh ทุกครั้งเข้าหน้า (useFocusEffect)
schedules          = mockSchedules.filter(s.petId === petId)
tabIndex           = TAB_KEYS.indexOf(tab)

// WeightTrendCard:
visits             = pet.visits ?? []
points             = visits.length >= 2
                       ? visits sorted asc, slice(-4), map(date,kg)
                       : 4 จุดสังเคราะห์จาก pet.weightKg
safeSelected       = clamp(selected, 0, points.length - 1)
delta              = sel.kg - prev.kg (ถ้ามี prev)
deltaColor         = #4FB36C (เพิ่ม) / #C25450 (ลด) / #4A4A50 (เท่าเดิม)
```

---

## 4. Widget Breakdown

### 4.1 Hero Banner

- HERO_HEIGHT = 280
- รูปน้อง (`pet.photo`) full-bleed, anchored top
- รองรับการดึง overscroll → รูปยืดออก (parallax-ish)
- bottom fade gradient → กลืนเข้ากับสีพื้น
- **ข้อความ** : `น้อง<ชื่อ>` (ขนาด font ปรับตาม window width) + อายุเต็ม

#### State : รูป / fallback
- มี `pet.photo` → render Image
- ไม่มี → render `pet.emoji` ขนาด 96pt

### 4.2 Tab Bar (4 แท็บ)

```
TAB_KEYS = ['general', 'health', 'vaccines', 'feeding']
TAB_LABELS = {
  general:  'ข้อมูลทั่วไป',
  health:   'ประวัติสุขภาพ',
  vaccines: 'ประวัติวัคซีน',
  feeding:  'เวลาให้อาหาร',
}
```

- horizontal ScrollView (เผื่อแท็บล้น)
- active : สี primary `#9F5266`
- inactive : สี muted `#F5E4E7`
- **2-way sync** : กดแท็บ → setTab → useEffect scroll pager ไปที่ `tabIndex × windowWidth`
- swipe pager → onPagerEnd → คำนวณ index ใหม่ → setTab

### 4.3 ข้อมูลทั่วไป (general)

#### Info Card 1 — Static Info Rows

`InfoRow(label, value)` แสดง :
- วันเกิด — `thDate(birthDate)`
- สายพันธุ์ — `pet.breed`
- น้ำหนัก — "X กก."
- สี — `pet.color.trim() || 'ไม่ระบุ'`
- เพศ — "ผู้" / "เมีย"
- ไมโครชิป (ถ้ามี)

#### Neuter Card

```
+------------------------------+ (i)
| ประวัติการทำหมัน    [🐱]      |
|                              |
| ทำหมันแล้ว ✓ (สีเขียว)         |
| เมื่อ <date>                   |
+------------------------------+
| (i) ปุกปุยสัตวแพทย์ ...        |  (footer แสดงเมื่อ neutered)
+------------------------------+
```

- กดที่ไหนของการ์ดก็ได้ (Pressable wraps the entire card) ถ้า `pet.neutered=true` → เปิด **bottom sheet** "ที่มาของข้อมูล"
- ไม่ทำหมัน → "ยังไม่ได้ทำหมัน" สีดำ ไม่มีเช็ก
- **FYI Info icon** มุมขวาบนของการ์ด (เฉพาะ neutered)
- **รูปประกอบ** `pet-neuter.png` มุมขวา-ล่าง

#### Conditions Card

- โรคประจำตัว → ถ้าไม่มี : "ไม่มีโรคประจำตัว"
- ถ้ามี : join ชื่อด้วย `, `

### 4.4 ประวัติสุขภาพ (health)

#### WeightTrendCard

- header : "แนวโน้มน้ำหนัก" + ช่วง min – max
- **Readout** : น้ำหนักของจุดที่เลือก + delta (`+0.3 กก.`, `คงที่`, `—`)
- **Chart** : 4 bars แนวตั้ง
  - bar height = `chartHeight × (0.3 + 0.7 × ((kg - min) / range))`
  - กด bar → setSelected
  - ใช้ `safeSelected` clamp ป้องกัน `points[selected]` undefined เวลา pet เปลี่ยน

#### Conditions Card (โรคประจำตัว / ภูมิแพ้)

- ถ้า `conditions.length === 0` : "ไม่มีโรคประจำตัว"
- ถ้ามี : list แต่ละ condition → ชื่อ + "ตั้งแต่ <date> · <notes>"

#### Visit Records (ประวัติการเข้ารับบริการ)

- ถ้าไม่มี : "ยังไม่มีประวัติการรักษา"
- มี : VisitCard เรียงตามวันที่ใหม่→เก่า แสดง :
  - วันที่ + คลินิก (header)
  - สัตวแพทย์
  - **Vitals row** : น้ำหนัก / ส่วนสูง (ถ้ามี) / อุณหภูมิ
  - อาการเบื้องต้น
  - การวินิจฉัย
  - ผลตรวจ (Lab / X-ray) — มี type pill
  - รายการยา + จำนวน + วิธีใช้

### 4.5 ประวัติวัคซีน (vaccines)

ถ้าไม่มี → "ยังไม่มีประวัติวัคซีน"

ถ้ามี → render เป็น **timeline**

```
●   วันที่
|   ชื่อวัคซีน           ← ถ้า nextDue >= วันนี้ → highlight สี primary + halo glow
|   คลินิก (numberOfLines=2)
|   [ครั้งถัดไป <date>]   ← pill
|
●   ...
```

- Sort : ใหม่ → เก่า
- หาก `v.nextDue && v.nextDue >= today` → upcoming = true → ใช้สี primary, halo, dot ทึบ
- timeline lines เชื่อมจุดไปยังจุดถัดไป (top/bottom segments)

### 4.6 เวลาให้อาหาร (feeding)

#### CTA Card "ตั้งเวลาให้อาหารน้อง"

- รูป `pet-meal-time.png` ขวา + headline + subhint + chip "+เพิ่ม"
- กด → navigate `MealTimeSetting { petId }` (ไม่มี scheduleId = สร้างใหม่)

#### Schedule List

- ถ้า `schedules.length === 0` : "ยังไม่มีตารางให้อาหาร"
- มี : InfoCard ต่อตาราง แสดง :
  - **ซ้าย** : เวลา + "อาหาร/น้ำดื่ม" (+ "· ปิด" ถ้า disabled)
  - **ขวา** : ปริมาณ + note
- กด → navigate `MealTimeSetting { petId, scheduleId }` (แก้ไข)

### 4.7 Sticky AppBar

- ใช้ component `StickyAppBar`
- `fadeStartAt = 200`, `fadeEndAt = 260`
- title : "น้อง<ชื่อ>"
- leading : ChevronLeft → goBack
- trailing : Pencil → navigate `PetEdit { petId }`

### 4.8 หมอเหมียว FAB (AI)

#### Layout
- pill ขอบ gradient (cyan → violet → pink)
- ภายใน : ข้อความ "คุยกับหมอเหมียว" + ไอคอน paw หรือ mascot ลอยมุมขวา
- aura blobs (cyan + pink) ด้านหลัง pulse ตลอด

#### Animation Cycle (6 วินาที)

| Phase | ms | พฤติกรรม |
|---|---|---|
| 1. Idle (rest) | 0 → 2000 | paw icon นิ่ง |
| 2. Shake | 2000 → 2600 | paw หมุน ±14° (Math.sin × 6 oscillations) |
| 3. Pop out | 2600 → 2950 | paw fade-out, mascot scale 0→1 + rise |
| 4. Visible | 2950 → 4450 | mascot bobs gently, sparkles twinkle รอบ ๆ |
| 5. Retract | 4450 → 4800 | mascot scale 1→0 + sink, paw fade-in |
| 6. Idle (rest) | 4800 → 6000 | paw นิ่ง, loop |

ขับเคลื่อนด้วย SharedValue `t` เดียว (linear loop 6000ms) + `useAnimatedStyle` derive จากช่วง ms

#### Press
- กด → navigate `Chat { conversationId: 'c-ai', vetId: 'tv-ai', aiMode: true, petId }`

### 4.9 Toast

- แสดงเมื่อมี `route.params.flashMessage`
- auto-dismiss หลัง 5000ms
- track ด้วย `lastFlashRef` — แสดงครั้งเดียวต่อ flashMessage
- enter/exit : SlideInDown / SlideOutDown

### 4.10 Bottom Sheet — ที่มาของข้อมูล

- เปิดเมื่อกดการ์ด **ประวัติการทำหมัน** (เฉพาะ neutered)
- ใช้ `react-native-modal` (สไตล์ slide-up + custom backdrop)
- เนื้อหา : icon Info + title + body (อธิบายว่าข้อมูลมาจากคลินิกพันธมิตร) + CTA "เข้าใจแล้ว"
- size : auto by content

---

## 5. State Management Summary

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `toast` | `string \| null` | ข้อความ toast ปัจจุบัน |
| `neuterInfoOpen` | `boolean` | เปิด/ปิด bottom sheet |
| `tab` | `TabKey` | แท็บที่กำลังแสดง |
| `livePet` | `Pet \| undefined` | snapshot ของ pet (refresh on focus) |
| `schedules` | `FeedingSchedule[]` | ตารางของน้องตัวนี้ |
| `pageHeights` | `Partial<Record<TabKey, number>>` | ความสูงของแต่ละแท็บที่วัดได้ → resize pager |
| `selected` | `number` | bar ที่กดใน WeightTrendCard |

### 5.2 Refs

| Ref | หน้าที่ |
|---|---|
| `lastFlashRef` | track flashMessage ที่แสดงแล้ว (ป้องกัน double-toast) |
| `toastTimerRef` | clearTimeout ของ toast |
| `pagerRef` | scrollTo เมื่อเปลี่ยน tab |
| `pagerDragging` | flag : ผู้ใช้กำลังลาก pager หรือไม่ |

### 5.3 Reanimated SharedValues

| SharedValue | หน้าที่ |
|---|---|
| `scrollY` | sync StickyAppBar fade |
| `t` (FAB) | timeline 0..1 over 6s |

---

## 6. Event Flow / Navigation Map

```
[Hero scroll]                      → scrollY update → StickyAppBar fade
[Back (StickyAppBar leading)]      → navigation.goBack()
[Pencil (StickyAppBar trailing)]   → navigate PetEdit { petId }

[Tab pressed]                      → setTab → pager scrollTo
[Pager swipe]                      → setTab

[Neuter card pressed]              → openNeuterSheet (bottom sheet)
[CTA "ตั้งเวลาให้อาหาร"]            → navigate MealTimeSetting { petId }
[Existing schedule pressed]        → navigate MealTimeSetting { petId, scheduleId }

[Bar in WeightTrendCard]           → setSelected
[FAB (หมอเหมียว) pressed]           → navigate Chat { aiMode:true, petId, conversationId:'c-ai', vetId:'tv-ai' }
```

---

## 7. Edge Cases & Fallbacks

| สถานการณ์ | พฤติกรรม |
|---|---|
| `petId` ไม่มีใน mockPets | render fallback "ไม่พบข้อมูลสัตว์เลี้ยง" |
| ไม่มี pet.photo | hero ใช้ emoji 96pt + heroFallback bg |
| ไม่มี visits / vaccines / conditions | แสดงข้อความเปล่า ๆ ใน infoCard |
| `points.length` เปลี่ยน (เช่นเปลี่ยน pet) | `safeSelected` clamp index ป้องกัน crash |
| pet.color ว่าง / มีแต่ whitespace | "ไม่ระบุ" |
| flashMessage เดียวกันถูกส่งซ้ำ | แสดงครั้งเดียว (lastFlashRef) |
| tabIndex เกินขอบ (theoretical) | TAB_KEYS[idx] = undefined → ไม่ setTab |

---

## 8. ส่วนที่อาจปรับในอนาคต

- ผูก `mockPets` กับ context (ตอนนี้ใช้ `useFocusEffect` เพื่อ refresh state)
- WeightTrendCard sample size ตอนนี้คงที่ 4 จุด — เพิ่มเป็น "ทุกครั้งที่ visit" + horizontal scroll
- AI category prompts จาก mock → integrate Claude API
- Bottom sheet ที่มาของข้อมูล — ใช้ `@gorhom/bottom-sheet` (native sheet) เหมือนหน้าอื่นเพื่อ consistency
- Hero parallax ตอนนี้ใช้ overscroll → consider snap behavior
