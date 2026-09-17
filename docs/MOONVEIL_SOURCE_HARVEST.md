# Moonveil Module 1 — source harvest

CodexMonitor is the application foundation. Moonveil extends its productive workflow rather than replacing whole subsystems. Provenance and verification scope are recorded in [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md).

| Subsystem | Source/reference | Final decision | Treatment |
| --- | --- | --- | --- |
| Desktop shell, app/daemon split, typed IPC | CodexMonitor | Preserve the Tauri/React/Rust architecture and shared backend cores; apply Moonveil product identity. | KEEP / EXTEND |
| Projects, sidebar, native threads | CodexMonitor | Use existing connection, thread/start, selection and resume paths; retain native IDs and native context. | KEEP / EXTEND |
| Guild Hall and portraits | Supplied Moonvale artwork | Use Guild Hall, five portraits and emblem with retained notices. | EXTEND |
| Companion identity/preferences | Moonveil implementation; Beryl conceptual reference | Persist stable metadata and multiple project/conversation associations; keep runtime ownership with Codex. | EXTEND |
| Companion instructions | Installed official Codex `ThreadStartParams` | Pass companion instructions once as native `thread/start.developerInstructions`; leave normal starts and existing-thread resumes unmodified. | MODERNIZE |
| Guild persistence | Existing `moonveil.guild.v1` local storage | Validate known data; save association before navigation; report failed saves and preserve actual created thread IDs. | EXTEND |
| Streaming/reasoning/tools, interruption | CodexMonitor event and conversation infrastructure | Preserve existing runtime/renderer; keep completed/interrupted turns idle when native output arrives late. No second executor or per-turn personality injection. | KEEP / EXTEND |
| Server requests and approvals | Installed Codex schemas and official protocol | Validate method-specific responses in the host, preserve typed IDs/workspace ownership, consume once before writing, invalidate stale requests, and show explicit decisions. | MODERNIZE |
| Persistent approval shortcuts | Inherited client prefix/keyboard paths | Remove automatic approval behavior and persistent/session permission amendments from Module 1 controls. | REMOVE |
| MCP elicitation and dynamic tool calls | Installed Codex schemas | Keep genuine requests visible; MCP decline/cancel and dynamic-tool rejection only. Specialized acceptance/execution is not implemented. | FEATURE-GATE |
| Unknown server requests | Official JSON-RPC failure semantics | Explicit unsupported rejection; no fabricated success, guessed permission grant, or automatic replay. | MODERNIZE |
| Codex home/authentication | Official Windows home convention and CodexMonitor account flow | Use normal effective Codex home; do not apply legacy per-project custom homes or create a Moonveil credential store. | KEEP / MODERNIZE |
| Settings/configuration | Existing app settings and shared-config commands | Moonveil saves remain local; shared Codex edits/feature toggles are explicit and disclosed; communication style goes to new native threads. | MODERNIZE |
| Windows Codex discovery | Official npm launcher layout; TamaGrid review | Resolve and launch native executable directly; use npm wrapper location only; reject shell/script execution for Codex. | MODERNIZE |
| Native lifecycle | CodexMonitor process supervision | Clean failed initialization and owned local app-server trees on normal exit; retain explicit remote-daemon lifecycle setting. | EXTEND |
| Terminal/files/diffs/Git/worktrees/models | CodexMonitor | Keep existing useful surfaces and operational terminology. | KEEP |
| Remote/mobile/dictation | CodexMonitor | Retain existing code and settings; not prerequisites for the Guild Hall path. | KEEP / FEATURE-GATE |
| Updater and telemetry | CodexMonitor inherited integration | Disable upstream product update feed and inherited Sentry DSN; telemetry requires explicit builder DSN. | DISABLE-BY-DEFAULT |
| Recovery and reference snapshot workflows | Temporary reconstruction artifacts | Remove recovery-local-state/reference-snapshot workflows and offline node_modules packaging; retain permanent Module-1 frontend/Windows validation CI. | REMOVE / KEEP |
| TamaGrid | Verified MIT snapshot | Compare executable/process behavior; no donor source copied. | REFERENCE |
| Beryl and Echora | Source-package recorded snapshots | Preserve architectural/UX reference provenance; no new source import or live re-verification claim. | REFERENCE |

Implementation detail lives in [MOONVEIL_ARCHITECTURE.md](MOONVEIL_ARCHITECTURE.md). The installed runtime and generated schemas control protocol semantics. Build/test automation verifies only the checks it runs; actual Windows desktop and live Codex acceptance remain separately recorded in [WINDOWS_VALIDATION.md](WINDOWS_VALIDATION.md).
