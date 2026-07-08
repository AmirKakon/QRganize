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
- [ ] **🛒 Smarter shopping list** — Currently just a filtered view (`HomePageTabs`). Add:
      - running total price
      - check-off-as-bought
      - auto-suggest items whose container quantity hit 0

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

- [ ] Global search across both items and containers
- [ ] Sorting/filtering options (by expiration, price, name, quantity)
- [ ] Categories / tags for items
- [ ] Multiple photos per item
- [ ] Container nesting (a container inside a container)
- [ ] Recently scanned / item history
- [ ] Offline support — manifest exists; add a service worker for PWA caching
- [ ] Home dashboard with stats (total items, containers, expiring soon)
- [ ] Manual barcode entry fallback when the camera fails

---

## 5. AI & MCP Integration

### 5a. MCP Server (expose QRganize to an AI assistant)
A thin MCP server wrapping the existing REST API, so Claude (or any MCP client) can query and
manage the inventory conversationally. Tools map ~1:1 to existing endpoints — low effort.

- [ ] **`find_item_location`** — "Where are the spare HDMI cables?" (wraps `getContainersOfItem`)
- [ ] **`get_container_contents`** — "What's in the garage bin?" (wraps `getItems/:containerId`)
- [ ] **`search_items` / `list_containers`** — browse inventory
- [ ] **`get_expiring_soon`** — "What's expiring this week?"
- [ ] **`get_shopping_list`** — read the current shopping list
- [ ] **`create_item` / `add_to_container`** — "Add AA batteries to my shopping list"
- [ ] Decide packaging: standalone Node package in the repo vs. bundled with `functions/`.

### 5b. In-app AI features (LLM inside the app)
- [ ] **📸 Photo → auto-fill item details** *(highest value)* — Item images are already captured as
      base64. Send to a vision model to auto-populate name / category / rough price. Removes the
      most tedious part of adding items.
- [ ] **🔤 Natural-language search** — "show me all cables in the garage" instead of exact-name filter.
- [ ] **🏷️ Auto-categorization / tagging** on save.
- [ ] **🍳 Pantry / usage suggestions** — "what can I make from this bin?"; smart restock lists
      combining low-stock + expiring-soon.

### 5c. Architecture constraints (decide before building 5b)
- [ ] **LLM calls go through Firebase Functions, never the React client** — otherwise the Anthropic
      API key ships in the browser bundle. Add an `/api/ai/*` route that calls the API server-side.
- [ ] **Cost gating** — the API is currently open; an AI endpoint has real per-call cost exposure.
      Add auth/rate-limiting on AI routes before going live. (See security notes; can be scoped
      narrowly to just the AI endpoints.)

---

_Last updated: 2026-07-08_
