# เอกสารหน้า Expenses Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Expenses (`src/screens/ExpensesScreen.tsx`) — รายงานค่าใช้จ่ายของน้องตามเดือน

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Widget Breakdown](#3-widget-breakdown)
   - [3.1 Header](#31-header)
   - [3.2 Month Selector](#32-month-selector)
   - [3.3 Summary Card](#33-summary-card)
   - [3.4 Budget Progress + Edit](#34-budget-progress--edit)
   - [3.5 Category Breakdown](#35-category-breakdown)
   - [3.6 Expense List](#36-expense-list)
   - [3.7 Expense Detail Sheet](#37-expense-detail-sheet)
   - [3.8 FAB — Add Expense](#38-fab--add-expense)
4. [State Management](#4-state-management)
5. [Event Flow / Navigation](#5-event-flow--navigation)
6. [Edge Cases](#6-edge-cases)
7. [ส่วนที่อาจปรับในอนาคต](#7-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้านี้เป็น **dashboard ค่าใช้จ่าย** ของน้อง ๆ ตามเดือน

โครงสร้าง :
- Header
- เลือกเดือน (chip pills)
- Summary card (รวม + budget progress)
- กราฟ category breakdown (sorted desc)
- รายการ expenses เรียงล่าสุด
- FAB ลอย → AddExpense

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `useExpenses()` | `data/expensesContext` | `expenses`, `addExpense`, `removeExpense` |
| `categoryMeta` | `data/expenses.ts` | category metadata (label, icon, color) |
| `monthKey(iso)` | `data/expenses.ts` | "YYYY-MM" |
| `sumByCategory(list)` | `data/expenses.ts` | รวมเงินตาม category |
| `DEFAULT_MONTHLY_BUDGET` | `data/expenses.ts` | งบประมาณ default |
| `fmtBaht(n)` | `data/expenses.ts` | format ราคา |

---

## 3. Widget Breakdown

### 3.1 Header

ใช้ `<SubPageHeader title="ค่าใช้จ่าย" onBack={...} />`

### 3.2 Month Selector

```
[2569-04] [2569-03] [2569-02] →   horizontal scroll
```

- list เดือนที่มี expenses (unique จาก expense list)
- กด chip → `setSelectedMonth(key)`
- Active : สีพื้น primary

### 3.3 Summary Card

```
+--------------------------------+
| 🐱 [illustration]              |
|                                |
| ค่าใช้จ่ายเดือนนี้                |
| ฿ 4,250                       |
| คงเหลือ ฿ 5,750 จาก ฿ 10,000  |
+--------------------------------+
```

- รูปประกอบ `expense-cat.png`
- Total = sum of amounts ในเดือนที่เลือก
- Remaining = budget - total (สีแดงถ้าติดลบ)

### 3.4 Budget Progress + Edit

- Progress bar ขนาด 100% width
- กด edit icon → `setBudgetEditOpen(true)` modal ใส่ budget ใหม่
- save → `setBudget(value)` (ตอนนี้ session-only)

### 3.5 Category Breakdown

```
อาหาร       ████████████  ฿ 2,400
ของเล่น     ████          ฿ 800
สุขภาพ      ███           ฿ 600
...
```

- Sort desc by amount
- Bar width interpolate from total
- Bar color จาก `categoryMeta[category].color`

### 3.6 Expense List

- Sort by date desc
- Card per expense :
  - icon category
  - title + amount
  - date (relative)
- กด → เปิด Expense Detail Sheet

### 3.7 Expense Detail Sheet

bottom sheet (modal) แสดง :
- Full detail ของ expense
- ปุ่ม "ลบ" (text danger)
- กดลบ → confirm modal → `removeExpense(id)` + ปิด sheet

### 3.8 FAB — Add Expense

- Round button + icon `Plus`
- ลอยมุมล่าง-ขวา
- กด → navigate `AddExpense`

---

## 4. State Management

### 4.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `selectedMonth` | `string` | "YYYY-MM" |
| `selectedExpense` | `Expense \| null` | แสดงใน detail sheet |
| `detailMenuOpen` | `boolean` | overflow menu ใน sheet |
| `budget` | `number` | session budget value |
| `budgetEditOpen` | `boolean` | edit budget modal |
| `budgetInput` | `number` | input ใน edit modal |

### 4.2 Context

- `useExpenses()` → `expenses`, `addExpense`, `removeExpense`

### 4.3 Memos

- `months` = unique month keys จาก `expenses`
- `expensesThisMonth` = filter ตาม selectedMonth
- `total` = sum
- `byCategory` = sumByCategory(expensesThisMonth)
- `sortedCategories` = sort by amount desc
- `sortedExpenses` = sort by dateISO desc

---

## 5. Event Flow / Navigation

```
[Back]                       → goBack
[Month chip]                 → setSelectedMonth
[Edit budget icon]           → setBudgetEditOpen(true)
[Save budget]                → setBudget + close modal
[Expense card]               → setSelectedExpense
[Detail sheet "ลบ"]           → confirm → removeExpense + close
[FAB +]                      → navigate AddExpense
```

---

## 6. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มี expenses เลย | empty state, month list ว่าง |
| total > budget | remaining ติดลบ + สีแดง |
| budget = 0 | progress bar full / undefined behavior |
| expense ไม่มี category | fallback "อื่นๆ" |
| selectedMonth ไม่อยู่ใน months | fallback ไป months[0] หรือ default |

---

## 7. ส่วนที่อาจปรับในอนาคต

- เพิ่มกราฟ trend รายเดือน (line chart)
- export CSV / Excel
- แชร์ summary
- alert when reaching X% of budget
- recurring expenses (subscriptions)
- multi-currency
