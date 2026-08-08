# OpenQR

**Free, open-source, watermark-free QR code generator.** Runs entirely in your
browser — no tracking, no sign-up, no limits.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-07B1B0.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-232E3A)
![No watermark](https://img.shields.io/badge/watermark-none-07B1B0)

Most online QR generators bait you with "free" and then add a watermark, cap your
download size, hide vector export behind a paywall, or route your code through
*their* servers so it dies when you stop paying. A QR code is just an open
standard (ISO/IEC 18004) that costs nothing to generate. **OpenQR keeps it that way.**

This repository is the **basic generator tool** — the reference open-source
implementation. It is deliberately small and easy to fork.

## Hosted version: free API, MCP server and editable codes

Everything in this repo is and stays free, with no watermark and no expiry. The
hosted build at **[openqr.uk](https://openqr.uk)** adds an *optional* account layer
for people who want editable codes and automation:

- **Dynamic / editable QR codes** with scan analytics. Change the destination after
  you've printed it. **3 free** on a free account (7 days of scans by country);
  unlimited on Pro at £9/month or £72/year, which also unlocks full analytics
  history, town and region detail, device and referrer breakdowns with CSV export,
  a branded subdomain, and password-protected codes.
- **Free REST API.** Generate codes and manage dynamic codes programmatically.
  OpenAPI spec at [`/openapi.json`](https://openqr.uk/openapi.json); interactive docs
  at **[openqr.uk/api](https://openqr.uk/api)**.
- **Hosted MCP server** at `https://openqr.uk/mcp` (Streamable HTTP, 14 tools).
  Generate and manage QR codes directly from Claude, Cursor or any MCP client. Listed
  in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=openqr).

The static generator in this repository never calls any of that. It stays 100%
client-side (see [Privacy](#privacy)), and none of it is required to use or
self-host the generator.

## Features

- **No watermarks, no size limits, no sign-up** — every feature is free
- **Private by design** — codes are generated entirely in your browser; the content never touches a server
- **Export anywhere** — PNG / JPEG / WebP up to 4096px, plus true-vector **SVG** and **PDF**
- **Full styling** — colours, gradients, dot & corner styles, logo embedding, "Scan me" frames
- **Smart input** — paste a link or text and the type is auto-detected
- **Rich payloads** — URL, text, email, phone, SMS, WhatsApp, Wi-Fi, and a map-based location picker
- One-click copy, shareable design links, light/dark, responsive, keyboard-accessible

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3011
```

## Build & self-host

```bash
pnpm build
pnpm start      # serves on :3011 (standalone output)
```

It's a standard Next.js app — host it anywhere (a VPS, a Raspberry Pi, Cloudflare,
behind any reverse proxy). It needs **no environment variables, no database, no
secrets** to run.

## Embedding

The `<Generator/>` component is self-contained and configurable:

```tsx
import { Generator } from "@/components/generator/generator";

// Full page (default OpenQR logo header):
<Generator />

// Embedded widget, your own branding, no default header:
<Generator embedded header={<MyLogo />} />

// Inject your own post-download call-to-action:
<Generator renderSuccess={(variant) => <MySupportCluster variant={variant} />} />
```

The tool ships **zero analytics**. If you want anonymous UI events (e.g. which
export format was used — never the QR content), inject a handler:

```ts
import { setTrackHandler } from "@/lib/analytics";
setTrackHandler((action, name, category) => myAnalytics.track(category, action, name));
```

## Privacy

QR generation happens 100% in your browser. The only optional outbound calls are
in the **Location** tool: map tiles from CARTO and address lookups via
OpenStreetMap's Nominatim. Nothing else leaves the device.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 ·
[`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) · Leaflet · pnpm.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep it simple, accessible, client-side,
and free — no feature should ever require payment to remove a watermark or unlock
a format.

## Licence

[AGPL-3.0](LICENSE) © 2026 Sam Moreton.

You're free to use, study, modify, self-host, and redistribute OpenQR under the
AGPL-3.0. If you run a modified version as a network service, the AGPL requires
you to make your source available under the same licence. If that doesn't suit
your use case, a **commercial licence** is available — see [NOTICE](NOTICE).
