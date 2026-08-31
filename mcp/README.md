# @open-qr/mcp

MCP server for [OpenQR](https://openqr.uk): generate QR codes and create, edit
and track dynamic (editable) QR codes with scan analytics.

A thin stdio-to-HTTP bridge: it forwards MCP traffic between your client and the
hosted endpoint at `https://openqr.uk/mcp`. No tools are implemented here, so
the tool list always matches what the server exposes (currently 17 tools, 4
prompts, 5 resources).

## Setup

1. Get a free API key at [openqr.uk/api](https://openqr.uk/api).
2. Point your MCP client at the command below with the key in the environment.

```json
{
  "mcpServers": {
    "openqr": {
      "command": "npx",
      "args": ["-y", "@open-qr/mcp"],
      "env": { "OPENQR_API_KEY": "oqr_..." }
    }
  }
}
```

Prefer the hosted endpoint directly? Most remote-capable clients (Claude Web,
Claude Desktop, Cursor, Cline) can connect to `https://openqr.uk/mcp` over
streamable HTTP with a `Bearer` Authorization header, no bridge needed.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENQR_API_KEY` | yes | Bearer key from [openqr.uk/api](https://openqr.uk/api) |
| `OPENQR_MCP_URL` | no | Override the endpoint (default `https://openqr.uk/mcp`) |

## Verify

With a real key in the environment:

```bash
npm install
OPENQR_API_KEY=oqr_... node verify.mjs
```

That runs the full round-trip a client would: initialize, list tools, list
prompts and resources, generate a QR, and make an authenticated dynamic-code
call.

## Licence

AGPL-3.0-only, same as the repository.
