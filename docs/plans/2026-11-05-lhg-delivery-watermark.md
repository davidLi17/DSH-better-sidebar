# LHG delivery watermark maintenance — 2026-11-05

Base main: `c8660c54b53f50e39cf48583c58766c7d3989364`.
Version: `26.11.5-lhg` (Asia/Shanghai date).

Selectively backport upstream `45b4d42ef65ad3c54d4c14f22d1382579573a213`, included in upstream main `9285c06e0046b2b5a4b6c71c551740c30711747d` (v0.30.0): https://github.com/omdsh-dev/DSH-better-sidebar/commit/45b4d42ef65ad3c54d4c14f22d1382579573a213 . Only the inherited delivery-watermark rebase and its regression test are imported, not the full release or its DSH 0.2.2 baseline change. Preserve LHG selected-text handoff, images, drafts and the DSH 0.2.1 peer baseline. Previously absorbed editor guard, Changes styling and terminal surface fixes are not imported twice.

The compacted inheritance path now remaps absolute `throughSeq` references and discards markers whose target was trimmed. This prevents unreadable newly created child logs and the resulting descendant-export failure. Existing corrupted logs are not modified.

Validation:
- Frozen-lockfile installation passed existing supply-chain policies, with no dependency or workflow changes.
- The added regression fails on the original code (`throughSeq` 15 versus marker seq 8); after the fix, 121 focused side-chat tests pass.
- Typecheck, ESLint, build and consumer declaration checks pass. Rebuilt in the preceding release checkout path to retain CSS identifiers. Verified generated CSS class-map objects are identical after sorting keys; retained their prior order to exclude nondeterministic build noise. Client artifacts differ only in the service version.
- An initial full run had one shallow-history fixture failure. After fetching repository history, the complete suite passed: 235 files, 2848 tests, 17 existing conditional skips; no test was weakened or skipped to work around it.
- Package contains 483 files. Official DSH rc.1 installation into a fresh Web profile registered the bundle and started the Host successfully. Official Playwright browser downloads returned HTML rather than ZIP archives. The system Chromium fallback also failed at launch in this sandbox. Local browser assertions therefore did not run; the unchanged existing CI real-host mount lane remains the publication gate. No installation archive is uploaded.

Upstream DSH 0.2.2 adaptation, editor backup, quote chips and wider UI changes are deferred for separate compatibility and regression validation. This maintenance does not advertise support for DSH 0.2.2.
