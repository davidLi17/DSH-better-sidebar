# LHG selective maintenance — 2026-10-25

## Source and scope

Base: `c2e0c5554a6f87a8aaecbbaa09e79d026a9c78d7` (`0.28.1-lhg.3`).
Upstream PR [#1050](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1050), final head `18dade0f6374e38a905fe3f0c4ba45c985add5c7`, merged into **dev**, merge `abfe133d8988d4ac4210f5efadd87ccc2e940043`. Upstream stable main/release remains `v0.28.0`; this is a selective equivalent backport, not Git ancestry synchronization or a new upstream release.

Selected three independent improvements (including final review corrections):
- Hidden file trees stop load effects / compact-chain continuation; reactivation refreshes watched directories in one batch. Origin `4cb7937a37e080b1fc92e4fec9b5b1081e515f4b`, plus final head corrections.
- Side-chat unchanged row prose is cached by row identity and text, invalidated by session, cwd and transport base. Origin `b1efd9226bb9d765de61e4123a91d8b011594299`.
- Bundle HEAD reuses ETag metadata instead of reading a discarded response body. Origin `81b2e8077e44e7ac89a9f7b8cdb22ead9cb0eb28`. A cold/changed ETag still hashes the file; warm HEAD performs zero file reads.

Not selected: task-graph gesture changes, Git-graph virtualization, diff collapse policies, active-worktree TTL changes, or the rest of the performance refactor. No dependency, host, permission or system-prompt change. MIT attribution retained.

## Preserved custom behavior

Native side-chat image selection/paste, first/follow-up attachment messages and historical image rendering remain intact. The LHG selection bridge still appends to the current side-chat draft, preserves text/images, focuses the composer and never auto-sends. Current-cwd delivered-file routing remains intact.

## Verification

- Frozen lockfile dependency installation with existing supply-chain policy: passed; no policy exclusions or build allowlist changed.
- TypeScript typecheck and ESLint: passed.
- Full Vitest run: **227 files passed; 2754 passed, 17 skipped**. Test HOME is an isolated writable temporary directory; first run exposed that the home-relative fixture cannot write the cloud account HOME, not a plugin defect.
- Regressions cover hidden-root changes / single reactivation batch, paused compact preloading, unchanged-row rewrite count, cwd/session cache invalidation, actual zero `readFile` calls on warm HEAD, native image handling and the draft bridge.
- Build, consumer declaration checks and pack: passed. Consumer strict pass retains the existing upstream declaration-noise filter.
- Search-engine script: ripgrep checks passed; fd checks skipped because fd is unavailable. This is Linux validation, not Windows native validation.
- Tarball: **467 src/lib files** byte-identical to the built checkout. Installed package: **229 non-map lib files** byte-identical.
- Official DSH `0.2.1-rc.1` CLI installed the tarball in a fresh web profile with its default generated policy (no release-age or script-policy override). Bundle registration succeeded; `dsh web --port 0` reached ready without plugin disable errors.
- Browser UI lane unverified: system Chromium exits before startup under this cloud sandbox. No browser-sandbox bypass used.

## Delivery

Version `0.28.1-lhg.4`; prebuilt `lib` ships with source, with no install lifecycle hooks. Repository and package name unchanged. Remote publication and a pinned-commit Git installation are checked separately after this commit is created.
