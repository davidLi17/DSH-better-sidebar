# LHG terminal surface maintenance — 2026-11-04

Base main: `3f4d60d55f981fbbc077adc268c70d102911f146`.
Version: `26.11.4-lhg`. Upstream main remains `2d736f5496fe97f4bba6af37d99861649b9ef3c0`.

## Scope and provenance

Selectively absorb **unmerged upstream PR #1104**, head `b9ae0024afeef78b625c8069ee9fad48f281b776`: https://github.com/omdsh-dev/DSH-better-sidebar/pull/1104 . This is an equivalent backport, not an upstream stable release or ancestry merge.

Only the bottom terminal background rules change: preserve xterm-owned viewport classes with `:global()`, use the scoped three-class selector to outrank xterm's later two-class black background rule, and leave the screen container transparent. No terminal input, session, permission, dependency or workflow changes. Preserve LHG selected-text handoff, Side Chat drafts/images and existing native sidebar behavior. The unrelated `.screen .xterm` height selector is unchanged.

Defer open PR #1108 (`5c65dd6bf49969983d83ddc612834c8dbe568b4c`): its title change reads the registry during render, but its tests cover only initial render and the chip has no registry subscription. A dynamic rename guarantee requires separate validation rather than expanding this maintenance fix. PR #1110's broader geometry change is also not imported.

## Verification

- Fresh frozen-lockfile dependency installation passed existing supply-chain policies: Node 24.22.1, pnpm 11.25.0. No policy relaxation, dependency resolution change or installation script override.
- One regression added to existing `tests/theme.spec.ts`, compiling the actual stylesheet with Lightning CSS: the old source fails; the fixed source passes. It checks global xterm names, scoped three-class selector and transparent screen/viewport, without `!important`.
- Typecheck, ESLint, build and consumer declaration checks passed. The final compiled terminal bundle contains `.zMekrq_screen .xterm .xterm-viewport{background:0 0}`. CSS-module hashes also change because the build uses a fresh checkout path; generated class maps and selectors remain paired.
- Final focused checks: theme, terminal and Git blame, **53 tests passed**. Final full suite: **235 files, 2847 tests passed, 17 existing conditional skips**, no failures.
- An initial full run had one test-environment failure: a command-level Git identity overrode a fixture's local author. Removing that override and using an isolated writable HOME fixed it; the entire suite was rerun. No assertion was weakened and no additional test was skipped.
- `npm pack`: 483 files. Official DSH CLI `0.2.1-rc.5` installed the tarball into a fresh isolated Web profile using normal pnpm 11.25.0 policy, with no release-age exemptions or script overrides. Installed package metadata, client bundles and Cordis patch are byte-identical. No user profile was touched; no tarball was uploaded.
- Local Chromium launch failed with Unix socket EPERM both normally and after one approved escalation; no local browser or Desktop GUI assertion ran. Candidate-commit CI and its configured rc.1 real-host browser mount remain the publication gate. No workflow changes.
