# LHG selective frontend dependency maintenance (2026-10-31)

Base: davidLi17/DSH-better-sidebar main `8d3c9452b89ad628b61bdf4a44ef6ab3ba0cb069`.
Version: `26.10.31-lhg`. Upstream plugin main remains `2d736f5496fe97f4bba6af37d99861649b9ef3c0`; its latest two commits only update README group QR URLs. This is a dependency maintenance change, not an upstream plugin merge.

## Selected changes

- DOMPurify `3.4.14` -> `3.4.17`: XML clobbering hardening, namespace/literal-text/SMIL attribute validation fixes and sanitization edge cases. See official releases https://github.com/cure53/DOMPurify/releases/tag/3.4.15 and https://github.com/cure53/DOMPurify/releases/tag/3.4.17 . The existing MarkdownHtml denylist and Mermaid iframe/sanitizer policies are unchanged. The prebuilt Mermaid UMD is not replaced with a new major version.
- CodeMirror view `6.43.9` -> `6.43.15`, gitHead `da63d53a7b1f9011a09481f5fa2397294104d73a`: fixes input/scroll event ordering that moved selection, composition DOM reuse, scroll stabilization and bidi Home/End behavior.
- CodeMirror state `6.7.1` -> `6.7.6`, gitHead `651084c8a322b3a19b2bb3e00eee7d4a61d641af`: fixes range mapping/order, unnecessary redraws and association of replacement cursors with inserted text.
- CodeMirror commands `6.11.0` -> `6.11.1`, gitHead `5d2ddbbf485a7e8b17c69cf58ebaebf8e375036c`: bidi-aware start/end movement.
- CodeMirror release notes were read from each exact official npm tarball's CHANGELOG.md. Current upstream repository is https://code.haverbeke.berlin/codemirror/ ; the old GitHub main changelog is stale. This distinction prevents misattributing older release fixes.

Only these four direct dependencies are updated. React 18 and the DSH shared package baselines, Mermaid 11, language packages and developer toolchain remain unchanged. The resolved graph keeps one CodeMirror state/view version; no duplicate framework is bundled. No permission, account, workflow or npm publication change. Existing LHG selected-text draft handoff, attachment selection/paste, draft images, focus and history are unchanged.

## Verification

- Fresh frozen-lockfile installation and subsequent targeted resolution passed existing pnpm supply-chain checks. No verification policy or script-policy bypass. pnpm 11.25.0, Node 24.22.1 in an isolated writable HOME.
- Typecheck, ESLint, full build and browser-only consumer declaration checks passed.
- Final full suite: **235 files passed, 2846 tests passed, 17 existing conditional skips, zero failures**. Uses the repository's pinned DSH rc.1 test dependencies. No claim that the full suite ran against rc.5.
- Focused draft/image/selection/Markdown HTML/find/save/dependency suites: **7 files, 53 tests passed**.
- Two new dependency regression tests verify replacement cursor association and multi-cursor undo using the actual dependencies. The cursor test's expected association -1 was checked against old state 6.7.1 (returns 0) and the updated version (passes).
- Initial diagnostic full run found one candidate manifest-version mismatch; dsh.plugin.json was synchronized and the entire suite rerun successfully. No test was skipped to hide a failure.
- Engine check passed for available ripgrep; fd is unavailable and its two probes were skipped. Windows/native desktop and GUI were not run.
- Prebuilt lib output is included. Package and isolated official rc.5 installation checks are recorded below after completion.

### Final package / host checks

- DOMPurify npm gitHead: `a77a3e78b59f72fa4d1c83f22e121ad9cc7d3575`; its MPL-2.0 OR Apache-2.0 licensing is unchanged.
- `pnpm pack` produced 483 files. All source/build files match the archive byte-for-byte; package.json matches after pnpm's documented packaging normalization (packageManager/prepublishOnly removal). All 232 installed lib files plus the manifest (233 files total) match the archive.
- Archive SHA-256: `de1f3e4b109a6a9ee67410c84abbcb41b8a64978700b541f75612f203aaa5512`. No archive upload.
- Official `@deepseek-ai/dsh@0.2.1-rc.5` CLI installed the final archive via `plugin --profile web add file:...` into a new isolated profile. No minimumReleaseAge exclusions, script-policy overrides, or user-profile changes were used. Bundle registration, host readiness, authenticated HTTP 200 and the plugin entry in served HTML passed. Browser/Windows visual behavior remains unverified.
