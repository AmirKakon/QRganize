#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---- Config -----------------------------------------------------------------
// The deployed QRganize API and the user id the app uses (see README for how to
// find yours). A uuid is required — the items endpoint 500s without one.
const BASE =
  process.env.QRGANIZE_API_URL ||
  "https://us-central1-qrganize-f651b.cloudfunctions.net/app";
const UUID = process.env.QRGANIZE_UUID || "mcp-client";

// ---- API helpers ------------------------------------------------------------
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      uuid: UUID,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).msg || "";
    } catch {
      /* no JSON body */
    }
    throw new Error(`API ${method} ${path} -> ${res.status} ${detail}`.trim());
  }
  return res.json();
}

const getItems = async () => (await api("/api/items/getAll")).data || [];
const getContainers = async () =>
  ((await api("/api/containers/getAll")).data || {}).containers || [];
const addLot = async (lot) =>
  (await api("/api/lots/add", { method: "POST", body: lot })).data;
const consumeItem = async (id, amount) =>
  (await api(`/api/items/use/${id}`, { method: "POST", body: { amount } })).data;
const finishItemApi = async (id) =>
  (await api(`/api/items/finish/${id}`, { method: "POST" })).data;
const createItemApi = async (body) =>
  (await api("/api/items/create", { method: "POST", body })).item;

// ---- Matching ---------------------------------------------------------------
const norm = (s) => (s || "").trim().toLowerCase();
const findByName = (list, name) => {
  const n = norm(name);
  if (!n) return null;
  return (
    list.find((x) => norm(x.name) === n) ||
    list.find((x) => norm(x.name).includes(n) || n.includes(norm(x.name))) ||
    list.find((x) => x.id === name) ||
    null
  );
};

// Ranked matches for a name/barcode, best first — for LLM disambiguation.
const candidates = (list, name) => {
  const n = norm(name);
  if (!n) return [];
  const scored = [];
  for (const x of list) {
    const xn = norm(x.name);
    let score = 0;
    if (xn === n || x.id === name || (x.barcodes || []).includes(name)) score = 100;
    else if (xn.startsWith(n)) score = 80;
    else if (xn.includes(n)) score = 60;
    else if (n.includes(xn)) score = 40;
    if (score > 0) scored.push({ score, item: x });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
};

const text = (data) => ({
  content: [
    {
      type: "text",
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

// ---- Tools ------------------------------------------------------------------
const TOOLS = [
  {
    name: "search_items",
    description:
      "Search the inventory for items by name. Omit query to list everything. " +
      "Returns id, name, price, quantity, expirationDate and shopping-list flag.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Name to search for" } },
    },
    handler: async ({ query }) => {
      const items = await getItems();
      const filtered = query
        ? items.filter((i) => norm(i.name).includes(norm(query)))
        : items;
      return text(
        filtered.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          expirationDate: i.expirationDate,
          onShoppingList: !!i.shoppingList,
        }))
      );
    },
  },
  {
    name: "list_containers",
    description: "List all containers (storage boxes/bins) with their ids and names.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const cs = await getContainers();
      return text(cs.map((c) => ({ id: c.id, name: c.name })));
    },
  },
  {
    name: "get_container_contents",
    description: "List the items inside a container, given its name or id.",
    inputSchema: {
      type: "object",
      properties: { container: { type: "string", description: "Container name or id" } },
      required: ["container"],
    },
    handler: async ({ container }) => {
      const cs = await getContainers();
      const c = findByName(cs, container);
      if (!c) return text(`No container found matching "${container}".`);
      const items = await getItems();
      const contents = [];
      for (const item of items) {
        for (const lot of item.lots || []) {
          if (lot.containerId === c.id) {
            contents.push({
              name: item.name,
              quantity: lot.quantity,
              expirationDate: lot.expirationDate,
            });
          }
        }
      }
      return text({ container: c.name, contents });
    },
  },
  {
    name: "find_item_location",
    description:
      "Find where an item is stored — returns each matching item and the " +
      "containers it lives in. Answers 'where are the X?'.",
    inputSchema: {
      type: "object",
      properties: { item: { type: "string", description: "Item name to locate" } },
      required: ["item"],
    },
    handler: async ({ item }) => {
      const items = await getItems();
      const matches = items.filter((i) => norm(i.name).includes(norm(item)));
      if (matches.length === 0)
        return text(`No item found matching "${item}".`);
      const cs = await getContainers();
      const nameById = new Map(cs.map((c) => [c.id, c.name]));
      const results = matches.map((m) => {
        const byContainer = {};
        for (const lot of m.lots || []) {
          const label = lot.containerId
            ? nameById.get(lot.containerId) || lot.containerId
            : "Unassigned";
          byContainer[label] = (byContainer[label] || 0) + (lot.quantity || 0);
        }
        const locations = Object.entries(byContainer).map(
          ([c, q]) => `${c} (${q})`
        );
        return {
          item: m.name,
          locations: locations.length ? locations : ["(no stock)"],
        };
      });
      return text(results);
    },
  },
  {
    name: "get_expiring_soon",
    description:
      "List items expiring within N days (default 30), soonest first. " +
      "Includes already-expired items (negative daysLeft).",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Window in days (default 30)" },
      },
    },
    handler: async ({ days }) => {
      const window = typeof days === "number" ? days : 30;
      const now = Date.now();
      const cutoff = now + window * 86400000;
      const items = await getItems();
      const cs = await getContainers();
      const nameById = new Map(cs.map((c) => [c.id, c.name]));
      const batches = [];
      for (const item of items) {
        for (const lot of item.lots || []) {
          if (!lot.expirationDate) continue;
          const exp = Date.parse(lot.expirationDate);
          if (isNaN(exp) || exp > cutoff) continue;
          batches.push({
            name: item.name,
            container: lot.containerId
              ? nameById.get(lot.containerId) || lot.containerId
              : "Unassigned",
            quantity: lot.quantity,
            expirationDate: lot.expirationDate,
            daysLeft: Math.ceil((exp - now) / 86400000),
            exp,
          });
        }
      }
      batches.sort((a, b) => a.exp - b.exp);
      return text(batches.map(({ exp, ...b }) => b));
    },
  },
  {
    name: "get_shopping_list",
    description:
      "Return the current shopping list (items flagged for shopping) with an " +
      "estimated total.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const list = (await getItems()).filter((i) => i.shoppingList);
      const total = list.reduce(
        (s, i) =>
          s + (parseFloat(i.price) || 0) * (i.quantity > 0 ? i.quantity : 1),
        0
      );
      return text({
        items: list.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        estimatedTotal: Number(total.toFixed(2)),
      });
    },
  },
  {
    name: "add_to_shopping_list",
    description:
      "Add an item to the shopping list. If an item with that name exists it's " +
      "flagged; otherwise a new item is created.",
    inputSchema: {
      type: "object",
      properties: {
        item: { type: "string", description: "Item name" },
        price: { type: "string", description: "Optional price for a new item" },
      },
      required: ["item"],
    },
    handler: async ({ item, price }) => {
      const existing = findByName(await getItems(), item);
      if (existing) {
        await api(`/api/items/shoppingList/${existing.id}`, {
          method: "PUT",
          body: { shoppingList: true },
        });
        return text(`Added existing item "${existing.name}" to the shopping list.`);
      }
      await api("/api/items/create", {
        method: "POST",
        body: {
          name: item,
          price: String(price ?? "0"),
          quantity: 1,
          shoppingList: true,
          image: null,
          expirationDate: null,
        },
      });
      return text(`Created "${item}" and added it to the shopping list.`);
    },
  },
  {
    name: "add_item_to_container",
    description:
      "Add stock of an existing item into a container as a batch (both given " +
      "by name). Optionally set a quantity and expiration date (YYYY-MM-DD).",
    inputSchema: {
      type: "object",
      properties: {
        item: { type: "string", description: "Item name" },
        container: { type: "string", description: "Container name" },
        quantity: { type: "number", description: "Quantity (default 1)" },
        expirationDate: { type: "string", description: "Optional YYYY-MM-DD" },
      },
      required: ["item", "container"],
    },
    handler: async ({ item, container, quantity, expirationDate }) => {
      const it = findByName(await getItems(), item);
      if (!it) return text(`No item found matching "${item}". Create it first.`);
      const c = findByName(await getContainers(), container);
      if (!c) return text(`No container found matching "${container}".`);
      await addLot({
        itemId: it.id,
        containerId: c.id,
        quantity: typeof quantity === "number" ? quantity : 1,
        expirationDate: expirationDate
          ? `${expirationDate}T00:00:00+00:00`
          : null,
      });
      return text(`Added ${it.name} to container "${c.name}".`);
    },
  },
  {
    name: "resolve_item",
    description:
      "Resolve a spoken/typed item name to concrete inventory items, best match " +
      "first. Use this to DISAMBIGUATE before consuming/finishing when a name is " +
      "vague (e.g. 'milk' → several items). Returns id, name, quantity for each " +
      "candidate so you can ask the user which one they mean.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Item name or barcode" } },
      required: ["name"],
    },
    handler: async ({ name }) => {
      const matches = candidates(await getItems(), name);
      if (matches.length === 0) return text(`No item matches "${name}".`);
      return text(
        matches.slice(0, 10).map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          onShoppingList: !!i.shoppingList,
        }))
      );
    },
  },
  {
    name: "get_item_stock",
    description:
      "Get how much of an item is in stock and where: total quantity plus each " +
      "batch's container and expiration date. Matches by name or id.",
    inputSchema: {
      type: "object",
      properties: { item: { type: "string", description: "Item name or id" } },
      required: ["item"],
    },
    handler: async ({ item }) => {
      const it = findByName(await getItems(), item);
      if (!it) return text(`No item found matching "${item}".`);
      const cs = await getContainers();
      const nameById = new Map(cs.map((c) => [c.id, c.name]));
      return text({
        id: it.id,
        name: it.name,
        quantity: it.quantity || 0,
        batches: (it.lots || []).map((l) => ({
          container: l.containerId
            ? nameById.get(l.containerId) || l.containerId
            : "Unassigned",
          quantity: l.quantity,
          expirationDate: l.expirationDate,
        })),
      });
    },
  },
  {
    name: "consume_item",
    description:
      "Record that the user USED some of an item — decrements stock by whole " +
      "units, oldest/soonest-to-expire batch first (FEFO). Default amount is 1. " +
      "Use for 'I used/finished the pasta', recipe deduction, etc. If the name is " +
      "ambiguous, call resolve_item first. Returns the remaining quantity.",
    inputSchema: {
      type: "object",
      properties: {
        item: { type: "string", description: "Item name or id" },
        amount: { type: "number", description: "Whole units to use (default 1)" },
      },
      required: ["item"],
    },
    handler: async ({ item, amount }) => {
      const it = findByName(await getItems(), item);
      if (!it) return text(`No item found matching "${item}".`);
      const n = typeof amount === "number" && amount > 0 ? Math.floor(amount) : 1;
      const res = await consumeItem(it.id, n);
      return text(
        `Used ${res.used} ${it.name}. ${res.quantity} left in stock.`
      );
    },
  },
  {
    name: "finish_item",
    description:
      "Mark an item as fully used up — clears ALL its stock (every batch) but " +
      "keeps the item so it can be re-added or put on the shopping list. Use for " +
      "'I finished the X'. Matches by name or id; disambiguate with resolve_item.",
    inputSchema: {
      type: "object",
      properties: { item: { type: "string", description: "Item name or id" } },
      required: ["item"],
    },
    handler: async ({ item }) => {
      const it = findByName(await getItems(), item);
      if (!it) return text(`No item found matching "${item}".`);
      await finishItemApi(it.id);
      return text(`Finished "${it.name}" — stock cleared to 0.`);
    },
  },
  {
    name: "create_item",
    description:
      "Create a new inventory item by name (for one-off items not scanned from a " +
      "receipt). Optionally give it an initial quantity in a container and an " +
      "expiration date (YYYY-MM-DD). If the item already exists, prefer " +
      "add_item_to_container instead.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Item name" },
        price: { type: "string", description: "Optional price" },
        container: { type: "string", description: "Optional container to stock it in" },
        quantity: { type: "number", description: "Optional quantity if a container is given (default 1)" },
        expirationDate: { type: "string", description: "Optional YYYY-MM-DD" },
      },
      required: ["name"],
    },
    handler: async ({ name, price, container, quantity, expirationDate }) => {
      const created = await createItemApi({
        name,
        price: String(price ?? "0"),
        image: null,
        shoppingList: false,
        expirationDate: null,
      });
      const itemId = created?.itemId;
      let note = `Created item "${name}".`;
      if (container && itemId) {
        const c = findByName(await getContainers(), container);
        if (!c) {
          note += ` (No container "${container}" found — left unstocked.)`;
        } else {
          await addLot({
            itemId,
            containerId: c.id,
            quantity: typeof quantity === "number" ? quantity : 1,
            expirationDate: expirationDate ? `${expirationDate}T00:00:00+00:00` : null,
          });
          note += ` Stocked ${typeof quantity === "number" ? quantity : 1} in "${c.name}".`;
        }
      }
      return text(note);
    },
  },
];

const handlers = Object.fromEntries(TOOLS.map((t) => [t.name, t.handler]));

// ---- Server -----------------------------------------------------------------
const server = new Server(
  { name: "qrganize", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const handler = handlers[request.params.name];
  if (!handler) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }
  try {
    return await handler(request.params.arguments || {});
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("QRganize MCP server running (stdio).");
