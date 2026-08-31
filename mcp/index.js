#!/usr/bin/env node
// Bridge a local stdio MCP client to the hosted OpenQR MCP endpoint
// (https://openqr.uk/mcp, streamable HTTP, Bearer API key).
//
// The bridge is transparent: every JSON-RPC message the client writes to
// stdio is forwarded to the remote session verbatim, and every message the
// remote sends back is written to stdio. Nothing is buffered, filtered or
// re-implemented, so the tool list stays exactly what the server exposes.
//
// Usage: OPENQR_API_KEY=oqr_... npx -y @open-qr/mcp
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.env.OPENQR_MCP_URL ?? "https://openqr.uk/mcp";
const key = process.env.OPENQR_API_KEY;

if (!key) {
  console.error(
    "OPENQR_API_KEY is required. Get a free key at https://openqr.uk/api"
  );
  process.exit(1);
}

const remote = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});
const stdio = new StdioServerTransport();

let warned = false;
remote.onerror = (error) => {
  // A 401 from the remote surfaces here as a generic stream error; say the
  // useful thing once instead of the SDK's raw message.
  if (!warned && /401|unauthorized|forbidden/i.test(String(error))) {
    warned = true;
    console.error(
      "OpenQR rejected the API key. Check OPENQR_API_KEY (free key: https://openqr.uk/api)."
    );
  }
  console.error(String(error));
};
stdio.onerror = (error) => console.error(String(error));

remote.onmessage = (message) => stdio.send(message);
stdio.onmessage = (message) => remote.send(message);

let closing = false;
const close = async () => {
  if (closing) return;
  closing = true;
  for (const transport of [stdio, remote]) {
    try {
      await transport.close();
    } catch {
      // already closed or never opened; nothing to do
    }
  }
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);

await remote.start();
await stdio.start();
