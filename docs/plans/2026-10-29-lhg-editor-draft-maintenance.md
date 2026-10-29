# LHG editor draft protection (2026-10-29)

## Source and selection

- Fork base: `215f487d4570a03a881591d9bc17a7f417c43b03` (`0.28.2-lhg.1`). Result version: `0.28.2-lhg.2`.
- Upstream main remains `b0e0fab50e68f54b07a1fc1e7898030409c7d979` (`0.28.2`).
- Selectively adapted [upstream PR #1083](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1083), head `ae71cd05e649ce8200651ffb362910a61bcc67f1`. The PR is **open and unmerged**, targeting `dev`; this is an independently tested fork fix, not an upstream release or Git ancestry merge. MIT license retained.
- Reused its four regression scenarios and translated confirmation text. Kept the fork's existing refresh logic and `openSidebarFile` call; did not adopt the PR's unrelated temporary-directory retry adjustment or newer dev cwd interfaces.

## Behavior

Merged editor mode previously replaced the current file path without checking its unsaved draft. It now consults the existing session-scoped dirty registry before replacement. Cancel keeps the file and its mounted draft; confirm permits the switch. Reopening the same path, opening a file handled by another native tab type, and separate-tab mode retain their behavior. Without a confirmation API, the destructive switch is refused, matching existing refresh behavior.

No side-chat implementation changed: LHG selected-text append, existing draft/images, focus without auto-send, attachment input, history, and all host permissions remain unchanged. No dependencies, lockfile, workflows, or supply-chain settings changed.

## Other evaluated changes

- Upstream #1079 (`0659016aee7217beacd56833109e675ba7707578`) fixes `address-base.ts` in newer dev. That file and affected resolver do not exist in this fork; do not import the new path layer merely to fix its regression.
- #1077 (0.29.0 / GenUI) is still an open release PR. No mechanical dev synchronization.
- Computer-use #3 (`fe7d8a09323990a52f11cdbc55f68ccaca72042a`) changes native Windows UIA collection; deferred pending appropriate Windows verification.
- BTW #22 (`62ee5dc4412bacd323827777f1cdb9a455ae7010`) overlaps existing LHG independent tool-enabled side questions; no adoption.

## Validation

- Clean current-main checkout, frozen-lockfile install, Node 24.22.1 / pnpm 11.25.0. Writable isolated HOME/XDG used; no dependency or policy edits.
- Red/green: new switch-confirmation test failed on original code (zero confirmation calls), passed with the fix.
- **83 tests passed, 0 skipped** across 8 focused files: editor-host (21), locales, market-manifest, manifest-consistency, editor-unsaved-guard, editor-refresh, sidechat-draft-bridge, sidechat-image-input.
- Typecheck, ESLint on changed TypeScript/TSX, build, pack, and `git diff --check` passed.
- Tarball: `dsh-better-sidebar-0.28.2-lhg.2.tgz`, SHA-256 `2f84126a4875ed1c9f7ce9d40c706fcdff77749279ec4e7ec04606657294f507`. All 473 packaged src/lib files match the checkout byte-for-byte. DSH host/client entries, patch and license present; no install lifecycle scripts. Archive kept locally, not committed/uploaded.
- Generated bundle churn outside the small logic/text changes comes from the clean checkout's absolute-path CSS identifiers and normal object-key ordering; no CSS source changed.
- Full suite, real browser/Desktop and fresh profile installation were not repeated for this localized UI fix. Existing prebuilt Git-source installation remains the delivery route.
- Remote main was still the expected base at preparation time. No open fork PRs and no Actions runs were present; no CI-pass claim. Publication coordinated separately.

## Update source

Use `https://github.com/davidLi17/DSH-better-sidebar.git#main` in the existing DSH plugin install/update UI. Built outputs are included; no local build step or npm publication is needed.
