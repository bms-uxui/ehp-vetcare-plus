# เอกสารหน้า Notifications Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Notifications (`src/screens/NotificationsScreen.tsx`) — ศูนย์รวมการแจ้งเตือน + ตั้งค่าตารางให้อาหาร + ตั้งค่า preference

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Widget Breakdown](#3-widget-breakdown)
   - [3.1 Header](#31-header)
   - [3.2 Filter Chips Row](#32-filter-chips-row)
   - [3.3 Reminder Cards](#33-reminder-cards)
   - [3.4 ตารางให้อาหาร Section](#34-ตารางให้อาหาร-section)
   - [3.5 Settings Sheet](#35-settings-sheet)
   - [3.6 Schedules Sheet](#36-schedules-sheet)
4. [State Management](#4-state-management)
5. [Event Flow / Navigation](#5-event-flow--navigation)
6. [Edge Cases](#6-edge-cases)
7. [ส่วนที่อาจปรับในอนาคต](#7-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้เป็นศูนย์รวมการแจ้งเตือนของผู้ใช้ ประกอบด้วย :
- **Filter chips** : สลับมุมมองตาม category (all, feeding, appointment, vaccine, contact, order)
- **Reminder list** : แสดง notifications ที่ filtered + mark-as-read
- **ตารางให้อาหาร section** : carousel/list ตารางที่ active สำหรับการ toggle on/off
- **Settings sheet** : ตั้งค่าการแจ้งเตือน (lead time วัคซีน / appointment / treatment)
- **Schedules sheet** : รายการตารางทั้งหมดสำหรับ edit/disable

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockReminders` | `data/reminders.ts` | reminder list ทั้งหมด |
| `reminderMeta[type]` | `data/reminders.ts` | metadata (label, icon, bg, fg) ตาม type |
| `useSchedules()` | `data/schedulesContext` | `schedules`, `toggleSchedule(id)` |
| `useNotifyPrefs()` | `data/notifyPrefsContext` | preAppointment / preVaccine / preTreatment + setters |
| `notifyNow()` | `lib/notifications` | trigger local notification (สำหรับทดสอบ) |

### Filter categories

| Key | Label | Icon | Color |
|---|---|---|---|
| `all` | ทั้งหมด | Bell | `#9F5266` (primary) |
| `feeding` | ให้อาหาร | UtensilsCrossed | `#D99A20` |
| `appointment` | นัดหมาย | Calendar | `#B86A7C` |
| `vaccine` | วัคซีน | Syringe | `#4FB36C` |
| `contact` | ติดต่อ | MessageCircle | `#4A8FD1` |
| `order` | การสั่งซื้อ | Package | `#D17A4A` |

---

## 3. Widget Breakdown

### 3.1 Header

- title : "การแจ้งเตือน" (Thai header)
- right : settings gear → เปิด `settingsOpen` sheet

### 3.2 Filter Chips Row

```
[● ทั้งหมด] [ให้อาหาร] [นัดหมาย] [วัคซีน] [ติดต่อ] [การสั่งซื้อ]
   ↑ มี dot ถ้ามี unread
```

- horizontal ScrollView
- Active chip : สีพื้น **gradient** (linear from `activeGradient[0]` → `activeGradient[1]`)
- Inactive : สีพื้นโปร่งใส + border
- ข้อ chip มี **dot indicator** ถ้า count > 0 ของ type นั้น

#### Unread count คำนวณจาก :
```
counts.all          = remindersWithRead.filter(r => !r.read).length
counts.feeding      = ... type === 'feeding' && !r.read
counts.contact      = type === 'chat' || type === 'call' && !r.read
counts.<type>       = type === <type> && !r.read
```

### 3.3 Reminder Cards

```
[icon] หัวข้อ                    เวลา/วันที่ที่ผ่าน
       รายละเอียด...
       [ลีดไทม์แลเบล (เช่น "ล่วงหน้า 1 วัน")]
```

- icon : `reminderMeta[type].icon` ในวงกลมสี `reminderMeta[type].bg`
- ถ้า `r.read === false` → แสดงด้วยสี + bold ; แล้ว → ตัวอักษรซีดลง

#### Tap behavior

- กด → mark as read (`setReadIds`)
- แล้ว navigate ตาม type :
  - `appointment`, `vaccine` → `AppointmentDetail { appointmentId }`
  - `chat` → `Chat { conversationId }`
  - `call` → `VideoCall { vetId }`
  - `feeding` → no-op หรือเปิด schedules sheet

### 3.4 ตารางให้อาหาร Section

```
+------------------------------+
| ตารางให้อาหาร       [+ เพิ่ม]  |
+------------------------------+
| [Card] [Card] [Card] →       |  (horizontal scroll)
+------------------------------+
```

- รายการ schedule ที่ active แสดงเป็น horizontal cards
- กด "+ เพิ่ม" → navigate `AddFeedingSchedule`
- กด toggle ในแต่ละ card → `toggleSchedule(id)`

### 3.5 Settings Sheet

modal ด้านล่าง bottom sheet มี toggles :

| Setting | Effect |
|---|---|
| ล่วงหน้านัดหมาย (off / 30นาที / 1ชม / 1วัน) | `setPreAppointment(value)` |
| ล่วงหน้าวัคซีน | `setPreVaccine(value)` |
| ล่วงหน้าให้ยา | `setPreTreatment(value)` |

ค่าจะถูก persist ใน context + trigger `syncReminderNotifications()` ใน root `App.tsx` (ผ่าน `ReminderSyncBridge`)

### 3.6 Schedules Sheet

modal ด้านล่างแสดง schedules ทั้งหมด พร้อม toggle on/off ต่อตาราง + edit (กด → navigate `MealTimeSetting { petId, scheduleId }`)

---

## 4. State Management

### 4.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `filter` | `FilterKey` | category ปัจจุบัน |
| `settingsOpen` | `boolean` | settings sheet |
| `schedulesOpen` | `boolean` | schedules sheet |
| `readIds` | `Set<string>` | reminder ids ที่ผู้ใช้กดอ่านแล้ว (session-only) |
| `menuOpen` | `boolean` | per-card overflow menu |

### 4.2 Context

- `useSchedules()` : `schedules`, `addSchedule`, `toggleSchedule`, `removeSchedule`
- `useNotifyPrefs()` : prefs + setters

### 4.3 Memos

- `remindersWithRead` : `mockReminders.map(r => ({ ...r, read: r.read || readIds.has(r.id) }))`
- `filteredReminders` : `filter === 'all' ? all : filtered by type`
- `counts` : per-filter unread count

---

## 5. Event Flow / Navigation

```
[Filter chip tap]            → setFilter
[Settings gear]              → setSettingsOpen(true)
[Reminder card]
├─ setReadIds(prev + r.id)
└─ navigate ตาม type

[Add schedule (+)]           → navigate AddFeedingSchedule
[Schedule card edit]         → navigate MealTimeSetting { petId, scheduleId }
[Schedule toggle]            → toggleSchedule(id) (context)

[Settings option change]     → setPre*(value) → syncReminderNotifications()
```

---

## 6. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มี reminders ของ filter ที่เลือก | empty state |
| reminder แล้ว navigate ไปยังหน้าที่ไม่มีข้อมูล | fallback ที่ destination |
| context update ระหว่าง screen เปิด | re-render อัตโนมัติ (filtered list update) |
| `readIds` Set ใหญ่มาก | session-only — ล้างเมื่อ unmount |
| schedules ว่าง | section ไม่แสดง / แสดง CTA "+เพิ่ม" |
| Settings sheet เปิดขณะ navigate ออก | sheet ปิดเอง (modal life-cycle) |

---

## 7. ส่วนที่อาจปรับในอนาคต

- `readIds` persist ลง storage (ตอนนี้หาย session แล้วหาย)
- pagination / infinite scroll สำหรับ reminders ที่เยอะ
- group reminders ตามวัน (today / yesterday / earlier)
- swipe-to-archive / swipe-to-delete
- search bar
- silent notifications (DND mode)
