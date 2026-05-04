# เอกสารหน้า Pet Shop Screen

เอกสารฉบับเต็มอธิบาย **data flow** และ **widget states** ของหน้า Pet Shop (`src/screens/PetShopScreen.tsx`) — หน้าร้านค้ารวมสินค้าสำหรับสัตว์เลี้ยง

---

## 📑 สารบัญ

1. [ภาพรวม (Overview)](#1-ภาพรวม-overview)
2. [แหล่งข้อมูล (Data Sources)](#2-แหล่งข้อมูล-data-sources)
3. [Widget Breakdown](#3-widget-breakdown)
   - [3.1 Sticky AppBar (with Cart Badge)](#31-sticky-appbar-with-cart-badge)
   - [3.2 Search Bar](#32-search-bar)
   - [3.3 Hero Banner / Promotions](#33-hero-banner--promotions)
   - [3.4 Category Chips](#34-category-chips)
   - [3.5 Sale Section](#35-sale-section)
   - [3.6 Product Grid](#36-product-grid)
   - [3.7 Search Modal](#37-search-modal)
4. [State Management](#4-state-management)
5. [Event Flow / Navigation](#5-event-flow--navigation)
6. [Edge Cases](#6-edge-cases)
7. [ส่วนที่อาจปรับในอนาคต](#7-ส่วนที่อาจปรับในอนาคต)

---

## 1. ภาพรวม (Overview)

หน้าร้านค้า เป็น tab "PetShop" บน bottom navigation ผู้ใช้ดู/ค้นหา/กรองสินค้า แล้วกดเข้า ProductDetail หรือเพิ่มเข้าตะกร้า

---

## 2. แหล่งข้อมูล (Data Sources)

| ตัวแปร | Source | หน้าที่ |
|---|---|---|
| `mockProducts` | `data/products.ts` | สินค้าทั้งหมด |
| `categoryMeta` | `data/products.ts` | metadata category (icon, label) |
| `mockOrders` | `data/orders.ts` | สำหรับ tracking icon badge |
| `useCart()` | `data/cart` | items ใน cart, addToCart |
| `fmtBaht(n)` | `data/products.ts` | format ราคา |

---

## 3. Widget Breakdown

### 3.1 Sticky AppBar (with Cart Badge)

```
[<-]   ร้านค้า              [📦●1] [🛒●3]
```

- title : "ร้านค้า" — fade in on scroll
- icons :
  - **Tracking** (Package + dot) : กด → `OrderTracking`. Badge นับ orders ที่ status≠delivered
  - **Cart** (ShoppingCart + dot) : กด → `Cart`. Badge นับจำนวน items ใน cart
- ใช้ BlurView intensity 80, tint systemChromeMaterialLight

### 3.2 Search Bar

- กด → `setSearchOpen(true)` เปิด `SearchModal`
- placeholder : "ค้นหาสินค้า..."

### 3.3 Hero Banner / Promotions

- carousel แสดง promo banners (3-4 รายการ)
- auto-advance / swipe เหมือน HomeScreen banner

### 3.4 Category Chips

```
[🏠 ทั้งหมด] [🍖 อาหาร] [🪥 อุปกรณ์] [💊 ยา] [✂️ บริการ]
```

- horizontal scroll
- Active chip : สีพื้น primary
- กด → `setActiveCategory(category)` หรือ `null` (ทั้งหมด)

### 3.5 Sale Section

- filter `mockProducts.filter(p => p.originalPriceBaht)` (สินค้าที่ลดราคา)
- horizontal scroll showing ProductTile
- discount badge บน tile

### 3.6 Product Grid

- 2 columns
- filtered by `activeCategory` หรือทุกหมวด
- กด tile → `navigate ProductDetail { productId }`

### 3.7 Search Modal

- full-screen modal slide up
- TextInput ที่ focus auto
- result list real-time filter จาก `mockProducts.filter(name contains query)`
- กด result → close modal + navigate ProductDetail

---

## 4. State Management

### 4.1 React State

| State | ประเภท | หน้าที่ |
|---|---|---|
| `activeCategory` | `ProductCategory \| null` | category filter |
| `searchOpen` | `boolean` | search modal |
| `searchQuery` | `string` | input ใน search modal |

### 4.2 Context

- `useCart()` : `items`, `addToCart`, `removeFromCart`, ...

### 4.3 Memos

- `saleProducts` = filtered with originalPriceBaht
- `searchResults` = filtered by query
- `displayedProducts` = ตาม activeCategory + ถ้ามี query
- `cartCount` = items.length หรือ sum quantity

---

## 5. Event Flow / Navigation

```
[Tracking icon]              → OrderTracking
[Cart icon]                  → Cart
[Search bar]                 → setSearchOpen(true)
[Category chip]              → setActiveCategory
[Hero banner CTA]            → ProductDetail / promo URL
[Sale ProductTile]           → ProductDetail { productId }
[Product Grid tile]          → ProductDetail { productId }

[Search result]
├─ setSearchOpen(false)
└─ ProductDetail { productId }
```

---

## 6. Edge Cases

| สถานการณ์ | พฤติกรรม |
|---|---|
| ไม่มีสินค้าใน category | empty state "ไม่พบสินค้าในหมวดนี้" |
| query ว่าง | แสดงทุกสินค้า |
| query ที่ไม่ตรง | "ไม่พบผลลัพธ์" |
| Cart ว่าง | badge ไม่แสดง |

---

## 7. ส่วนที่อาจปรับในอนาคต

- sort by (ราคา, ขายดี, ใหม่ล่าสุด)
- filter advanced (brand, price range, rating)
- recent search history
- recommendations จาก pet species
- wishlist
