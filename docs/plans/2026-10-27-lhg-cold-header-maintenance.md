# LHG cold-session header maintenance (2026-10-27)

## Selection and preserved behavior

Fork base: `71a600dd828038f3f5e2b7237992b011110c4de9` (`0.28.1-lhg.6`).
Upstream main inspected: `b0e0fab50e68f54b07a1fc1e7898030409c7d979` (`0.28.2`).
Selectively backport merged [PR #1069](https://github.com/omdsh-dev/DSH-better-sidebar/pull/1069), head `f7a11ddbfec57bcef008d83a426a079ab3298582`, merge `fcd82267fe1f5e4d073bbd3ec05d538de4e48773`.
No mechanical merge or unrelated README/QR-code changes. MIT attribution retained.

The user's authorized selective fork-main maintenance overrides upstream's contributor dev-only convention. Publication remains coordinated separately: no npm publish, upstream push, new tag/release, uploaded installation package, workflow/permission/account changes.

LHG selected-text append to the same side-chat draft, existing images, focus-at-end without sending, native first/follow-up image input and history are untouched. Existing stable scopes, cold full-read single-flight for actual log consumers, conflict generation guards and macOS fallback placement are retained. Only the client service version constant changes client source.

## Semantics and minimal integration additions

- Detached cwd uses immutable persistence header, not complete event-log observation. All route entry points share the header cache/in-flight lookup. Detached active-worktree resolution does not inspect stored events or spawn git.
- Before attach the sidebar root is the original project, NOT the last execution directory/worktree. Relative paths use this root. After attach the committed live directory and worktree following resume.
- Existing absolute save targets are not rebased to the header project. Real file regression writes to a detached session's explicit worktree path while preserving a same-named file in its original project, then verifies a header-root-relative write separately. The fork's existing outside-workspace policy is unchanged; no fence is silently restored.
- Header caches are scoped by persistence-service object (WeakMap), preventing identical session IDs in distinct stores from sharing paths. Each completed cache remains bounded at 256; pending entries are removed on completion/failure.
- Recheck live state after awaiting the header so an attach completed during I/O wins. If a session detaches while the active-worktree git probe is pending, return empty live events rather than opening its stored log.
- Missing/failed header reads retain upstream fallback order: configured host default, client hint, process cwd. Both stat-absent and configured-default cases are tested. A malformed relative stored cwd is rejected.

## Verification

- Fresh frozen-lockfile install; no dependency/lockfile/supply-chain policy edits. Cloud Node 24.22.1 / pnpm 11.25.0, isolated writable HOME/XDG; existing CI targets Node 22 / pinned packageManager 11.8.0.
- Typecheck, full ESLint, build, consumer declaration guard, engine checks, pack and diff whitespace checks passed.
- Final full suite: **233 files passed; 2833 passed, 17 skipped; zero failed**. Focused smoke/worktree suite: **92 passed**. Includes 12 concurrent calls spanning API cwd/read and raw write routes sharing one header with zero persisted-log opens; cache/store isolation; attach/detach races; existing LHG regressions.
- First diagnostic full run exposed an unsynchronized service-version constant and a temporary test-shell identity override affecting the Ada blame fixture. Both were corrected, then the complete final suite passed; no test was skipped to hide either result.
- Official DSH **0.2.1-rc.2** CLI installed the final tarball in a new isolated web profile, registered `dsh-better-sidebar` in bundles, and reached `dsh web --port 0` ready without plugin-disable errors. The actual rc.2 persistence implementation's stat path calls readGenerationHeader rather than a complete log observation.
- Final tarball **473 src/lib files** match current source/build byte-for-byte; all **232 installed non-map lib files** match. Tarball SHA-256: `dccfcfeaad4404d6c8513839351c00759ce6e3052000a49094e6677d516647ce`.
- A first parallel build/install comparison found only nondeterministic CSS-object key ordering. Final pack and clean-profile install were serialized, with the exact matches above. No installation archive is committed or uploaded.

## Boundaries and publication handoff

No real 39 MB session OOM benchmark was available; the tests prove call counts and route behavior, not a measured production memory reduction. Chromium launch is already blocked by this cloud sandbox; do not claim browser/native desktop verification. No attempt to bypass that restriction. Official Desktop is not supported by this npm CLI; the user's Git-source UI installation must not be replaced by a claimed desktop CLI install.

Remote main and Git-source installation of the final commit must be checked after coordinated publication. At preparation time the fork had no open PRs, and the Actions runs query for base SHA returned zero workflow runs; that is not evidence that CI passed. Existing workflows are unchanged and must run against the new final commit after publication.
