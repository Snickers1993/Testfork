# Source provenance

Moonveil is the product layer on `Snickers1993/Testfork`, a fork of `Dimillian/CodexMonitor`. Module 1 uses the supplied CodexMonitor-based source package and preserves the upstream foundation and licensing.

## Authoritative implementation package

- File: `Moonveil-v0.3-Module-1-CodexMonitor.zip`, supplied in the user's Downloads directory.
- SHA-256: `ffbf8e52c4724ba012fafccd9845b47c9c40d08259bb6252cafc84241722f74a`.
- The duplicate `(1).zip` has the same hash.
- The package identifies `Snickers1993/Testfork` and CodexMonitor foundation `dd61b9abd37de5ded86e82b9fe8a83fd49d46fa5`.
- The package contains 1,794 files under one root. Its directory paths were checked before overlay; no `.git`, dependency/build caches, traversal paths, or symbolic-link entries were imported.

The separate `Moonveil-v0.3-M1` standalone Rust/SQLite application is not the implementation foundation. Legacy Moonvale contributes only the supplied visual assets and retained source notices described below.

## Source and reference ledger

| Source | Pin / verification scope | License status | Material and destination | Treatment |
| --- | --- | --- | --- | --- |
| `Dimillian/CodexMonitor` | Foundation `dd61b9abd37de5ded86e82b9fe8a83fd49d46fa5` | MIT | Application foundation at repository root: UI, Tauri host, daemon, shared cores and existing native Codex workflows | Forked foundation; upstream root `LICENSE` retained |
| Installed official Codex runtime | `codex-cli 0.154.0-alpha.6.2`; TypeScript schemas generated from the installed executable | Official Codex runtime distribution | Native thread instructions, request IDs, approvals, permissions, elicitation, user input and dynamic-tool request contracts | Protocol authority; no published source commit for this installed alpha binary was established |
| `openai/codex` published release | Annotated tag `rust-v0.154.0`: tag object `36eab01061df3cde5f95ec20a526777b430091ba`, peeled commit `6b9826e3aa83b1a5947db50f4332cb9c65f1b340` | Apache-2.0 | Official app-server semantics; `codex-cli/bin/codex.js` native npm layout; `codex-rs/utils/home-dir/src/lib.rs` home convention | Inspected reference; the release commit is not asserted to identify the installed alpha binary; no meaningful donor source copied |
| `tamas-hub/tamagrid` | Verified snapshot `762ca40426e01b434c868acb910e741c1d0710ff`; `manager.rs` / `transport.rs` inspected | MIT verified | Windows executable, process and security patterns | Reference only; no source copied |
| `rita152/Echora` | Source package records `74970ac3e8003b917d605db25922acd9ac7227cb`; not re-verified live in this completion pass | Reuse license not established by the package audit | Conversation/approval UX reference | Reference only; no code copied |
| `berylorg/beryl` | Source package records `d3e56d4e78dc934e24e5ab596e30e857f6797094`; not re-verified live in this completion pass | Apache-2.0 recorded by the package audit | Separation of product identity from agent/runtime ownership | Conceptual reference only; no code copied |
| Supplied `Moonvale-v0.2.1.zip` | Source package records SHA-256 `44a4c91d390b021e3f8c7f2f7275c1770863031dee8dff3060b4d0a88bc9f8d4` | MIT notice retained from supplied archive | Guild Hall, five portraits, emblem and art source under `public/moonveil/*` and `assets/moonvale/*` | Supplied artwork reused with license/notices retained; no legacy runtime copied |

The current official [Codex app-server documentation](https://learn.chatgpt.com/docs/app-server) is a reference alongside executable-generated schemas. Installed-runtime evidence and Windows acceptance results are recorded in [WINDOWS_VALIDATION.md](WINDOWS_VALIDATION.md); source inspection does not establish live acceptance.

## Included Moonvale artwork and notices

The application directly uses `guild-hall.svg`, `elaria.svg`, `sylra.svg`, `lyra.svg`, `rowan.svg`, `noctis.svg`, and `moonvale-emblem.svg`. The supplied `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `web/art.js` are retained under `assets/moonvale/`.

No Moonvale Python server, scheduler, runtime, authentication system, or sandbox implementation is part of the production application. Module 1 additions extend the CodexMonitor tree; the donor references above are not wholesale subsystem imports.
