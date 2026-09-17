# Moonveil Module 1 — Windows validation

## Scope and environment

Validation ran on native Windows on 2026-09-17, on `Module-1` starting at `4c92b655ef5ab1b996f344f0298fc880510f6828`. The application is the CodexMonitor-based Tauri/React/Rust client. The obsolete standalone Moonveil Rust/SQLite app was not used.

The installed runtime was `codex-cli 0.154.0-alpha.6.2`. Its own `codex app-server generate-ts --experimental` output was used to verify protocol shapes. The existing normal Codex home and existing account authentication were used; no separate home, copied credentials, global feature changes, ACL changes, or permanent elevation were introduced.

Windows prerequisites included Node/npm, Rust, Visual Studio 2022 C++ tooling, CMake, WebView2, Git, and LLVM/libclang. LLVM 18.1.8 was extracted from the official release outside the repository; its installer was not executed. Cargo, CMake, and LLVM were added only to each validation process's PATH, with process-local LIBCLANG_PATH. Logs, generated protocol schemas, browser tooling, screenshots, marker files, and portable build prerequisites remain outside the repository.

## Build and automated checks

Commands were executed from the repository root unless noted. Windows used `npm.cmd` to avoid PowerShell wrapper ambiguity.

| Exact command | Final result |
| --- | --- |
| `npm.cmd ci` | PASS; 541 packages added, 542 audited. The unchanged dependency graph reports 18 audit findings (3 low, 3 moderate, 11 high, 1 critical); no blanket dependency upgrade was attempted. |
| `npm.cmd run typecheck` | PASS. |
| `npm.cmd run lint` | PASS; 0 errors, 5 existing hook-dependency warnings. The unchanged warning site in useThreadTurnEvents.ts remains present after the Stop changes. |
| `npm.cmd run test` | PASS; 144 files, 1,043 tests, 0 failures, including confirmed/failed/queued Stop, late-event, and unavailable-updater regressions. |
| `npm.cmd run build` | PASS; TypeScript and production Vite build. Vite reports chunk-size/dynamic-import warnings. |
| `npm.cmd run doctor:win` | PASS with the process-local prerequisite paths above. |
| `cargo check --locked` (in `src-tauri`) | PASS. |
| `cargo test --locked` (in `src-tauri`) | PASS; 447 tests: library 235, daemon 183, daemon controller 28, Tauri config 1; 0 failures. |
| `npm.cmd run tauri -- build --debug --no-bundle --config src-tauri/tauri.windows.conf.json` | PASS; native Windows Tauri executable with the production frontend, matching the repository Windows CI command. |

The test coverage includes companion data validation, save-before-navigation and unmount races, native instruction forwarding, protocol-specific response validation, string/numeric IDs, per-request nonce/session isolation, duplicate/stale replies, secret user input, legacy lifecycle cleanup, Windows executable resolution, shared-config preservation, and process/home behavior. Mocks/unit tests support these contracts; the native flow below establishes the separate live result.

A Cargo test invocation while the native executable was running failed because Windows would not replace the locked executable. The application was closed normally before rerunning. Initial missing-libclang and changed-test expectation failures were resolved; they are not counted as passing checks. Rust warnings are retained in the local logs; they are not all asserted to be inherited.

## Genuine native acceptance

The built `src-tauri/target/debug/codex-monitor.exe` was launched as a real Windows desktop process. Its WebView loaded `http://tauri.localhost/`; no browser mock or substitute runtime was used. For inspection only, the launch process supplied:

```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=9227 --remote-debugging-address=127.0.0.1'
Start-Process -FilePath 'E:\Projects and Repos\Moonveil\Testfork\src-tauri\target\debug\codex-monitor.exe' -WorkingDirectory 'E:\Projects and Repos\Moonveil\Testfork' -PassThru
npx.cmd --yes agent-browser --session moonveil-native --cdp 9227 snapshot -i
```

Browser automation attached to that real WebView2. A read-only Tauri event listener counted actual `app-server-event` notifications; it did not inject or replace events. The project was initially added using the existing production `add_workspace` IPC because the native Windows folder picker was outside CDP inspection. All Guild Hall association, conversation creation, prompt entry, approval decisions, and Stop actions used the actual rendered application controls.

| Native check | Observed result |
| --- | --- |
| Product and home | Moonveil window/Guild Hall rendered all five companions with supplied artwork. Dawn/Dusk changed the scene lighting. A final CSS-only rebuild replaced undefined imported colors with existing design tokens; native computed styles confirmed valid card/panel surfaces and muted text, and the saved association persisted again. |
| Default Codex environment | Stock executable discovery, existing authentication, native app-server, conversation, and individually approved commands PASS using the normal user .codex home. Ordinary sandbox shell startup remains BLOCKED by the independently reproduced corrupt Codex state described below; this part is not marked passed. |
| Companion/project/native thread | Selected Sylra, associated the actual Testfork workspace on Module-1, and created a native Codex conversation. The native ID was saved before navigation. |
| Instructions | A prompt asking for the existing name/style, without supplying Sylra's name, returned “I’m Sylra, a calm, decisive engineering companion…” and remembered a test continuity marker. |
| Native text and tool streaming | Observed more than 150 `item/agentMessage/delta` notifications, native item activity, and real `item/commandExecution/outputDelta` events; `MOONVEIL_STREAM_BEGIN` appeared while the command was running. |
| Approve | The actual `item/commandExecution/requestApproval` prompt showed Approve once and Cancel turn. Explicit Approve once wrote exactly `approved-once` to the test marker file. Native `serverRequest/resolved` followed. |
| Reject | A second write request was explicitly rejected using the native available Cancel turn decision. Its turn became interrupted and the denied marker file remained absent. This runtime offered accept/persistent-amendment/cancel, so Moonveil did not fabricate an unavailable decline choice. |
| Interrupt | PASS on the user-authorized fresh attempt: FIRST emitted at 16:25:44.060Z, user Stop at 16:25:46.289Z, native interrupted at 16:25:46.453Z, OS PID 40848 first observed exited at 16:25:46.488Z. The observer matched PID plus process creation time, saw it alive before Stop, and observed no second output/file marker through 16:26:39.119Z (55 seconds). Exactly one command started; no retry/substitute followed interruption. The prior approve-only attempt did not exercise Stop. |
| Terminal | Opened the existing terminal, typed `echo MOONVEIL_TERMINAL_OK`, and observed the real output and returned prompt. |
| Files and diffs | Opened actual MOONVEIL_ARCHITECTURE.md contents from Files. Opened the changed WINDOWS_VALIDATION.md in the native side-by-side diff; additions/removals and source code rendered. Git showed Module-1 and actual working-tree changes. |
| Worktrees | PASS after fixing long paths in Git CLI/libgit2 and separating shared-server process cwd from thread cwd. Created a real clean worktree, restarted Moonveil, connected that worktree first, then resumed the main Sylra thread. Native remove_worktree succeeded while the same stock app-server PID 46816 (matched creation time) remained alive. At 16:52:09.948Z, its directory and stored registration were absent, Git listed only the original Module-1 checkout, and Sylra history remained visible. Removed the merged validation branch; no test worktree remains. |
| Manual executable | Saved the absolute stock codex.exe path through Settings; Run doctor returned Codex looks good, installed version 0.154.0-alpha.6.2, App-server: ok, Node: ok. Restored Use PATH and blank args, then saved. Shared config.toml remained unchanged. |
| Model/reasoning/account | Real account authentication, model options, and rate-limit updates loaded. Changed the model selection to GPT-5.6-Sol and back to GPT-6-Astra, and reasoning between medium and high using the native selectors. The normal account/usage surfaces remained available. |
| Update controls | About reported version 0.3.0 and no configured release feed; Check for updates and the automatic-check toggle were disabled. |
| Shared configuration | Changed the Moonveil theme and restored it through Settings. SHA-256 checks confirmed normal Codex config.toml and AGENTS.md remained byte-for-byte identical to their pre-launch values. |
| Restart/resume | Reopened the built native executable with the same application profile. Sylra, project, and conversation association persisted. Opening the saved conversation restored native history and resumed exactly `01a0afb6-6819-7560-850d-c74aedcfbb92`; a new native response identified Sylra and recalled `amber-lantern-731` without reinjection or a replacement thread. |
| Normal exit | Closed the actual Moonveil window. Its desktop process, owned Codex app-server, and terminal shell exited. Unrelated Codex clients were not terminated. |

Native test thread: `01a0afb6-6819-7560-850d-c74aedcfbb92`. This is the actual Codex ID, not a local replacement ID. The saved association uses `moonveil.guild.v1`; native history/authentication remain Codex-owned.

## Windows sandbox failure diagnosis

The failure is pre-existing corrupt **stock Codex environment state**, independently reproduced without Moonveil. It is not evidence of a Moonveil ACL implementation or custom-home regression.

Using the same installed `codex-cli 0.154.0-alpha.6.2`, the following harmless command was run from both the repository and a neutral Windows temporary directory. Each diagnostic child removed inherited `CODEX_*` variables, kept normal `USERPROFILE`, left `CODEX_HOME` unset, and supplied no configuration overrides:

```powershell
codex.exe sandbox -- C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command "Write-Output moonveil-stock-sandbox-check"
```

Both exited 1 with `windows sandbox failed: helper_unknown_error: apply deny-read ACLs`; neither printed the marker. The runtime helper log identifies the inner error: parsing the default-home `.sandbox/deny_read_acl_state.json` fails with `expected value at line 1 column 1`. The file contains exactly **22 NUL bytes**, not a BOM or recoverable JSON. Its last-write date is 2026-07-24, and the stock sandbox log on that date already records the same parsing failure. The file predates this Moonveil implementation.

The inspected [official state loader](https://github.com/openai/codex/blob/6b9826e3aa83b1a5947db50f4332cb9c65f1b340/codex-rs/windows-sandbox-rs/src/deny_read_state.rs#L38-L46) parses this bookkeeping before applying deny-read ACLs. The current installed alpha binary is not asserted to be built from that published release commit.

Live Moonveil settings were local backend, `codexBin: null`, and `codexArgs: null`; it launched stock `codex.exe app-server`. Moonveil explicitly passes the resolved **default** user `.codex` path, not a custom Moonveil home. The shared config hash was unchanged before/after diagnosis. No ACL commands, state-file reset, alternative home, sandbox weakening, or authentication-copy workaround was applied.

No valid nearby backup was found. Because the bookkeeping contents are destroyed, deleting/replacing them would not be a lossless encoding repair and could discard security-state ownership information. [Official Windows troubleshooting](https://learn.chatgpt.com/docs/windows/windows-sandbox) describes setup recovery, but does not establish a safe repair procedure for this specific corrupt file. Ordinary sandbox execution remains blocked pending supported runtime-state recovery or restoration of a valid backup.

CI run [35235603802](https://github.com/Snickers1993/Testfork/actions/runs/35235603802) passed frontend and Windows checks at `32872f7532df181b6c9b4a247814e488e8c08151`. CI does not resolve this machine-specific live sandbox gate.
## Module 1 result

The implemented native Guild Hall / Sylra / thread / streaming / approve-deny / Stop / restart-resume path passes, including independent process-exit evidence for the 45-second Stop test. The final native worktree creation, long-path Git reads, shared-server reuse, and removal checks also pass. The remaining acceptance blocker is ordinary sandbox shell startup in the pre-existing stock Codex environment; this is not a Moonveil regression and remains unmodified. Overall all-green acceptance is therefore not claimed. No replacement runtime or security workaround was introduced.

## Runtime limits and remaining verification

- On this host, ordinary sandboxed Codex shell startup fails with `helper_unknown_error: apply deny-read ACLs`. Explicitly requested, individually approved harmless commands execute successfully. Moonveil does not bypass that failure, rewrite sandbox policy, or install an ACL workaround.
- Stop delegates current-turn process termination to the official native terminal API. The specified Windows test independently confirmed OS exit and no second marker. This validates the installed-runtime path tested here; it does not infer universal OS-exit guarantees from native acknowledgments alone.
- Native Windows debug/no-bundle Tauri execution is verified. Signed installer/release packaging, fresh interactive login, native folder-picker automation, forced process-crash cleanup, optional remote/mobile backends, and third-party MCP servers were not exercised live.
- MCP elicitation accepts only explicit decline/cancel in Module 1; dynamic tool and unknown request acceptance is intentionally unsupported. Supported rejection paths are visible and protocol-validated.
