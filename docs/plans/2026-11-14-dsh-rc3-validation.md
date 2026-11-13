# 26.11.14-lhg: rc.3 validation and self-use delivery

## Scope and recovery

Base: `davidLi17/DSH-better-sidebar` main `c5cbc2cc40dc2e5f41b3404da8e0a0fc33726e2e` (tree `c9c7118cd4c484c45a542bdd2953188057549c3c`). All 46 available source/declaration blobs from the prior candidate were downloaded through the GitHub blob API and checked using Git object hashes. The five missing client bundles were rebuilt locally; no nonexistent bundle SHA was reused. Version follows the Beijing date, 2026-11-14.

Preserve LHG selected-text drafts, images, compressed inheritance, save/preview behavior and the rc.1 support floor. Carry forward the IME/held-Enter guards, generation-fenced async replies (including A→B→A), shared per-seat pending creation, explicit retry, rc.1/rc.2 menu anchors, and both Team API shapes. An explicit false `isEnabled` never falls back to old membership.

## rc.3 contract review

Official source inspected at `deepseek-ai/deepseek-harness` commit `38a6a5c965aa99ab525161efb7cc5cf1fe62fced` and npm CLI installed as exactly `@deepseek-ai/dsh@0.2.2-rc.3`.

- `sidebar.session.action` is a root-scoped HOC receiving `wide` and the native row as `children`. An occupant must retain children; an empty contribution returns children. Better Sidebar does not occupy this slot or replace the New Session row. The existing browser blank-session test clicks the native New Session button and checks the plugin's fallback entry.
- `workspace.picker` is a root-scoped component Factory with its own `workspace.picker.directoryFlow` child. This is the third directory-flow site alongside the hero and sidebar sites. Better Sidebar does not register any of these sites, so no dependency, occupant or replacement is added. Host directory pickers own all three.
- Team still uses `isEnabled` and the `enabled/tasks` projection in rc.3. The recovered rc.1/rc.2 adapters retain that contract.
- A real browser run exposed a Mermaid zoom toolbar dependency on the host's optional desktop stylesheet: button app-region computed to `none` instead of `no-drag`. The plugin now declares `no-drag` on its own toolbar buttons while retaining the viewport modal reset. The existing computed-style assertion remains unchanged.
- Browser CI is pinned to exact rc.3. Peer floors, dev pins and standalone installer defaults remain rc.1. No workflow permissions or artifact steps changed.

## Validation method

A temporary validation-only workspace override pins every DSH package in the dependency graph to rc.3. The resolved graph contains 46 DSH package names, all exactly `0.2.2-rc.3`. The published workspace configuration and lockfile are restored to the baseline; the override is not shipped. Node 24.22.1, pnpm 11.25.0, Chromium 151 (Playwright 1.62.1), Linux.

The initial run caught a missed version constant and a home-directory write restriction in an existing route fixture. The constant was synchronized and the fixture rerun with the required writable home access, without changing assertions. A rebuild overlapping a test collection temporarily caused built-artifact tests to skip; a stable-artifact run is used for the final result. Earlier rc.1/rc.2 counts remain historical only.

Final checks on the stable candidate:

- Exact rc.3 graph: 239 test files passed; 2902 tests passed, 17 platform-specific tests skipped (2919 total). Typecheck and full lint passed.
- Build, browser-only consumer declarations and package creation passed. 485 packed files audited: 484 byte-identical to source; package.json differs only by pnpm removing packageManager and prepublishOnly. Tarball SHA-256: `2399d7aa4491a5c120eb802f1905022c8c7bc7f5a802a29741ff6be53e526eb7`. The tarball stays local; it is not uploaded.
- Restored rc.1 graph: typecheck, consumer declarations, and 11 focused test files / 208 tests passed. Baseline package/workspace/lock dependency settings remain unchanged.
- Official rc.3 CLI graph: 327 installed DSH packages, all rc.3. Fresh profile package registration and real browser mounting succeeded. The first full browser lane had 12 passes, 3 context-plugin skips, and one Mermaid no-drag failure; that defect was fixed without changing the assertion.
- Aggregate double-mount smoke passed, including the real settings handler and unknown-method 404.
- Search engine check passed for rg; fd is absent and its two checks were skipped.
- Native Windows/macOS Desktop interaction and GitHub CI completion are not claimed. No live model prompts or external paid calls are required by these checks.

Final complete rc.3 browser rerun: **13 passed, 3 skipped, zero failures** (3.4 minutes). The three skipped cases require the separate dsh-context plugin. This includes the unchanged Mermaid app-region assertion, IME/manual-retry interaction, native terminal uniqueness, in-page tab registration replacement, idle polling, and cross-conversation tree/editor/Git-state retention.

## Delivery and rollback

Publish only to this fork using an ordinary fast-forward main update after refreshing its current head. No npm release, tag, upstream push or installer upload. Install the published full commit SHA with the existing host CLI:

```sh
dsh plugin --profile web add 'git+https://github.com/davidLi17/DSH-better-sidebar.git#<published-commit-sha>'
```

Rollback to the previous main:

```sh
dsh plugin --profile web add 'git+https://github.com/davidLi17/DSH-better-sidebar.git#c5cbc2cc40dc2e5f41b3404da8e0a0fc33726e2e'
```

Use the profile in which the plugin is installed; these examples target `web`. Restart that profile after replacing the plugin. Built files are committed, so installation does not require a build step.
