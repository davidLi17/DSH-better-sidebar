> Historical candidate record. Superseded for delivery by [26.11.14-lhg rc.3 validation](2026-11-14-dsh-rc3-validation.md); its old publication gate and blocked-browser status do not describe the new environment.

# 26.11.13-lhg validation candidate (not released)

Reconstructed from remote main `c5cbc2cc40dc2e5f41b3404da8e0a0fc33726e2e`. This candidate is for branch/PR validation only. Historical test counts, browser observations, and hashes are not evidence for this reconstruction.

## Final behavior

- Functionally absorb upstream `bed56758c7c9d7aefb3023cc0efce6c1d93e7b46` IME/Enter-repeat protections without its full side-chat redesign or Git ancestry. Preserve the LHG draft bridge, images, and explicit retry behavior.
- Fence binding-scoped async continuation and error paths, including model/dequeue refreshes, sends, creation, save/open, archive/rebind, image admission, and debounced invalidations. Preserve drafts and reset only transient state.
- Share in-flight creation promises by JSON `[sessionId, tabId]` keys. Identity-checked cleanup supports StrictMode and A→B→A without duplicate creation. Failed creation stays locked for the component lifetime until explicit Retry; list updates and hide/show do not retry it.
- Compare the remembered-thread snapshot captured by the original request before updating session recall. A still-current seat retains its own child even when another seat changed the session's remembered choice. Suppress the creation-result remember effect so a late result cannot overwrite that newer choice. Pending shared requests are not evicted.
- Share four menu anchors through a helper returning rc.1 `getAnchorRect` and rc.2 `anchorPoint`. Each host Menu consumes its known prop without forwarding unknown props to the DOM. Preserve the original anchor spans, portal, and items.
- Synchronize the package, registry manifest, service, and current-version documentation to `26.11.12-lhg`. Peer floors, dev dependencies, lockfile, and installers are unchanged. The browser CI lane now pins the exact rc.2 host.

## Fresh validation

Independent read-only review found no further P2 blocker. The final normal matrix ran sequentially and exited 0: typecheck, full lint, full Vitest (`--maxWorkers=2`), build, consumer types, search-engine checks, and pack.

- Vitest: **237 files passed; 2889 tests passed, 17 skipped (2906 total); 124.55s**. The skipped platform-specific cases are not Windows runtime evidence.
- Regression coverage includes IME/repeated Enter, stale asynchronous bindings, StrictMode, A→B→A before and after creation settles, failure/list-update/hide-show/manual retry, concurrent seats, and late completion after a newer choice.
- Engine checks passed the real `rg` assertions; `fd` was unavailable and explicitly skipped. The consumer checker passed the plugin declaration surface while filtering its documented pre-existing upstream declaration noise.
- Tooling: Node `24.22.1`, pnpm `11.25.0` (the manifest declares pnpm `11.8.0`). Frozen installation preserved the lockfile and dependency policies. Evidence: `sidebar-resume-{typecheck,lint,full,build,consumer,engines,pack}.log` and matching exit-code files.

Packed artifact: `dsh-better-sidebar-26.11.12-lhg.tgz`, SHA256 `571a4d9603e4ce5c010954102c87a541d0253037e66bfd30e8a2db8de49eafd8`. All 485 regular files were audited: 484 are byte-identical to the workspace, including generated bundles and declarations; `package.json` differs only by standard pnpm normalization (removal of `packageManager` and `prepublishOnly`, formatting, and key order). Other manifest fields match exactly. The generated `menu-point-anchor.d.ts` is included.

## Remaining release gates

- Exact rc.2 dependency-graph validation and fresh real rc.2 host/browser interaction checks are pending.
- The existing GitHub CI must run on the candidate commit; its mount lane now pins rc.2; local browser execution is blocked by socket EPERM and is not counted as a pass.
- macOS and Windows Desktop interaction validation has not run. Linux unit tests and future Windows CI do not establish Desktop UI behavior.
- No main update, tag, npm publication, upstream publication, or installer upload is part of this candidate PR. Publication remains gated on the outstanding validation.

## Recovery verification, 2026-11-12

- The exact rc.2 installed graph independently audits 47 host packages and 79 third-party pins. Its source manifest is restored to the actual candidate manifest only during direct Node test invocation; the graph installation manifest and lock remain separately recorded. This verifies runtime compatibility without changing the package's rc.1 support floor.
- Fresh graph failures identified test-only assumptions: jsdom lacked ResizeObserver, rc.2 portals child menus rather than nesting them, and Escape dismisses a child panel before its parent. Fixtures now cover both host shapes, assert unambiguous child actions, and fully dismiss the menu before reopening. No runtime failure is silently reclassified as passed.
- Normal CLI installation hashes match all 485 Sidebar package files and 51 LHG files; the official rc.2 host starts successfully. Browser execution remains blocked in this environment. No macOS/Windows Desktop interaction claim is made.
- This remains an unpublished candidate until the exact candidate CI and browser checks finish successfully. No tag, npm publication, or installer upload is requested.

## 2026-11-13 recovery and Team compatibility

The Nov 12 source/test Git blobs were recovered and checked by Git SHA after the local candidate workspace was replaced. Generated bundles are rebuilt for 26.11.13-lhg; earlier local test counts are historical evidence, not a fresh pass.

Published package types and official host tags confirm rc.1 uses `tryMembership` plus a durable `members` roster, while rc.2 uses `isEnabled` plus `enabled/tasks` and the direct-child catalog. The candidate preserves both shapes. A disabled rc.2 tree cannot fall back to rc.1 membership, and the empty Lead task owner path maps to the root.

The existing browser CI lane pins rc.2. Local browser execution was previously blocked by socket restrictions; no Desktop UI pass is claimed. The candidate must remain off main until exact-commit validation is complete.

### Fresh final checks on 26.11.13-lhg

- rc.1 baseline: 239 test files passed, 2902 tests passed, 17 platform cases skipped. Typecheck, full lint, build, consumer declarations and pack passed.
- Exact rc.2 installed graph: 46 DSH package names contain only rc.2 versions; typecheck and the same 239 files / 2902 tests passed, 17 skipped. The candidate source and built files are shared byte-for-byte with the baseline.
- The first restored-environment run had a non-normalized HOME value and the isolated graph lacked Git history; the test environments were corrected without changing production code or weakening assertions. The final reruns above are the release evidence.
- The package audit matched every regular file to the workspace, except standard pnpm package.json normalization. No installer was uploaded.
- Remote CI and browser validation remain pending; main is unchanged.
