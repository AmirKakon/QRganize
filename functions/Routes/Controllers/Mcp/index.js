const { app, functions, logger } = require("../../../setup");
const ItemService = require("../../Services/Items");
const ContainerService = require("../../Services/Containers");
const LotService = require("../../Services/Lots");

// A hosted Model Context Protocol (MCP) endpoint.
//
// Speaks the MCP "Streamable HTTP" transport in its stateless / JSON-response
// mode: every call is a self-contained JSON-RPC 2.0 POST that returns a single
// JSON response (no long-lived SSE stream). That fits Cloud Functions gen1,
// which buffers responses and can't hold a stream open. Tools call the internal
// services directly (no self-HTTP round-trip).

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "qrganize", version: "1.0.0" };

// ---- helpers ----------------------------------------------------------------
const norm = (s) => (s || "").trim().toLowerCase();

const findByName = (list, name) => {
  const n = norm(name);
  if (!n) return null;
  return (
    list.find((x) => norm(x.name) === n) ||
    list.find((x) => norm(x.name).includes(n) || n.includes(norm(x.name))) ||
    list.find((x) => String(x.id) === String(name)) ||
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
    if (xn === n || String(x.id) === String(name) ||
        (x.barcodes || []).includes(name)) {
      score = 100;
    } else if (xn.startsWith(n)) score = 80;
    else if (xn.includes(n)) score = 60;
    else if (n.includes(xn)) score = 40;
    if (score > 0) scored.push({ score, item: x });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
};

// Items with lot-derived quantity + earliest expiry + their lots (mirrors the
// enrichment the REST getAll controller does).
const enrichedItems = async () => {
  const { items } = await ItemService.getAllItems();
  const allLots = await LotService.getAllLots();
  const byItem = {};
  for (const lot of allLots) {
    (byItem[lot.itemId] = byItem[lot.itemId] || []).push(lot);
  }
  return (items || []).map((it) => {
    const lots = byItem[it.id] || [];
    const quantity = lots.reduce((s, l) => s + (l.quantity || 0), 0);
    const dates = lots.map((l) => l.expirationDate).filter(Boolean).sort();
    return { ...it, quantity, expirationDate: dates[0] || null, lots };
  });
};

const containersList = async () =>
  (await ContainerService.getAllContainers()).containers || [];

const toDate = (d) => (d ? `${d}T00:00:00+00:00` : null);

// ---- tools ------------------------------------------------------------------
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
      const items = await enrichedItems();
      const filtered = query ?
        items.filter((i) => norm(i.name).includes(norm(query))) :
        items;
      return filtered.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        expirationDate: i.expirationDate,
        onShoppingList: !!i.shoppingList,
      }));
    },
  },
  {
    name: "resolve_item",
    description:
      "Resolve a vague item name to concrete items, best match first. Use to " +
      "DISAMBIGUATE before consuming/finishing when a name could match several " +
      "items (e.g. 'milk'). Returns id, name, quantity so you can ask which.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Item name or barcode" } },
      required: ["name"],
    },
    handler: async ({ name }) => {
      const matches = candidates(await enrichedItems(), name);
      if (matches.length === 0) return `No item matches "${name}".`;
      return matches.slice(0, 10).map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        onShoppingList: !!i.shoppingList,
      }));
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
      const it = findByName(await enrichedItems(), item);
      if (!it) return `No item found matching "${item}".`;
      const nameById = new Map((await containersList()).map((c) => [c.id, c.name]));
      return {
        id: it.id,
        name: it.name,
        quantity: it.quantity || 0,
        batches: (it.lots || []).map((l) => ({
          container: l.containerId ?
            nameById.get(l.containerId) || l.containerId :
            "Unassigned",
          quantity: l.quantity,
          expirationDate: l.expirationDate,
        })),
      };
    },
  },
  {
    name: "find_item_location",
    description:
      "Find where an item is stored — each matching item and the containers it " +
      "lives in. Answers 'where are the X?'.",
    inputSchema: {
      type: "object",
      properties: { item: { type: "string", description: "Item name to locate" } },
      required: ["item"],
    },
    handler: async ({ item }) => {
      const items = (await enrichedItems()).filter((i) =>
        norm(i.name).includes(norm(item)),
      );
      if (items.length === 0) return `No item found matching "${item}".`;
      const nameById = new Map((await containersList()).map((c) => [c.id, c.name]));
      return items.map((m) => {
        const byContainer = {};
        for (const lot of m.lots || []) {
          const label = lot.containerId ?
            nameById.get(lot.containerId) || lot.containerId :
            "Unassigned";
          byContainer[label] = (byContainer[label] || 0) + (lot.quantity || 0);
        }
        const locations = Object.entries(byContainer).map(([c, q]) => `${c} (${q})`);
        return { item: m.name, locations: locations.length ? locations : ["(no stock)"] };
      });
    },
  },
  {
    name: "list_containers",
    description: "List all containers (storage boxes/bins) with ids and names.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => (await containersList()).map((c) => ({ id: c.id, name: c.name })),
  },
  {
    name: "get_container_contents",
    description: "List the items inside a container, given its name or id.",
    inputSchema: {
      type: "object",
      properties: {
        container: { type: "string", description: "Container name or id" },
      },
      required: ["container"],
    },
    handler: async ({ container }) => {
      const c = findByName(await containersList(), container);
      if (!c) return `No container found matching "${container}".`;
      const contents = [];
      for (const it of await enrichedItems()) {
        for (const lot of it.lots || []) {
          if (lot.containerId === c.id) {
            contents.push({
              name: it.name,
              quantity: lot.quantity,
              expirationDate: lot.expirationDate,
            });
          }
        }
      }
      return { container: c.name, contents };
    },
  },
  {
    name: "get_expiring_soon",
    description:
      "List batches expiring within N days (default 30), soonest first. " +
      "Includes already-expired batches (negative daysLeft).",
    inputSchema: {
      type: "object",
      properties: { days: { type: "number", description: "Window in days (default 30)" } },
    },
    handler: async ({ days }) => {
      const win = typeof days === "number" ? days : 30;
      const now = Date.now();
      const cutoff = now + win * 86400000;
      const nameById = new Map((await containersList()).map((c) => [c.id, c.name]));
      const batches = [];
      for (const it of await enrichedItems()) {
        for (const lot of it.lots || []) {
          if (!lot.expirationDate) continue;
          const exp = Date.parse(lot.expirationDate);
          if (isNaN(exp) || exp > cutoff) continue;
          batches.push({
            name: it.name,
            container: lot.containerId ?
              nameById.get(lot.containerId) || lot.containerId :
              "Unassigned",
            quantity: lot.quantity,
            expirationDate: lot.expirationDate,
            daysLeft: Math.ceil((exp - now) / 86400000),
            _exp: exp,
          });
        }
      }
      batches.sort((a, b) => a._exp - b._exp);
      return batches.map(({ _exp, ...b }) => b);
    },
  },
  {
    name: "get_shopping_list",
    description:
      "Return the current shopping list (items flagged to buy) with an " +
      "estimated total.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const list = (await enrichedItems()).filter((i) => i.shoppingList);
      const total = list.reduce(
        (s, i) => s + (parseFloat(i.price) || 0) * (i.quantity > 0 ? i.quantity : 1),
        0,
      );
      return {
        items: list.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        estimatedTotal: Number(total.toFixed(2)),
      };
    },
  },
  {
    name: "consume_item",
    description:
      "Record that the user USED some of an item — decrements stock by whole " +
      "units, soonest-to-expire batch first (FEFO). Default amount 1. For 'I " +
      "used/ate X' and recipe deduction. Disambiguate a vague name with " +
      "resolve_item first. Returns remaining quantity.",
    inputSchema: {
      type: "object",
      properties: {
        item: { type: "string", description: "Item name or id" },
        amount: { type: "number", description: "Whole units to use (default 1)" },
      },
      required: ["item"],
    },
    handler: async ({ item, amount }) => {
      const it = findByName(await enrichedItems(), item);
      if (!it) return `No item found matching "${item}".`;
      const n = typeof amount === "number" && amount > 0 ? Math.floor(amount) : 1;
      const res = await ItemService.consume(it.id, n);
      return `Used ${res.used} ${it.name}. ${res.quantity} left in stock.`;
    },
  },
  {
    name: "finish_item",
    description:
      "Mark an item fully used up — clears ALL its stock (every batch) but keeps " +
      "the item so it can be re-added or put on the shopping list. For 'I " +
      "finished the X'. Disambiguate with resolve_item.",
    inputSchema: {
      type: "object",
      properties: { item: { type: "string", description: "Item name or id" } },
      required: ["item"],
    },
    handler: async ({ item }) => {
      const it = findByName(await enrichedItems(), item);
      if (!it) return `No item found matching "${item}".`;
      await ItemService.finish(it.id);
      return `Finished "${it.name}" — stock cleared to 0.`;
    },
  },
  {
    name: "create_item",
    description:
      "Create a new inventory item by name (for one-off items not scanned from " +
      "a receipt). Optionally stock it in a container with a quantity and expiry " +
      "(YYYY-MM-DD). If it already exists, use add_item_to_container instead.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Item name" },
        price: { type: "string", description: "Optional price" },
        container: { type: "string", description: "Optional container to stock it in" },
        quantity: { type: "number", description: "Optional quantity (default 1)" },
        expirationDate: { type: "string", description: "Optional YYYY-MM-DD" },
      },
      required: ["name"],
    },
    handler: async ({ name, price, container, quantity, expirationDate }) => {
      const created = await ItemService.createItem(
        name, String(price ?? "0"), null, false, null,
      );
      const itemId = created && created.itemId;
      let note = `Created item "${name}".`;
      if (container && itemId) {
        const c = findByName(await containersList(), container);
        if (!c) {
          note += ` (No container "${container}" found — left unstocked.)`;
        } else {
          const qty = typeof quantity === "number" ? quantity : 1;
          await LotService.addLot(itemId, c.id, qty, toDate(expirationDate));
          note += ` Stocked ${qty} in "${c.name}".`;
        }
      }
      return note;
    },
  },
  {
    name: "add_item_to_container",
    description:
      "Add stock of an EXISTING item into a container as a batch (both by " +
      "name). Optionally set quantity and expiration date (YYYY-MM-DD).",
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
      const it = findByName(await enrichedItems(), item);
      if (!it) return `No item found matching "${item}". Create it first.`;
      const c = findByName(await containersList(), container);
      if (!c) return `No container found matching "${container}".`;
      const qty = typeof quantity === "number" ? quantity : 1;
      await LotService.addLot(it.id, c.id, qty, toDate(expirationDate));
      return `Added ${qty} ${it.name} to "${c.name}".`;
    },
  },
  {
    name: "add_to_shopping_list",
    description:
      "Add an item to the shopping list. If an item with that name exists it's " +
      "flagged; otherwise a new item is created and flagged.",
    inputSchema: {
      type: "object",
      properties: {
        item: { type: "string", description: "Item name" },
        price: { type: "string", description: "Optional price for a new item" },
      },
      required: ["item"],
    },
    handler: async ({ item, price }) => {
      const existing = findByName(await enrichedItems(), item);
      if (existing) {
        await ItemService.setShoppingList(existing.id, true);
        return `Added existing item "${existing.name}" to the shopping list.`;
      }
      await ItemService.createItem(item, String(price ?? "0"), null, true, null);
      return `Created "${item}" and added it to the shopping list.`;
    },
  },
];

const handlers = Object.fromEntries(TOOLS.map((t) => [t.name, t.handler]));
const toolList = TOOLS.map(({ name, description, inputSchema }) => ({
  name,
  description,
  inputSchema,
}));

// ---- JSON-RPC dispatch ------------------------------------------------------
// Returns a JSON-RPC response object, or null for notifications (no reply).
const handleRpc = async (msg) => {
  const { id, method, params } = msg || {};
  const isNotification = id === undefined || id === null;
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  const err = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  try {
    switch (method) {
      case "initialize":
        return ok({
          protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
        });
      case "ping":
        return ok({});
      case "tools/list":
        return ok({ tools: toolList });
      case "tools/call": {
        const handler = handlers[params && params.name];
        if (!handler) {
          return ok({
            content: [{ type: "text", text: `Unknown tool: ${params && params.name}` }],
            isError: true,
          });
        }
        try {
          const out = await handler((params && params.arguments) || {});
          const textOut = typeof out === "string" ? out : JSON.stringify(out, null, 2);
          return ok({ content: [{ type: "text", text: textOut }] });
        } catch (error) {
          logger.error(`MCP tool ${params.name} failed`, error);
          return ok({
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          });
        }
      }
      default:
        // Notifications (e.g. notifications/initialized) get no response.
        if (isNotification) return null;
        return err(-32601, `Method not found: ${method}`);
    }
  } catch (error) {
    if (isNotification) return null;
    return err(-32603, error.message || "Internal error");
  }
};

// ---- HTTP endpoint ----------------------------------------------------------
app.post("/api/mcp", async (req, res) => {
  // Optional shared-secret gate: set `mcp.key` in functions config to require
  // `Authorization: Bearer <key>`. Left open if unset (matches the rest of the
  // API today) — set it before exposing the endpoint to a remote LLM.
  const cfg = functions.config().mcp || {};
  if (cfg.key && req.headers["authorization"] !== `Bearer ${cfg.key}`) {
    return res.status(401).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message: "Unauthorized" },
    });
  }

  try {
    const body = req.body;
    if (Array.isArray(body)) {
      const out = [];
      for (const m of body) {
        const r = await handleRpc(m);
        if (r) out.push(r);
      }
      return out.length ? res.json(out) : res.status(202).end();
    }
    const r = await handleRpc(body);
    return r ? res.json(r) : res.status(202).end();
  } catch (error) {
    logger.error("MCP request failed", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal error" },
      });
    }
  }
});

// Stateless server: no long-lived SSE stream / session resumption.
app.get("/api/mcp", (req, res) =>
  res.status(405).json({
    jsonrpc: "2.0",
    id: null,
    error: { code: -32000, message: "Method not allowed. Use POST (JSON-RPC)." },
  }),
);

module.exports = { app };
