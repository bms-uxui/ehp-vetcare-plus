# เอกสารหน้า Chat List Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Chat List (`src/screens/ChatListScreen.tsx`) — รายการห้องสนทนาทั้งหมดของผู้ใช้

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Widget Breakdown](#3-widget-breakdown)
   - [3.1 Header](#31-header)
   - [3.2 Conversation Card](#32-conversation-card)
4. [State Management](#4-state-management)
5. [Event Flow / Navigation](#5-event-flow--navigation)
6. [Edge Cases](#6-edge-cases)
7. [ส่วนที่อาจปรับในอนาคต](#7-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้า Chat List แสดงรายการ conversations ของผู้ใช้ — แต่ละ row คือ vet 1 ตัว (รวม "หมอเหมียว" AI assistant) พร้อม last message preview + unread badge

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockConversations` | `data/televet.ts` | conversations ทั้งหมด |
| `mockVets` | `data/televet.ts` | lookup vet จาก vetId |
| `thRelative(iso)` | `data/televet.ts` | "5 นาทีที่แล้ว", "2 วันที่แล้ว", ฯลฯ |
| `statusMeta[status]` | `data/televet.ts` | metadata ของ vet status |

---

## 3. Widget Breakdown

### 3.1 Header

- ใช้ `<SubPageHeader title="แชท" onBack={...} />`
- back → กลับไปหน้าก่อนหน้า

### 3.2 Conversation Card

```
[avatar] ชื่อ vet                     12:30
         "last message preview..."     ●3
```

- **Avatar** : URL `vet.avatar` หรือ mascot (ai)
- **Online dot** : เขียวมุมขวา-ล่างของ avatar ถ้า status='online'
- **ชื่อ + last message** : 1 line each
- **Right column** : เวลา (relative), unread badge ถ้า > 0

#### กด → navigate `Chat { conversationId, vetId }`

---

## 4. State Management

ไม่มี React state สำคัญในหน้านี้ (read-only list)

---

## 5. Event Flow / Navigation

```
[Back]                       → goBack
[Conversation card tap]      → Chat { conversationId, vetId }
```

---

## 6. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| `conversations` ว่าง | empty state "ยังไม่มีบทสนทนา" |
| `vetId` ใน conversation ไม่มีใน mockVets | skip render (defensive) |
| AI conversation (`vetId='tv-ai'`) | แสดงด้วย mascot avatar |

---

## 7. ส่วนที่อาจปรับในอนาคต

- search bar
- archive / pin conversation
- realtime unread sync
- typing indicator preview
- swipe-to-delete
