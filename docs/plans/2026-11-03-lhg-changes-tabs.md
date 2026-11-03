# LHG Changes lens styling maintenance — 2026-11-03

Base: davidLi17/DSH-better-sidebar main `da10ae54901d6db4ce61d21537e3f79803fcac5f`.
Version: `26.11.3-lhg`. Upstream main remains `2d736f5496fe97f4bba6af37d99861649b9ef3c0`.

## Provenance and scope

Selectively absorb **unmerged upstream PR #1097**, head `c5f635d94a8da21f6f43bddf3a00dcde718f8f59`: https://github.com/omdsh-dev/DSH-better-sidebar/pull/1097 . This is a functional backport, not a Git ancestor relationship or an upstream stable release.

ChangesTab and its stylesheet used the host's private `wSkVaW_tabs/tab/tabActive` CSS hashes. Host upgrades can change those hashes, leaving the Git / session-files switcher unstyled. Replace only those selectors with plugin-owned styles and existing host theme tokens. Preserve ARIA selected state, keyboard Left/Right/Home/End navigation, focus, persisted lens, refresh and mounted panel behavior. Adapt the existing regression test, without adding another test file or suite.

The competing unmerged PR #1101 (`3ce803c6911dcb7c66e64d31865f52cee27debd6`) uses a new host SegmentedControl import. The selected #1097 approach avoids adding a runtime export dependency and retains the existing UI behavior.

PR #1099 (`96011827208ed76ef440a5223b572558462b9d22`, unmerged) adds image selection/paste and history. The fork already implements those capabilities through native attachments. Its wider new route/draft/admission redesign is not imported; existing LHG selected-text append, retained draft images, last-position focus, no-auto-send and image first/follow-up/history paths are unchanged. No dependency, host, permission, access-policy, workflow or npm publication change. MIT attribution retained.

## Verification

- Fresh frozen lockfile installation passed existing pnpm supply-chain verification. Node 24.22.1 / pnpm 11.25.0. No policy or script relaxation.
- Typecheck, ESLint, full build and consumer declaration checks passed.
- All seven theme tokens in the updated header were found in the actual official DSH 0.2.1-rc.5 host packages.
- Changes tabs / theme / image-input focused regressions: 3 files, 50 tests passed.
- Full suite: **235 files passed, 2846 tests passed, 17 existing conditional skips**, no failures. Additional LHG draft/image routes/history/decoration regressions: **4 files, 83 tests passed**. Tests use pinned rc.1 development packages; independent install uses official rc.5.
- Strict official rc.5 tarball installation passed in a fresh profile, with no release-age exemptions, script overrides or changes to user profiles.
- Local browser launch remains blocked by Unix socket EPERM even after approved escalation. No UI assertions ran successfully locally. Existing cloud CI is the browser verification gate; it uses its configured rc.1 host, not rc.5.
- The initial diagnostic full suite caught an unsynchronized service version (corrected), a shallow clone missing required Git history (full history fetched), and a non-writable HOME fixture (rerun in isolated writable HOME). No assertions were weakened or tests skipped to hide these failures.
- Playwright's pinned Chromium download returned a corrupt ZIP. The attempted independent browser run used system Chromium 155.0.8059.79, with the existing test assertions and a temporary external launch config; repository CI configuration is unchanged.
- The old e2e helper seeds release-age exclusions. Its installation is not used as supply-chain acceptance evidence. A fresh independent profile with no release-age exclusions or script overrides installed the final tarball through the official rc.5 CLI successfully.
