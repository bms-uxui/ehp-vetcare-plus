# Figma Reorganization Migration Checklist

Move frames from the **old** file to the **new** file using the table below.

- **Old file**: https://www.figma.com/design/27I1COr1VFEBeGUD92TUrR/EHP%C2%A0VetCare
- **New file**: https://www.figma.com/design/BdhCfu5BgKIm6pNBYBCzHy/EHP-VetCare-%E2%80%94-Reorganized

---

## How to migrate (per row)

1. Open the old file.
2. Find the frame by `id` or name (use Figma's left panel search).
3. **Copy** (⌘C) the frame.
4. Switch to the new file → open the page in the **Target Page** column.
5. **Paste** (⌘V) — Figma will paste at the cursor; drop near the placeholder of the matching name.
6. **Rename** the pasted frame using the **Final Name** column.
7. Delete the placeholder once you've replaced it.

---

## 🔐 03 Auth

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `547:21064` | Splash | `Splash` | — |
| `355:462` | Login | `Login` | canonical version (oldest, simplest) |
| `705:1942` | Login | `Login / v2` | newer iteration — keep as variant or archive |
| `705:2453` | Login | `Login / v3` | archive duplicate |
| `729:1979` | Login | `Login / v4` | archive duplicate |
| — | (no Signup found) | `Signup` | placeholder — design later |

**Action:** Pick which Login is canonical. Send the other 3 to `🗑️ 99 Archive` page.

---

## 🐾 04 Add Pet Flow

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `485:4586` | Add Pet | `Add Pet (entry)` | — |
| `487:693` | Add Pet - Pet ID | `Add Pet / Pet ID Scan` | — |
| `487:769` | Add Pet - Manual | `Add Pet / Step 0 - Species` | first step |
| `490:1423` | Add Pet - Manual | `Add Pet / Step 1 - Info` | basic info |
| `490:1499` | Add Pet - Manual | `Add Pet / Step 2 - Review` | review |
| `490:1811` | Add Pet - Manual | `Add Pet / Step 3 - Done` | success |
| — | (no Microchip frame found) | `Add Pet / Microchip` | placeholder |

**Action:** Open each "Add Pet - Manual" frame, screenshot, decide which step it shows. The IDs above are best-guess by ordering — verify visually.

---

## 🏠 05 Home

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `355:502` | Home | `Home` | — |

---

## 🐶 06 Pets

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `421:928` | Pet Profile | `Pet Profile / General` | — |
| `603:1341` | Pet Profile | `Pet Profile / Health` | — |
| `599:1033` | Pet Profile | `Pet Profile / Vaccines` | — |
| `421:939` | Pet Profile - General | (duplicate?) | compare with `421:928`, archive one |
| `490:1880` | Pet Profile - General | (duplicate?) | compare, archive one |
| — | — | `Pet Profile / Feeding` | placeholder — design later |
| — | — | `Pets List` | placeholder — design later |
| — | — | `Pet Edit` | placeholder — design later |

**Action:** The 3 "Pet Profile" frames likely correspond to 3 of the 4 tabs. Open them and label appropriately.

---

## 🩺 07 Vet & Telemed

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `399:253` | Telemed | `Telemed (older)` | possibly archive |
| `486:568` | Telemed | `Vet Hub` | newer — promote as main |
| `399:464` | Detail Doctor Review | `Vet Detail / Reviews` | — |
| `404:782` | Detail Doctor Experience | `Vet Detail / Experience` | — |
| `410:1897` | Detail Doctor Experience(Scroll) | `Vet Detail / Experience (Scroll)` | scroll variant |
| `410:1213` | BookingChat | `Chat / Booking-related (1)` | inspect — possibly archive |
| `410:1499` | BookingChat | `Chat / Booking-related (2)` | inspect — possibly archive |
| `410:1742` | Chat | `Chat / Vet` | canonical chat |
| `410:1802` | Chat | `Chat / AI หมอเหมียว` | check if this is the AI variant |
| — | — | `Chat List` | placeholder — design later |
| — | — | `Video Call` | placeholder |

**Action:** Open the BookingChat / Chat frames side-by-side and decide which is current.

---

## 📅 08 Appointments

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `580:1009` | Add-Appointment | `Add-Appointment` | — |
| — | — | `Book Appointment` | placeholder |
| — | — | `Booking Summary` | placeholder |
| — | — | `Appointment Detail` | placeholder |

---

## 🔔 09 Notifications & Schedules

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `555:1429` | Notificaition | `Notifications` | typo in original — fixed |
| `575:1508` | Setting | `Notifications / Settings sheet` | check — could be a different settings screen |
| `582:2163` | Animal feeding schedule | `Animal Feeding Schedule` | — |
| — | — | `Add Feeding Schedule` | placeholder |
| — | — | `Meal Time Setting` | placeholder |

---

## 🛒 10 Store & Cart

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `363:1390` | Store | `Store` | canonical |
| `602:2582` | Store | (duplicate?) | check, archive if redundant |
| `386:363` | Card Product | (component) | move to **🧩 02 Components → Cards** |
| `365:1745` | Detail Product | `Product Detail` | — |
| `389:1020` | Cart | `Cart` | — |
| `392:1543` | Pay | `Checkout / Pay` | — |
| `396:2662` | Sheet Payment | `Sheet Payment` | — |
| `398:2989` | Sheet Coupon | `Sheet Coupon` | — |
| `411:3669` | Oder | `Order Tracking` | typo in original — fixed |

---

## 💸 11 Expenses

| Old ID | Old Name | Final Name | Notes |
|---|---|---|---|
| `488:586` | Record expenses | `Expenses` | main screen |
| `505:1354` | Add Record expenses | `Add Expense` | — |
| `626:3626` | Add Record expenses | (duplicate?) | check, archive if redundant |
| `502:1193` | Sheet Set budget. | `Sheet Set Budget` | — |
| `532:1261` | food | `Categories / Food` | category icon |
| `532:1262` | treat | `Categories / Treat` | category icon |
| `532:1266` | Bathing and grooming | `Categories / Bathing & Grooming` | category icon |
| `532:1270` | Toy equipment | `Categories / Toys` | category icon |
| `532:1272` | another | `Categories / Other` | category icon |

**Note:** The category items (`food`, `treat`, etc.) might be **components** — consider promoting to `🧩 02 Components`.

---

## 🧩 02 Components (extract these from old file)

| Old ID | Old Name | Final Slot |
|---|---|---|
| `418:631` | nav-menu | `Components / Nav Menu` |
| `355:488` | Status bar - iPhone (instance inside Login) | `Components / Status Bar` |
| `386:363` | Card Product | `Components / Cards / Product Card` |
| (any reused Group XX) | inspect | promote when found reused |

---

## 🗑️ 99 Archive (move these here)

These are **floating raw assets** (imported PNG/SVGs that are now in `assets/` of the codebase). They should not live at the top level. Either move to `🗑️ 99 Archive` or **delete** since the repo has them.

| Old ID | Old Name |
|---|---|
| `720:1975` | Group 27 3 [Vectorized] |
| `579:2186` | Group 2 |
| `515:20763` | 26375175_interior_living_room 1 |
| `515:17790` | Group 21 |
| `463:2325` | Frame 108 |
| `463:1964` | 40953194_8897439 1 |
| `602:2686` | Frame 97 |
| `602:2683` | Frame 160 |
| `602:2601` | Frame 17 |
| `729:2131` | Frame 184 |
| `729:2137` | Frame 216 |
| `729:2144` | Frame 217 |
| `530:5345` | Frame 22 |
| `531:5404` | Frame 156 |
| `362:1034` | Frame 1 |
| `468:2334` | Group 17 |
| `703:1940` | Group 56 |
| `471:608` | Frame 109 |
| `551:1286` | Frame 157 |
| `401:1077` | Rectangle [Vectorized] |
| `436:1654` | Group 15 |
| `515:21008` | Group 22 |
| `487:989` | 26921549_Cat looking at feed package... 1 |
| `487:1164` | 26921549_Cat looking at feed package... 2 |
| `487:1342` | Group 20 |
| `495:2696` | 14449072_Vet clinic 1 |
| `495:4277` | 369844154_a75be1af-... 1 |
| `495:4964` | Group |
| `495:5098` | Group |
| `495:5187` | Group |
| `508:6534` | 138268978_e5b9fbc8-... 1 |
| `508:7731` | Group |
| `508:7821` | Group |
| `513:12009` | 33771679_2208... Grooming salon 1 |
| `515:16806` | 7346438_1331 1 |
| `515:17549` | Group |
| `515:20344` | 26375175_interior_living_room 1 |
| `547:21096` | Group 23 |
| `579:902` | 81091509_SL-011023-55240-04 1 [Vectorized] |
| `588:2239` | Group |
| `601:3546` | Group 26 |
| `626:3861` | Group 27 |
| `645:4196` | image 11 [Vectorized] |
| `645:6548` | image 11 [Vectorized] |
| `645:9213` | 424979545_abe2f747-... 1 |
| `645:9534` | 29171115_UI_and_UX_Sticker_Part_5 1 [Vectorized] |
| `645:9746` | Frame |
| `645:9894` | Group 45 |
| `660:10028..11607` | Rectangle [Vectorized] (multiple) |
| `660:11547` | Group 52 |
| `660:10905` | Group 50 |
| `660:11582` | Rectangle [Vectorized] |
| `685:12118` | 13916970_2010.i032.017.isometric vaccination... 1 |
| `685:13052` | 26560687_DJV FEC 280-22 1 |
| `685:13699` | Group 55 |
| `704:14155` | 379177817_47efad06-... 1 |
| `704:14958` | Group 59 |
| `704:15200` | 13587991_5282271 1 |
| `705:2145` | Line logo |
| `706:1955` | Line logo |
| `705:2148` | Facebook logo |
| `706:1952` | Facebook logo |
| `705:2152` | Google logo |
| `706:1949` | Google logo |
| `704:15644` | 40953196_8897441 1 |
| `704:15850` | Group |
| `709:2568` | Frame 215 |
| `729:2036` | Frame 202 |
| `729:2164` | Group |
| `645:9428` | Frame 194 |
| `660:10477` | Frame 195 |
| `660:11006` | Frame 197 |
| `660:11214` | Frame 196 |
| `660:11453` | Rectangle [Vectorized] |

**Recommendation:** Most of these are imported source illustrations or auto-named Groups that aren't meaningful screens. **Delete** rather than archive unless you're sure they're referenced elsewhere.

The brand logos (Line, Facebook, Google) — keep one of each in `🧩 02 Components / Other` instead.

---

## After migration — sanity checks

1. Old file should be empty (or only have an `Original messy version` page snapshot)
2. Each new page should have its sections filled in
3. Run a Figma section/cover for each page to make navigation visual
4. Update internal links (Prototype connections) so they point to renamed frames

---

## Order of operations (recommended)

1. **Day 1**: Move canonical screens (the 1 best version of each) to their new pages. Use this checklist to find them.
2. **Day 2**: Decide what's worth promoting to Components vs Archive vs Delete.
3. **Day 3**: Delete the loose imported PNG/SVG assets at top level (they're in the repo's `assets/` folder).
4. **Day 4**: Create proper Component definitions for `nav-menu`, status bar, card product, expense category icons.
5. **Day 5**: Run prototype link audit — broken links from renames.

Done? Push the polished new file URL to your team and archive the old file.
