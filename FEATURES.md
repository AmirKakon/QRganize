# QRganize — Feature & Improvement Backlog

A running list of features and UX improvements we want to make. Grouped by effort/impact.
Check items off as they ship. Add new ideas at the bottom of the relevant section.

> Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## 1. Quick Wins (low effort, high daily-use payoff)

- [x] **Confirmation before delete** — Item and container deletes fire immediately on one tap;
      container delete also cascades to all its item links. Add an "Are you sure?" dialog.
      - Item: `handleDelete` in `src/components/ItemDetails/index.js`
      - Container: `handleDelete` in `src/components/ContainerDetails/index.js`
- [x] **Fix empty expiration date showing "today"** — `value={dayjs(item.expirationDate)}` in
      `src/components/ItemDetails/index.js` resolves to *now* when the date is undefined, so every
      dateless item looks like it expires today. Use `item.expirationDate ? dayjs(...) : null` and
      add a "clear date" affordance.
- [x] **Empty states** — Item/container lists render blank when empty. Add friendly guidance
      ("No items yet — scan a barcode to add your first one") with a CTA.
      - `src/components/ItemList/index.js`, `src/components/ContainerList/index.js`
- [x] **Scan-miss feedback** — Scanning an unknown barcode silently drops the user into a blank
      item form. Add a toast like "New barcode — let's create it" so it feels intentional.
      - `src/components/BarcodeScanner/index.js`, `src/pages/ItemPage/index.js`
- [x] **Enable dark mode** — Enabled OS-based dark mode (auto via `prefersDarkMode`). Added
      `CssBaseline`, theme-aware page/footer backgrounds, and fixed the `darkThemeOptions` structure.
      Added a manual sun/moon toggle in the header (persists to `localStorage`, overrides the OS
      setting; falls back to following the OS until the user picks one).

---

## 2. Standout Features (biggest jump in usefulness)

- [x] **🔎 "Where is this?" reverse lookup** — The item page now shows which containers hold the
      item as clickable chips (names resolved via `getAllContainers`, navigate to the container on
      click). Fetched in `ItemPage` keyed on the barcode id; refreshes after "Add to Containers".
- [x] **🏷️ Batch label printing** — New `/labels` page (linked in the header). Toggle between
      Containers (QR) and Items (barcode), search + multi-select with select-all/clear, live preview
      grid, and a Print button. Print CSS (`@media print`) shows only the label sheet and keeps
      labels from splitting across pages. Components: `pages/PrintLabelsPage`, `components/Label`.
- [x] **⏰ Expiration dashboard** — New "Expiring Soon" tab on the home page. Lists items that have
      an `expirationDate`, sorted soonest-first, with a color-coded status chip (red = expired/≤7d,
      orange = ≤30d, green = further out) and the formatted date; click an item to open it. Data
      already flows via `getAllItems` (stored per-user in `userItems`), so no backend change needed.
      Components: `components/ExpiringItemsList`, `HomePageTabs/Tabs/expiringTab`.
- [~] **🛒 Smarter shopping list** — Dedicated checklist view (`components/ShoppingList`) replacing
      the old image grid. Done:
      - [x] running total price ("List total") + "Left to buy" total that excludes checked items
      - [x] check-off-as-bought (in-session): tap to tick, strikethrough, excluded from remaining
      - [x] persist check-off / remove-purchased — new backend endpoint
            `PUT /api/items/shoppingList/:id` (id only, accepts a boolean; no image required).
            "Remove purchased (N)" button calls it per checked item and refreshes the list.
      - [ ] auto-suggest items whose container quantity hit 0 (needs container-quantity aggregation)
- [x] **🏠 Areas** — Containers can belong to an area (Kitchen, Pantry, Garage…). New `areas`
      collection + CRUD (`functions/Routes/{Services,Controllers}/Areas`); containers gain an
      optional `areaId`; deleting an area unassigns its containers (never deletes them). New
      `/areas` page (header link) to create/rename/delete areas and see each area's containers;
      the container page has an Area dropdown. Backend deploy only; no migration.

---

## 3. Under-the-Hood UX / Tech Debt

- [ ] **Batch the add-to-container calls** — `handleAddToContainers`
      (`src/components/ItemDetails/index.js`) loops `await` one item at a time = N network round
      trips. A batch endpoint would make multi-add feel instant.
- [ ] **Clarify the two "quantity" concepts** — `item.quantity` on the item vs. per-container
      quantity in the `containerItems` join collection. The UI is ambiguous about which it means
      where. Decide on one model and label it clearly.

---

## 4. Ideas Parking Lot (unprioritized — capture now, triage later)

- [x] Global search across both items and containers — new `/search` page (header link):
      one box searches items (by name or barcode) and containers (by name); results are
      grouped and clickable. (`pages/SearchPage`)
- [x] Sorting/filtering options — View Items now has a filter bar: search + Status
      (all / in stock / out of stock / expiring ≤30d) + **Area** + **Container** (scoped
      to the chosen area) + Sort (name / price / quantity / expiry), with a result count
      and Clear. (`components/ItemList`)
- [ ] Categories / tags for items
- [ ] Multiple photos per item
- [ ] Container nesting (a container inside a container)
- [ ] Recently scanned / item history
- [ ] Offline support — manifest exists; add a service worker for PWA caching
- [x] Home dashboard with stats (total items, containers, expiring soon) — "Overview"
      is now the default Home tab (`components/HomeDashboard`): clickable count tiles + a
      "next to expire" peek.
- [ ] Manual barcode entry fallback when the camera fails

---

## 5. AI & MCP Integration

### 5a. MCP Server (expose QRganize to an AI assistant) — [x] built
Standalone Node MCP server in [`mcp/`](mcp/) (`@modelcontextprotocol/sdk`, stdio) that wraps the
deployed REST API. Runs locally; register it with Claude Code / Desktop (see `mcp/README.md`).
Tools:

- [x] **`find_item_location`** — "Where are the spare HDMI cables?" (wraps `getContainers/:itemId`)
- [x] **`get_container_contents`** — "What's in the garage bin?" (wraps `getItems/:containerId`)
- [x] **`search_items` / `list_containers`** — browse inventory
- [x] **`get_expiring_soon`** — "What's expiring this week?"
- [x] **`get_shopping_list`** — read the current shopping list + estimated total
- [x] **`add_to_shopping_list` / `add_item_to_container`** — mutate the inventory
- [x] Packaging: standalone Node package in the repo (`mcp/`), not bundled with `functions/`.

### 5b. In-app AI features (LLM inside the app)
- [x] **🧾 Receipt scanner** *(live)* — New `/scan-receipt` page (header link). Take/upload a receipt
      photo → backend `POST /api/ai/parseReceipt` sends it to **Google Gemini** vision
      (`gemini-2.5-flash` default, override via `functions.config().gemini.model`) with a
      structured-output `responseSchema` → returns `{name, price, quantity}` line items. Review screen lets you edit each row, flags matches against existing
      items (so no duplicates), and optionally files everything into a chosen container. Uses
      `axios` (no new SDK). Provider chosen for its free tier — swap via config. Components:
      `functions/Routes/{Services,Controllers}/Ai`, `pages/ScanReceiptPage`.
      - Prereq: `firebase functions:config:set gemini.key="..."` (free key from Google AI Studio),
        then deploy. Read as `functions.config().gemini.key` — same mechanism as the rest of the
        app (JWT, apify, google_customsearch). Note: `functions.config()` is deprecated
        (retires ~March 2027); migrating the whole app to Secret Manager/params is a future task.
      - Note: `createItem` now allows a null `image` (receipt items have no photo).
      - [x] **Weighed-item pricing** — sold-by-weight lines return the line total as price with
        quantity 1 (not per-kg × fractional weight); bags/fees/deposits are skipped; quantities are
        normalized to whole numbers.
      - [x] **Barcode matching** — Gemini also extracts each line's barcode; the review screen matches
        it to existing items (keyed by barcode) before falling back to name. New items with a real
        barcode (≥8 digits) are created keyed by that barcode, so future scans + the barcode scanner
        recognize them.
      - [x] **Manual merge-to-existing** — each review row has a 🔗 picker to link a "New" line to an
        existing item (bridges garbled OCR names / misread barcodes). Save always records the
        purchased quantity as a lot (unassigned when no container is picked).
- [ ] **📸 Photo → auto-fill item details** *(highest value)* — Item images are already captured as
      base64. Send to a vision model to auto-populate name / category / rough price. Removes the
      most tedious part of adding items.
- [ ] **🔤 Natural-language search** — "show me all cables in the garage" instead of exact-name filter.
- [ ] **🏷️ Auto-categorization / tagging** on save.
- [ ] **🍳 Pantry / usage suggestions** — "what can I make from this bin?"; smart restock lists
      combining low-stock + expiring-soon.

### 5c. Architecture constraints (decide before building 5b)
- [x] **LLM calls go through Firebase Functions, never the React client** — the receipt scanner's
      `/api/ai/parseReceipt` route calls Gemini server-side; the API key lives in functions config.
- [x] **Cost gating** — the receipt endpoint enforces a per-uuid daily call cap (25/day) via a
      Firestore `aiUsage` counter, returning 429 when exceeded. (The API is still otherwise open —
      broader auth/rate-limiting remains a separate hardening task.)

---

## 6. Lot / Batch Inventory Model (shipped)

Replace the single per-item quantity + single expiration date with **lots** (batches). A lot is
`{ itemId, containerId | null, quantity, expirationDate | null }`; an item is the sum of its lots.
This lets the same item live in several containers with different amounts **and** carry several
expiration dates (e.g. two milk bottles in the fridge expiring on different days = two lots).

Decisions locked: expiry **tied to location** (a lot has both), **global** scope, migrate
`containerItems` amounts as-is (drop the old single total, re-enter expiries), **FEFO** default for
"use one", **Used vs Toss** are separate actions, **merge** lots by (container + date).

Phases:
- [x] **1. Backend lots** — `lots` collection + service/controller (`add`, `update`, `use`, `delete`,
      `byItem`, `byContainer`, `migrate`). Additive; `containerItems`/`userItems` untouched so the
      current UI keeps working. `POST /api/lots/migrate` seeds lots from containerItems (idempotent).
- [x] **2. Item-page stock list** — `components/StockList`: "In stock" total, Add stock (container +
      qty + date, merges by container+date), Use one (FEFO), per-batch Use / Edit (move/qty/date) /
      Toss. `getItems` now derives quantity + earliest expiry from lots (falls back to legacy fields
      until an item has lots). `createItem` no longer requires quantity. Needs functions deploy +
      one-time `POST /api/lots/migrate`.
- [x] **3. Container + Expiring views on lots** — Expiring tab lists each expiring *batch*
      (`components/ExpiringItemsList`) with inline Used/Toss; container page shows its lots via
      `components/ContainerContents` (add item → lot, per-batch use/toss). Shopping-list totals come
      from lot-derived `getItems.quantity`. Frontend-only (backend already deployed in phase 2).
- [x] **4. Receipt scanner + MCP** read/write lots — receipt "add to container" creates lots; MCP
      tools (`find_item_location`, `get_container_contents`, `get_expiring_soon`,
      `add_item_to_container`) now derive from / write lots.
- [x] **5. Cutover** — `getItems`/`find`/`get` derive quantity + expiries purely from lots (no more
      `userItems` fallback); `createItem` no longer writes `userItems`; deleting an item or container
      now cascades to its lots. Removed the dead `ItemsInContainerList` component.
- [x] **6. Legacy retirement** — removed the now-dead `containerItems` join collection and `userItems`
      per-user collection from the **prod** `app` (Routes) + frontend: the container-item service
      methods & endpoints (`/api/containers/{addItems,removeItems,updateItemQuantity,`
      `updateItemQuantitiesBatch,getItems,getContainers}`), the user-item methods & endpoints, the
      `POST /api/lots/migrate` one-time migration, the `ContainerItem` contract, and 5 unused frontend
      api wrappers. Kept user CRUD (`users` collection) and left the `dev` app (DevRoutes, still on the
      old `*_dev` collections) untouched. *(Orphaned `containerItems`/`userItems` documents in
      Firestore are harmless; delete them as a one-time housekeeping step if desired.)*

---

## 7. Maintenance & Data Hygiene

- [x] **🧬 Find duplicate items** — New `/duplicates` page (header link). Client-side fuzzy detection
      (normalized names + Levenshtein similarity + containment) clusters likely-duplicate items; pick
      the keeper and merge the rest with a confirm step. Backend `POST /api/items/merge` moves the
      source's lots onto the target (coalescing by container + date), carries the shopping-list flag,
      then deletes the source. Bridges cross-language / misspelled dupes the barcode matcher can't
      (e.g. `Chery tomatoes` / `Chery tomatos`). Files: `Routes/{Services,Controllers}/Items`
      (`mergeItems`), `pages/DuplicatesPage`.
- [x] **🏷️ Multiple barcodes per item (aliases)** — an item can answer to several barcodes (e.g. the
      same product from different packages/brands). Items store a `barcodes` alias array; `findItem`
      resolves a scanned code by document id **then** by `barcodes` (`array-contains`). Merging
      duplicates unions every merged item's barcode onto the survivor, and linking a receipt line to
      an existing item records that line's barcode on it (`PUT /api/items/addBarcode/:id`,
      `FieldValue.arrayUnion`). Without this, merging was lossy — a merged-away barcode would rescan as
      a brand-new item. The receipt matcher also checks the alias array.
- [ ] Delete orphaned `containerItems` / `userItems` Firestore documents (one-time housekeeping).

---

_Last updated: 2026-07-16_
