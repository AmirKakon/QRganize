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
