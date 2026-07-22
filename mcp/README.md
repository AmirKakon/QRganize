# QRganize MCP Server

A small [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes your QRganize inventory to an AI assistant (Claude Code, Claude Desktop,
etc.). It runs locally and calls the deployed QRganize REST API — so you can ask
things like *"where are the spare HDMI cables?"* or *"add AA batteries to my
shopping list"* in natural language.

> **Driving this from an LLM?** See [`LLM_GUIDE.md`](LLM_GUIDE.md) — a
> self-contained reference (inventory model, tool catalog, behavior rules,
> workflows) you can hand to any assistant so it knows how to use these tools.

## Two ways to connect

- **Hosted (HTTP)** — a network-reachable MCP endpoint lives on the backend at
  `POST https://us-central1-qrganize-f651b.cloudfunctions.net/app/api/mcp`
  (MCP Streamable HTTP, stateless JSON-RPC — one self-contained POST per call,
  no local process). Use this for remote/hosted assistants. See
  [Hosted endpoint](#hosted-endpoint) below.
- **Local (stdio)** — the `node mcp/index.js` wrapper described here, for local
  clients (Claude Desktop/Code) that spawn a child process.

Both speak the same tool set.

## Setup (local stdio)

Requires Node 18+.

```bash
cd mcp
npm install
```

## Configure your AI client

**Claude Code (CLI):**
```bash
claude mcp add qrganize --env QRGANIZE_UUID=<your-uuid> -- node "C:\\Users\\amirka\\source\\repos\\QRganize\\mcp\\index.js"
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "qrganize": {
      "command": "node",
      "args": ["C:\\Users\\amirka\\source\\repos\\QRganize\\mcp\\index.js"],
      "env": {
        "QRGANIZE_UUID": "<your-uuid>"
      }
    }
  }
}
```

Restart the client after adding it.

## Environment variables

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `QRGANIZE_API_URL` | no | `https://us-central1-qrganize-f651b.cloudfunctions.net/app` | The deployed API base URL |
| `QRGANIZE_UUID` | recommended | `mcp-client` | The per-device id the app uses. Without *your* uuid, item quantities/expiration dates read as 0/empty (the item list and shopping-list flags still work). |

**Finding your uuid:** open the QRganize web app, open browser DevTools →
Console, and run `localStorage.getItem("uuid")`. Use that value so the MCP
server sees the same quantities and expiration dates as the app.

## Tools

| Tool | What it does |
|------|--------------|
| `search_items` | Search items by name (or list all) |
| `list_containers` | List all containers |
| `get_container_contents` | Items inside a container |
| `find_item_location` | Which container(s) an item is in |
| `get_expiring_soon` | Items expiring within N days |
| `get_shopping_list` | Current shopping list + estimated total |
| `add_to_shopping_list` | Flag/create an item on the shopping list |
| `add_item_to_container` | Put an item into a container |
| `resolve_item` | Rank name matches for disambiguation ("which milk?") |
| `get_item_stock` | How much of an item is in stock and where |
| `consume_item` | Record using N whole units (FEFO) |
| `finish_item` | Clear all of an item's stock (keeps the item) |
| `create_item` | Create a one-off item (optional image + stocked in a container) |
| `set_item_image` | Set/replace an existing item's photo (URL or base64) |

## Hosted endpoint

A network-reachable MCP server runs on the backend (no local process needed):

```
POST https://us-central1-qrganize-f651b.cloudfunctions.net/app/api/mcp
```

It speaks **MCP Streamable HTTP** in stateless JSON-response mode — each call is
a self-contained JSON-RPC 2.0 POST returning a single JSON body (no SSE stream),
which suits the Cloud Functions gen1 runtime. `GET` returns 405.

**Auth (recommended before remote use):** the endpoint is open unless a shared
secret is set. Configure one, then send it as a bearer token:

```bash
firebase functions:config:set mcp.key="<long-random-secret>"
firebase deploy --only functions
# then clients send:  Authorization: Bearer <long-random-secret>
```

Quick smoke test (`initialize` handshake):

```bash
curl -s https://us-central1-qrganize-f651b.cloudfunctions.net/app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-key>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

## Example prompts

- "Where did I put the HDMI cables?"
- "What's in the garage bin?"
- "What's expiring this week?"
- "What's on my shopping list and roughly how much is it?"
- "Add batteries to my shopping list."
- "Put the label maker in the office drawer."

## Notes

- The QRganize API is currently open (no auth), so the server only needs the
  base URL and a uuid — no token. Keep that in mind before sharing it widely.
- Read-only tools are safe to run anytime; `add_*` tools mutate your inventory.
