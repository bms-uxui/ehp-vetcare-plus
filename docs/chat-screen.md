# เอกสารหน้า Chat Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Chat (`src/screens/ChatScreen.tsx`)

หน้านี้ใช้ทั้งแบบ **vet chat** (คุยกับสัตวแพทย์จริง) และ **AI chat** (คุยกับหมอเหมียว) โดยแยกพฤติกรรมด้วย route param

---

## 📑 สารบัญ (Table of Contents)

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [โหมดการทำงาน (Modes)](#3-โหมดการทำงาน-modes)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Header](#41-header)
   - [4.2 Messages Scroll](#42-messages-scroll)
   - [4.3 Empty State (AI)](#43-empty-state-ai)
   - [4.4 Empty State (Vet)](#44-empty-state-vet)
   - [4.5 Message Bubble](#45-message-bubble)
   - [4.6 Typing Indicator](#46-typing-indicator)
   - [4.7 AI Category Chips](#47-ai-category-chips)
   - [4.8 Composer](#48-composer)
5. [State Management Summary](#5-state-management-summary)
6. [Event Flow / Navigation Map](#6-event-flow--navigation-map)
7. [Edge Cases & Fallbacks](#7-edge-cases--fallbacks)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้าแชทแบบ 1-on-1 รองรับการส่งข้อความ + รูปภาพ มี typing indicator แบบ animation จุด 3 จุด รับ-ส่งข้อความตาม mock data + canned replies

มี 2 เลเยอร์การโต้ตอบ
- **vet mode** : คุยกับ vet จริง (จาก `mockVets`) → ใช้สำหรับการนัดหมาย, ปรึกษาออนไลน์
- **ai mode (`aiMode=true`)** : คุยกับ "หมอเหมียว" (AI assistant) → มี mascot, category chips, gradient background

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | ประเภท |
|---|---|---|
| `mockConversations` | `data/televet.ts` | conversation summary list |
| `mockMessages` | `data/televet.ts` | initial messages ของ conversation |
| `mockVets` | `data/televet.ts` | รายชื่อ vet (รวม `tv-ai`) |
| `AI_CATEGORIES` | `data/televet.ts` | 6 หัวข้อสำหรับ AI chat |
| `mockPets` | `data/pets.ts` | สำหรับ pet avatar / pet name interpolation |
| `route.params` | navigation | `conversationId`, `vetId?`, `aiMode?`, `petId?` |
| `useCall()` | `data/callContext` | active call state สำหรับ minimized call header |

### Helper / Constants

- `VET_REPLIES` — ประโยคสุ่มสำหรับ vet mode reply
- `HISTORY_TEMPLATES` — pull-to-refresh จะ prepend ประวัติ
- `thTime(iso)` — รูปแบบเวลา HH:MM
- `fillTemplate(s)` — แทนที่ `{pet}` ใน prompt/reply ด้วย `petName`

---

## 3. โหมดการทำงาน (Modes)

| Mode | เงื่อนไข | ตัวบ่งชี้ |
|---|---|---|
| AI mode | `route.params.aiMode === true` หรือ `vetId === 'tv-ai'` | `isAi = true` |
| Vet mode | อื่น ๆ | `isAi = false` |

### ความแตกต่างระหว่าง 2 โหมด

| ฟีเจอร์ | Vet mode | AI mode |
|---|---|---|
| Header avatar | photo URL ของ vet | `dr-meaw.png` (mascot) |
| Header subtitle | online/busy/offline + เวลา call | "กำลังช่วยดูแลน้อง<ชื่อ>" |
| Header trailing | Video call button | Pet avatar (ถ้ามี petId) |
| Empty state | "เริ่มการสนทนา" + MessageCircle icon | mascot greeting + "มีอะไรให้หมอเหมียวช่วย" |
| Category chips | — | แสดงเหนือ composer (horizontal scroll) |
| Reply behavior | สุ่มจาก `VET_REPLIES` หลัง 2.2-3.4s | canned reply ตาม category, 1.4-2.2s |

---

## 4. Widget Breakdown

### 4.1 Header

#### Layout
```
[<-] [avatar] ชื่อ              [video / pet]
              สถานะ
```

#### Avatar
- **AI** : `<Image source={dr-meaw.png}>` resizeMode contain
- **Vet** : `<Image source={{ uri: vet.avatar }}>`
- **No avatar** : `UserCircle` icon

#### Subtitle behavior

```
isAi
├─ pet ? "กำลังช่วยดูแลน้อง<ชื่อ>" : "ผู้ช่วย AI พร้อมตอบคำถาม"
isCallMinimizedForVet (call active for this vet, minimized)
├─ blink dot + "แตะเพื่อเปิดหน้าจอวิดีโอคอล"
default
└─ "● online/busy/offline" (สีตาม statusMeta)
```

#### Trailing slot

| สถานการณ์ | แสดง |
|---|---|
| `isAi && pet` | `<PetAvatar pet={pet} size={36} />` |
| `isAi && !pet` | (ว่าง) |
| not AI + call active for this vet, minimized | callBtn ที่ active + show duration |
| not AI + vet online | callBtn enabled |
| not AI + vet offline/busy | callBtn opacity 0.3 disabled |

### 4.2 Messages Scroll

- ใช้ `KeyboardAvoidingView` (`padding` iOS / `undefined` Android)
- ScrollView แสดง messages เรียงตามเวลา (เก่า → ใหม่)
- พื้นหลังเป็น **vertical gradient** : pink top (`#FFE9F1`) → white middle → soft cyan bottom (`#E8F4FB`)
- รองรับ pull-to-refresh → load older history (1 รอบ จากนั้น `hasMoreHistory=false`)
- auto-scroll ลง bottom เมื่อมีข้อความใหม่ (50ms delay เพื่อรอ layout)

### 4.3 Empty State (AI)

```
+--------------------------------------+
| [text col]              [mascot     ]|
|                         [bleed       |
| มีอะไรให้หมอเหมียวช่วย    right-edge ] |
| เลือกหัวข้อด้านล่างได้เลยค่ะ            |
+--------------------------------------+
```

- **Mascot** : `dr-meaw-greeting.png` ขนาด 280px ลอยขวา (right: -spacing.xl, bleed off-screen)
- **Animation** : SlideInRight 560ms (mascot) + FadeInLeft 420ms (text, delay 180ms)

### 4.4 Empty State (Vet)

- icon `MessageCircle` 48pt + "เริ่มการสนทนา" + hint "ถามคำถามหรือส่งรูปสัตว์เลี้ยง..."
- center aligned

### 4.5 Message Bubble

```
fromMe   →  bubble ขวา, สีพื้น (surfaceMuted), ข้อความสีดำ
fromVet  →  bubble ซ้าย, สี primary, ข้อความสีขาว
```

**หมายเหตุ** : สี bubble กลับด้านจาก convention (ปกติของผู้ส่งจะใช้สี primary) — เป็นการตัดสินใจ design ในรอบนี้

#### Image messages
- ถ้า `msg.image` → render `<Image>` 220×220 + bubble border radius

#### Time stamp
- ใต้ bubble แสดง `thTime(msg.sentAtISO)` สีเทา caption

### 4.6 Typing Indicator

- bubble ฝั่งซ้าย (theirs)
- 3 dots พร้อม delay 0/120/240ms — bounce animation (translateY -6 + opacity 0.4→1)

### 4.7 AI Category Chips

- horizontal ScrollView **เหนือ composer** เฉพาะ AI mode
- height ตายตัวจาก chip (36px)
- 6 chips จาก `AI_CATEGORIES` :
  1. วิเคราะห์อาการเบื้องต้น (Stethoscope)
  2. แนะนำอาหาร/กิจกรรม (Salad)
  3. คำนวณปริมาณอาหาร (Scale)
  4. ตรวจสอบยาที่ใช้อยู่ (Pill)
  5. แนะนำการดูแลตามอายุ (HeartPulse)
  6. ข้อมูลสายพันธุ์ (PawPrint)

#### Tap behavior

```
sendAiCategory(cat)
├─ append user message: fillTemplate(cat.prompt)
├─ trigger typing indicator
└─ after 1.4-2.2s: append AI reply: fillTemplate(cat.reply)
```

`{pet}` ใน prompt/reply จะถูกแทนที่ด้วย `pet?.name ?? 'น้อง'`

### 4.8 Composer

```
[📷] [🖼️] [ TextInput ............. ] [➤]
```

| ปุ่ม | หน้าที่ |
|---|---|
| Camera | `pickFromCamera()` → ImagePicker.launchCameraAsync (ขออนุญาต) |
| ImagePlus | `pickFromLibrary()` → ImagePicker.launchImageLibraryAsync |
| Send | ส่ง text จาก state `input` (disabled ถ้า empty) |

#### Text send flow

```
send()
├─ append user msg ใน messages
├─ clear input
├─ scrollToEnd
├─ setVetTyping(true)
└─ after 2.2-3.4s:
   ├─ setVetTyping(false)
   └─ append vet reply (random from VET_REPLIES)
```

#### Image send flow (`sendImage(uri)`)
- เหมือน text แต่ส่ง `image` แทน `text`
- AI canned reply ผ่าน VET_REPLIES (ไม่ smart)

---

## 5. State Management Summary

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `messages` | `Message[]` | ข้อความทั้งหมดในห้อง |
| `input` | `string` | ข้อความใน TextInput |
| `refreshing` | `boolean` | pull-to-refresh state |
| `hasMoreHistory` | `boolean` | ยังโหลดประวัติเก่าได้ไหม (limit 1 round) |
| `vetTyping` | `boolean` | แสดง typing indicator |
| `callNow` | `number` | timestamp สำหรับนับเวลา call (1s tick) |

### 5.2 Refs

| Ref | หน้าที่ |
|---|---|
| `scrollRef` | scrollToEnd |
| `typingTimeoutRef` | clear typing timer ตอน unmount |

### 5.3 Reanimated SharedValues

| SharedValue | หน้าที่ |
|---|---|
| `blinkOpacity` | dot กระพริบเมื่อมี call minimized |

---

## 6. Event Flow / Navigation Map

```
[Back arrow]                  → goBack
[Header tap (call minimized)] → maximize call → navigate VideoCall { vetId }
[Video call btn (vet online)] → (todo: start call) — current: no-op
[Send button]                 → send() (text)
[Camera/Gallery]              → pickFromCamera/Library → sendImage(uri)
[Pull to refresh]             → onRefresh → prepend history
[Category chip (AI)]          → sendAiCategory(cat)
```

---

## 7. Edge Cases & Fallbacks

| สถานการณ์ | พฤติกรรม |
|---|---|
| `conversationId` ไม่มี + ไม่มี `vetId` | render "ไม่พบการสนทนา" |
| AI mode + ไม่มี `petId` | header subtitle เป็น "ผู้ช่วย AI พร้อมตอบคำถาม" + ไม่แสดง pet avatar |
| Empty messages + AI mode | empty state กับ mascot |
| Empty messages + vet mode | empty state ปกติ |
| Pull-to-refresh ครั้งที่ 2 | `hasMoreHistory=false` → ไม่ append ใหม่ + แสดง "แสดงครบทั้งหมดแล้ว" |
| รูปจาก ImagePicker ถูกปฏิเสธ permission | Alert แจ้งให้เปิดสิทธิ์ |
| Typing timer ทำงานอยู่ตอน unmount | cleared via `typingTimeoutRef` |
| Vet `tv-ai` ไม่มี avatar URL | fallback เป็น mascot image |

---

## 8. ส่วนที่อาจปรับในอนาคต

- AI replies ตอนนี้ canned → integrate Claude API (`AI_CATEGORIES.prompt` ส่งเข้า model จริง)
- รูปที่ส่ง → ตอนนี้ local URI เท่านั้น ยังไม่ upload จริง
- Pull-to-refresh → จำกัด 1 round → เปลี่ยนเป็น pagination จริงเมื่อมี backend
- Real-time messaging (WebSocket/Pusher) — ตอนนี้ทุกอย่าง local state
- Read receipt / online indicator แม่นยำ
- Bubble color ตอนนี้สลับฝั่ง — รอ design review
