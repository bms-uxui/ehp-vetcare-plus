# เอกสารหน้า Vet Hub Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Vet Hub (`src/screens/VetHubScreen.tsx`) — แท็บ "Vet" หลักที่รวมนัดหมาย, ออนไลน์ปรึกษา, ประวัติ

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Tabs](#3-tabs)
4. [Widget Breakdown](#4-widget-breakdown)
   - [4.1 Hero Header](#41-hero-header)
   - [4.2 Tab Bar](#42-tab-bar)
   - [4.3 Upcoming Tab](#43-upcoming-tab)
   - [4.4 Online Tab](#44-online-tab)
5. [State Management](#5-state-management)
6. [Event Flow / Navigation](#6-event-flow--navigation)
7. [Edge Cases](#7-edge-cases)
8. [ส่วนที่อาจปรับในอนาคต](#8-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้า Vet Hub เป็น tab "Vet" บน bottom navigation รวม :
- **Hero** : รูป + headline + CTA จองนัด/ปรึกษา
- **Tabs** : "นัดหมาย" / "ปรึกษาออนไลน์"
- **Upcoming Tab** : นัดที่ยังไม่ถึง (กรองตามเดือน)
- **Online Tab** : list ของ vets ที่ online ตอนนี้

มี chat icon มุมขวาบน → ChatList

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockAppointments` | `data/appointments.ts` | นัดทั้งหมด |
| `mockVets` | `data/televet.ts` | vets ทั้งหมด |
| `mockConversations` | `data/televet.ts` | conversations (สำหรับ chat icon badge) |
| `useFocusEffect` | navigation | โชว์ tab bar compact เมื่อ focus |

### Computed
- `upcoming` = appointments ที่ status='upcoming' เรียงตามวันที่
- `history` = appointments ที่ status≠'upcoming'
- `onlineVets` = vets ที่ status='online'

---

## 3. Tabs

| Tab Key | Label |
|---|---|
| `upcoming` | นัดหมาย |
| `online` | ปรึกษาออนไลน์ |

---

## 4. Widget Breakdown

### 4.1 Hero Header

- รูป `Hero-VetPage.png` + title + caption
- 2 CTA buttons : "จองนัดที่คลินิก" / "ปรึกษาออนไลน์"
- กด → navigate `BookAppointment` (with prefillMode)

### 4.2 Tab Bar

- 2 tabs สลับ
- Active : underline + ตัวอักษรเข้ม
- Inactive : ตัวอักษรเทา

### 4.3 Upcoming Tab

#### Calendar Strip
- เดือนปัจจุบัน + ปุ่มสลับเดือน (← →)
- date dots ใต้วันที่มีนัด

#### Appointment List

- filter : `appointments.filter(a => sameMonth(a.dateISO, viewMonth))`
- card per appointment :
  - วันที่ + เวลา
  - Pet avatar + name
  - Vet avatar + name + specialty
  - status badge
  - actions :
    - กด card → AppointmentDetail
    - ปุ่มแชท → Chat (ถ้ามี existing conversation)
    - ปุ่ม Video (online only) → VideoCall

### 4.4 Online Tab

- List vets ที่ online ตอนนี้ + sorted by rating
- card : avatar + name + specialty + rating + ratePerMin + chat/call CTA
- กด → VetDetail

---

## 5. State Management

### 5.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `tab` | `'upcoming' \| 'online'` | tab ปัจจุบัน |
| `viewMonth` | `Date` | เดือนที่ดูใน upcoming tab |

### 5.2 Animated

- `tabBarCompact` (shared from `navigation/tabBarVisibility`) — animate tab bar collapse based on scroll

---

## 6. Event Flow / Navigation

```
[Back / no back — root tab]
[จองนัด (CTA hero)]              → BookAppointment { prefillMode:'clinic' }
[ปรึกษาออนไลน์ (CTA hero)]        → BookAppointment { prefillMode:'online' }
[Chat icon (top-right)]          → ChatList
[Tab btn]                        → setTab

[Calendar arrow]                 → setViewMonth(prev/next)
[Appointment card]               → AppointmentDetail { appointmentId }
[Chat btn in card]               → Chat { conversationId } (ถ้ามี)
[Video btn in card]              → VideoCall { vetId }

[Online vet card]                → VetDetail { vetId }
[Chat icon in vet card]          → Chat { conversationId }
[Video icon in vet card]         → VideoCall { vetId }
```

---

## 7. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มี upcoming ใน month ที่เลือก | empty state "ยังไม่มีนัดในเดือนนี้" |
| ไม่มี vet online | empty state ใน online tab |
| Conversation ไม่มี | ปุ่มแชทยังกดได้ → todo: สร้างใหม่ |

---

## 8. ส่วนที่อาจปรับในอนาคต

- search vet by name / specialty
- filter (rating, price, language)
- favorite vets
- slot count badge ใน calendar (จองได้/เต็ม)
