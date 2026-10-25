# LHG three sidebar fixes — 2026-10-25

## Source and scope

Base: `ca01ad92003ae06f97e852b72554ddb04e75fefb` (`0.28.1-lhg.4`).
This is a selective equivalent backport, not a claim that the upstream PRs have merged:

- [#1040](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1040), `598714bb64a242f85835cbb911995ca6c3c62393`: Mermaid iframe layout isolation, shared visible-first rendering, placeholders, coalesced Markdown DOM passes. Open/unmerged at inspection.
- [#1055](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1055), `828452ae7777b368c922fb6a92bdb8bcd0d15095`: Windows Markdown path separator normalization. Open/unmerged at inspection.
- [#1053](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1053), `f2ad4b1af84ca2159a903e58b31a9ed1ad43b06f`: keep conversation-header bottom workbench toggle visible while native right panel is open. Open/unmerged at inspection.

No host changes, dependencies, permission changes, account changes, workflow changes, upstream publication, or npm release. Existing MIT attribution retained. This user fork ships prebuilt `lib` on main; the explicit user release request takes precedence over upstream's dev-only contribution workflow.

## Corrections during integration

- A Mermaid syntax error is a diagram failure, not evidence that the renderer is unavailable. Do not retry or permanently disable all later diagrams because one fence is malformed.
- Correlate parent/frame messages with the actual source window; retain `sandbox="allow-scripts"` without `allow-same-origin` and sanitize every returned SVG.
- Keep queued tasks cancellable while waiting, recheck visibility after yielding, promote newly visible fences ahead of background tasks, and pause when the document is hidden. Resume late inline HTML processing on document visibility restoration.
- Normalize the path even when its heading separator is already `%23`; maintain reference-link and repeat-pass behavior. UNC preservation is not a claim of new host UNC support.
- Generate the inline asset explicitly in build/bundle/watch/typecheck/test scripts. No upstream `prepare` hook is imported, since managed installs disallow lifecycle scripts and this fork ships ready-built output.

## Preserved behavior

No changes to SideChatView, sidechat draft bridge, image inputs, server-side prompt/attachment flow, conversation serialization or session routing. The selection bridge still appends to one current draft, preserving existing text and images, focuses its end, and never auto-sends. Side-chat opening, first/follow-up native image input, and historical image rendering retain their regression suites. The selective #1050 file-tree/cache/bundle-HEAD fixes in the base remain untouched.

## Verification

- Frozen-lockfile installation passed with the repository's existing package policy; no dependency or allowlist changes. This cloud runtime uses Node 24.22.1 and pnpm 11.25.0; upstream CI targets Node 22 and pnpm 11.8.0.
- Final TypeScript, full ESLint, build, consumer declaration checks and pack passed. Consumer strict check retains the existing upstream declaration-noise filter.
- Final full Vitest: **230 files passed; 2790 passed, 17 skipped, zero failed**. Tests use an isolated writable temporary HOME. Twelve new scheduler/source/theme regressions and eight transport regressions cover the integration corrections; the existing LHG draft/image suites remain green.
- Tarball **471 src/lib files** and installed **231 non-map lib files** are byte-identical to the final checkout/build.
- Official DSH `0.2.1-rc.1` CLI installed the tarball into a fresh web profile with the default generated package policy and reached `dsh web --port 0` ready without plugin-disable errors. No installation package was uploaded.
- Search engine assertions passed for ripgrep; fd assertions skipped because fd is absent.
- Browser UI / mount Playwright lane is **unverified**: Chromium aborts before loading with `socket() failed: Operation not permitted` in this cloud sandbox. No sandbox bypass or user-computer access attempted. Linux/jsdom tests do not claim native Windows or real-desktop visual verification.
- The repository's workflow-run collection was empty at the pre-publication check; remote CI and final ref are checked separately after publication. No workflow or account/security setting was changed.

## Delivery

Version `0.28.1-lhg.5`. Prebuilt lib is committed alongside source, including the small new frame declaration files; generated source assets and source maps remain untracked. No install lifecycle hooks, tags, GitHub releases, npm publication, or uploaded installation packages.
