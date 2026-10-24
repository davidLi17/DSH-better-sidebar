# LHG selective maintenance, 2026-10-24

## Scope and provenance

Baseline: davidLi17/DSH-better-sidebar main `51a1a1c227252ddd8b6085c0e27ceab36101c65c`. Version: `0.28.1-lhg.3`, retaining DSH `0.2.1-rc.1` baseline and unchanged dependency/lockfile policy.

- Upstream PR [#1044](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1044), commits `909f536` and `6f14792baaa905842c0b1633b79a4b49c29bae4e`, merged into upstream dev as `090a5488cfbf3876673f4807978370aac9c37578`. Selectively port local Markdown image rendering, present delivery cards (including reviewed failure/event-order/accessibility behavior), and stable Markdown labels/streaming parsing. This is not an upstream main/release upgrade.
- Upstream PR [#1041](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1041): only the travelRef reset-before-node-guard hunk from `787d873a8ca27c099bff4f19e770de07bf8ba5d3`, and pointer batching from `dc385130a0d2cf9a7c839009fa6a95d3e0ffec25`. No new branch-folding preferences, task-model rewrite or layout algorithm changes.
- Local review correction: resolve delivered-file clicks against current `scope.cwd` before invoking `openSidebarFile`, rather than accidentally using the session-header cwd. A regression deliberately separates `/p` header cwd from `/current-worktree` current cwd and checks tooltip, thumbnail and click agree.

## Preserved customizations

Native image selection/paste, image-only initial/follow-up prompts, attachment history rendering, selected-text append into the same side-chat draft (existing text/images retained, focus at end, no autosend), and PR #1035 model-switch compacted inheritance all remain. No whole-file replacement of SideChatView or transcript parser. No DSH host source edits.

## Build and distribution

Prebuilt lib JavaScript and declaration files remain committed for Git installs. No prepare/preinstall/install/postinstall script was added. Existing MIT license retained. Source changes in shared Markdown labels also require editor and Mermaid chunk changes. CSS module hashes depend on the checkout path and object-key order is nondeterministic; generated output is kept from the actual validated build, not mixed with older artifacts to reduce diffs.

## Validation

Results are recorded from this fork checkout, not inferred from upstream CI.

- Red-to-green: 29 failing rendering/parsing cases became green (5 suites, 86 tests); four pointer/card regressions failed before the patch, then related 4 suites/75 tests passed. Added current-cwd click regression failed before its local correction, then all 4 delivery-card tests passed.
- Fresh frozen-lockfile install passed under default pnpm supply-chain checks. Only cache/data/HOME locations were redirected into writable scratch directories. No ignore-scripts, weakened script allowlist or registry bypass.
- Final typecheck, ESLint, build, pnpm pack and browser-only consumer declaration checks passed. Source-map content verified against 346 current source entries; 229 installed JS/declaration files exactly matched the validated build. Final full suite: 227 files passed, 2747 tests passed and 17 skipped (2764 total).
- Official DSH CLI 0.2.1-rc.1 installed the final tarball into a brand-new scratch profile using default script/supply-chain policy; bundle registration succeeded and `dsh web --port 0` reached its ready URL. The installed manifest has no install-time lifecycle scripts. Tarball SHA-256: `32f0eb948035585b4ddf948efdf24b871b982fbeccedc54925fb5d09c07301f2`.
- Mount UI lane did not pass: the sole final mount scenario failed before browser execution because the downloaded browser executable was unavailable. System Chromium was separately attempted and blocked as described below. Host startup/install success is not a substitute for UI validation.
- Engine check passed its assertions for available rg; optional fd checks were skipped because fd is absent. Native Windows execution was not performed.
- Browser limitation: official Chromium archive download failed (invalid/truncated ZIP); installed system Chromium with sandbox enabled failed at socket() with EPERM. No sandbox disabling or security workaround used. Therefore real browser UI behavior is not verified.
