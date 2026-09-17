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
| Installed official Codex runtime | `codex-cli 0.154.0-alpha.6.2`; TypeScript schemas generated from the installed executable | Official Codex runtime distribution | Native thread instructions, request IDs, approvals, permissions, elicitation, user input, dynamic tools, turn interruption and background-terminal list/terminate contracts | Protocol authority; no published source commit for this installed alpha binary was established |
| `openai/codex` published release | Annotated tag `rust-v0.154.0`: tag object `36eab01061df3cde5f95ec20a526777b430091ba`, peeled commit `6b9826e3aa83b1a5947db50f4332cb9c65f1b340` | Apache-2.0 | Official app-server semantics; `codex-cli/bin/codex.js` native npm layout; `codex-rs/utils/home-dir/src/lib.rs` home convention; turn-abort, command-item events, background-terminal ownership and Windows termination semantics informing `shared/turn_stop.rs` | Inspected reference; the release commit is not asserted to identify the installed alpha binary; no meaningful donor source copied |
| `rust-lang/git2-rs` installed crates | `git2 0.20.3`, package VCS `7cf345c4f7967b7da3c728db6766362e51540cbe`; `libgit2-sys 0.18.3+1.9.2`, package VCS `591952f8cf344b2676db16b4f67c68875713f2e8` | `MIT OR Apache-2.0`, verified in each installed Cargo manifest and license files | Rust repository/config APIs informing `shared/git_core.rs` and the `git_ui_core/diff.rs` read wrapper | Existing dependencies; reference-only source inspection for this change, no binding source copied into Moonveil |
| `libgit2/libgit2` vendored library | Version `1.9.2` verified in the installed sys crate's `libgit2/include/git2/version.h`; no separate upstream commit asserted | GPL version 2 with the linking exception in the vendored `COPYING` | Per-repository config ownership, app-level precedence, config caching and Windows long-path checks | Existing vendored dependency; reference-only source inspection for this change, no C implementation copied into Moonveil |
| `tamas-hub/tamagrid` | Verified snapshot `762ca40426e01b434c868acb910e741c1d0710ff`; `manager.rs` / `transport.rs` inspected | MIT verified | Windows executable, process and security patterns | Reference only; no source copied |
| `rita152/Echora` | Source package records `74970ac3e8003b917d605db25922acd9ac7227cb`; not re-verified live in this completion pass | Reuse license not established by the package audit | Conversation/approval UX reference | Reference only; no code copied |
| `berylorg/beryl` | Source package records `d3e56d4e78dc934e24e5ab596e30e857f6797094`; not re-verified live in this completion pass | Apache-2.0 recorded by the package audit | Separation of product identity from agent/runtime ownership | Conceptual reference only; no code copied |
| Supplied `Moonvale-v0.2.1.zip` | Source package records SHA-256 `44a4c91d390b021e3f8c7f2f7275c1770863031dee8dff3060b4d0a88bc9f8d4` | MIT notice retained from supplied archive | Guild Hall, five portraits, emblem and art source under `public/moonveil/*` and `assets/moonvale/*` | Supplied artwork reused with license/notices retained; no legacy runtime copied |

The current official [Codex app-server documentation](https://learn.chatgpt.com/docs/app-server) is a reference alongside executable-generated schemas. Installed-runtime evidence and Windows acceptance results are recorded in [WINDOWS_VALIDATION.md](WINDOWS_VALIDATION.md); source inspection does not establish live acceptance.

## Native Stop reference review

The installed runtime generated `TurnInterruptResponse`, `ThreadBackgroundTerminal`, and the background-terminal list/terminate parameter and response schemas. These establish the available wire shapes, including pagination, native item/process IDs and the `terminated` boolean. They do not establish an OS-process-exit guarantee.

At the release commit above, the implementation review covered `app-server/src/request_processors/{turn_processor,thread_processor}.rs`, `core/src/tasks/mod.rs`, `core/src/unified_exec/{process_manager,process,async_watcher}.rs`, `core/src/tools/events.rs`, and `utils/pty/src/{process,pipe,win/job}.rs`, all beneath `codex-rs`. These are reference-only inputs to Moonveil's shared Stop orchestration; no donor implementation was copied.

The [native process manager](https://github.com/openai/codex/blob/6b9826e3aa83b1a5947db50f4332cb9c65f1b340/codex-rs/core/src/unified_exec/process_manager.rs) retains background processes separately from the turn. The [local termination helper](https://github.com/openai/codex/blob/6b9826e3aa83b1a5947db50f4332cb9c65f1b340/codex-rs/utils/pty/src/process.rs) requests a kill and stops I/O without independently waiting for OS exit. Moonveil therefore distinguishes native protocol acknowledgment from independent OS-exit evidence. The specified strict Windows process/second-marker test passed; see WINDOWS_VALIDATION.md for its scope. The published source is not asserted to be the installed alpha binary's exact implementation.

## Windows Git long-path reference review

Versions, repository URLs and package VCS revisions above were read from the installed Cargo source manifests and `.cargo_vcs_info.json`; the locked dependency versions were unchanged. Inspected binding files were `git2-0.20.3/src/{config,repo,lib}.rs`. Inspected vendored files were `libgit2-sys-0.18.3+1.9.2/libgit2/src/libgit2/{repository,config,config_cache,path}.c`. They establish that `Repository::config` accesses the handle's existing configuration, an app-level file adds a higher-priority reader without replacing lower layers, and `core.longpaths` changes the Windows path-length check. The implementation attaches the overlay immediately after opening a fresh handle because adding a backend does not itself clear an already populated config-value cache. This audit used installed dependency source, not an assumed current upstream branch.

## Included Moonvale artwork and notices

The application directly uses `guild-hall.svg`, `elaria.svg`, `sylra.svg`, `lyra.svg`, `rowan.svg`, `noctis.svg`, and `moonvale-emblem.svg`. The supplied `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `web/art.js` are retained under `assets/moonvale/`.

No Moonvale Python server, scheduler, runtime, authentication system, or sandbox implementation is part of the production application. Module 1 additions extend the CodexMonitor tree; the donor references above are not wholesale subsystem imports.
