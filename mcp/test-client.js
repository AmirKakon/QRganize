#!/usr/bin/env node
// Quick connectivity test: spawns the MCP server over stdio, lists its tools,
// and calls a couple of read-only ones. Run from the mcp/ folder:
//   node test-client.js
// Optionally set QRGANIZE_UUID first to see your real quantities.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"],
  env: { ...process.env },
});

const client = new Client(
  { name: "qrganize-test", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

const { tools } = await client.listTools();
console.log("Tools:", tools.map((t) => t.name).join(", "));

const containers = await client.callTool({
  name: "list_containers",
  arguments: {},
});
console.log("\nlist_containers ->");
console.log(containers.content[0].text);

const shopping = await client.callTool({
  name: "get_shopping_list",
  arguments: {},
});
console.log("\nget_shopping_list ->");
console.log(shopping.content[0].text);

await client.close();
