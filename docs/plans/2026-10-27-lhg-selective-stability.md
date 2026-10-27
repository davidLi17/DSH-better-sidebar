# LHG selective stability maintenance — 2026-10-27

## Provenance and scope

Fork base: `91ebbf485852a2410f3785efe54f4cc54b751bb5` (`0.28.1-lhg.5`).
The prior day's proposed `.6` was not committed or published to main; this is a fresh implementation and verification run, not a continuation of an uncertain blob mutation.

Selected upstream fixes, all merged when inspected:

- [PR #1057](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1057), head `31dc3b4572ec23a880380c7cb19044a058c4ceb5`, merge `01a6fa573b89d76ae810bc23c2a4aaf9b341b689`: stable per-component session scope and explicit inline diff-content refresh.
- [`7ecf6a14af48d2aaeb82865e171640a35bb335fd`](https://github.com/omdsh-dev/DSH-better-sidebar/commit/7ecf6a14af48d2aaeb82865e171640a35bb335fd): collapse concurrent cold session/cwd reads instead of repeatedly decoding a large unloaded session log.
- [`44007061bb209638a2812e0e93dd4fe83cfd29a3`](https://github.com/omdsh-dev/DSH-better-sidebar/commit/44007061bb209638a2812e0e93dd4fe83cfd29a3): preserve the editor draft when only the disk mtime changed, updating the unchanged disk-content baseline.
- [`c908959f3dfc3ac24c3909dcd6b127c2269627a6`](https://github.com/omdsh-dev/DSH-better-sidebar/commit/c908959f3dfc3ac24c3909dcd6b127c2269627a6): keep the macOS fallback button clear of native window controls.

All four source commits were verified as ancestors of upstream main `971a3dc03f8d1643807b65e802490c6271be0387`. These are selective equivalent backports, not a wholesale merge of upstream main/dev. MIT attribution remains. The explicit user maintenance request authorizes a reviewed non-force fork-main release, overriding the upstream dev-only contributor convention; there is no upstream or npm publication, tag/release, or installation-package upload.

## Custom behavior retained

Keep native image first/follow-up input and image history, side-chat routing, selected-text append to the same current side-chat draft with its existing images, focus-at-end and never-auto-send semantics. The previous #1035 / #1041 / #1044 / #1050 / #1040 / #1055 / #1053 fixes remain, including bad-Mermaid recovery, sandbox source-window validation and bottom-toggle availability. No host source changes, dependencies, lockfile/supply-chain policy changes, new permissions, install lifecycle hooks, workflow edits or account/security changes.

## Integration corrections and regression evidence

- Scope tests were applied to the unchanged fork base first: six failures (four identity cases, actual DiffPane loading flicker, and stale content after header refresh). The same focused suite passed **13/13** after implementation, including actual session/cwd invalidation.
- The git smoke test must use a bounded real scratch repository: the fork's current checked-in Mermaid release patch exceeds the production 8 MiB git-output cap. Do not weaken that cap or skip the test.
- Cold-read tests independently failed before the fix (12 parallel cold reads, repeated reads in a failing batch), then passed with same-key sharing, distinct cwd hints/sessions, rejection cleanup and subsequent retries. The entire smoke file passed 75/75. This proves shared work/correct cleanup, not a real 39 MB memory benchmark.
- Five editor/mac regressions failed on the base. Seven additional late-probe races failed even with the upstream editor patch alone. Add generation invalidation on resource/load changes, save attempts/results and unmount: stale success/failure cannot overwrite a new baseline, clear a newer conflict or invoke an old host reload. Repeated out-of-order probes and edits made during a probe are covered.
- Editor/mac focused verification passed 39/39 across five files, including Windows, fullscreen and outside-titlebar negative cases. The existing fallback test clears persisted localStorage between cases; no production state reset was added.
- LHG preservation-focused tests passed 21 files / 353 tests, including image input/history, draft bridge, side chat, Mermaid scheduling/source validation, Markdown navigation and the existing bottom toggle. These suites remain in the full gate too.

## Verification boundary

- Fresh frozen-lockfile install passed with unchanged supply-chain policies. This cloud uses Node 24.22.1 / pnpm 11.25.0, isolated writable HOME/XDG and CI noninteractive mode; upstream workflow targets Node 22 / pnpm 11.8.0.
- Final serial typecheck, full ESLint, build, consumer declaration checks, full test suite, engine check and pack passed. The existing consumer guard filters only pre-existing upstream declaration noise.
- Full Vitest: **233 files passed; 2824 passed, 17 skipped, zero failures**. Independent final CR reran seven targeted files / 123 tests, all passed.
- Tarball **473 src/lib files** and installed **232 non-map lib files** match the exact final source/build byte-for-byte. Pack SHA-256: `f21dd0c82e9e13b6f555464e48d8eb8b4cd28e38dbbb4fc86de4605ce5297bbf`. Prebuilt lib is included in the release tree; generated source asset and source maps remain untracked.
- Official pinned DSH `0.2.1-rc.1` CLI installed the final local tarball into a fresh web profile using the host's default generated policy, registered its bundle and reached `dsh web --port 0` ready without plugin-disable errors. No installation package was uploaded.
- Real ripgrep assertions passed; fd assertions skipped because fd is absent.

 Known cloud Chromium `socket() failed: Operation not permitted` is not bypassed or re-probed; real-browser UI, native macOS and native Windows remain unverified locally. Linux/jsdom assertions are not desktop visual evidence. Remote main/CI are verified separately after any authorized publication.
