# Moonvale 0.2 — provenance and notices

## Original source and artwork

The Moonvale application, original vector guild scene, five character designs, UI icons, and synthesized ambient sound were created for this project. v0.2 revises those assets with layered materials, fur, feathers, armor, glass, scenery and lighting. No downloaded character pack, font file, music recording, analytics script, or remotely hosted UI asset is included.

`web/art.js` is the live art source. `web/assets/` contains seven standalone SVG exports and an offline artbook generated from that same module. OS fonts are used but not redistributed. Newly created application code and vector art are MIT-licensed.

## User-provided original plan

`docs/ORIGINAL_PLAN.md` is the supplied Fantasy Agent Guild plan. Its inclusion for provenance does not assert ownership of that supplied text or change its existing rights. `docs/history/` contains outdated v0.1 implementation documents, not v0.2 instructions.

## Codex

Codex itself is **not bundled**. The installation helper asks before retrieving the official OpenAI Windows installer from its documented source. The locally installed official executable has its own license and terms. This app does not redistribute a Codex binary, scrape ChatGPT, or collect a password.

OpenAI, ChatGPT, Codex, Python, Windows, and related marks belong to their respective owners. Moonvale is an independent personal application, not an official OpenAI or Microsoft product.

## Timezone data

Two compiled public-domain IANA timezone files are retained from the v0.1 package: `tzdata/America/Denver` and `tzdata/UTC`. They are timezone rules, not executable code or fonts. The [IANA database](https://www.iana.org/time-zones) is the source. The application prefers system data when available; bundled rules are not automatically updated.

## Test tooling

Python/SQLite, Chromium, Playwright and Node were used for development or verification. None of those runtimes is bundled. The app requires Python 3.11+ and, for actual subscription execution, the official Codex CLI. It requires no pip/npm package at runtime. Optional browser tests require their own test dependencies.

The Codex test subprocess is a synthetic protocol fixture written for this project, labelled as such, and excluded from the production execution path. No real OAuth credentials, account data, model output, or native-sandbox certificate is embedded in the fixture results.
