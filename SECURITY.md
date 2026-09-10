# Security policy

## Supported

The latest commit on `main` and the version published at [openqr.uk](https://openqr.uk).

OpenQR's generator is fully client-side: QR content is encoded in your browser and
never transmitted. The only optional outbound calls are in the Location tool (map
tiles from CARTO and address lookups via OpenStreetMap Nominatim) — see the
[Privacy](README.md#privacy) section of the README.

## Reporting a vulnerability

Please **do not open a public issue** for anything you believe is a security
vulnerability.

Email **security@openqr.uk** with:

- what you found and the impact,
- the repo, commit, or URL affected,
- steps or a proof of concept to reproduce.

We aim to acknowledge reports within a few days and will keep you informed of
progress. Responsible disclosure is appreciated; we're happy to credit you in the
fix release notes if you'd like.

## Self-hosters

If you self-host OpenQR, vulnerabilities in *your* deployment (headers, hosting
configuration, upstream services you add) are outside this policy — but if the
issue is in this codebase, we want to hear from you the same way.
