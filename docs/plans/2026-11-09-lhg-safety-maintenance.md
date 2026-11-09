# LHG selective safety maintenance — 2026-11-09

Base main: `00239a512e0dbe551c405d2e9d2f4cd1d5e1449c`.
Version: `26.11.9-lhg` (Asia/Shanghai).

## Selected changes and provenance

- Selectively absorb the Git literal-pathspec, archive operand, and text-editor save-snapshot fixes from upstream PR #1146, dev merge `31449826ae8f4b6f5dacb19c84defa36d7fd090e` (head `30b18ae20d8cd237935955e64b5e4e0eb819fa6e`). Only the relevant implementation and regression assertions are backported. Preserve the Fork's existing conflict-probe generation guard.
- Git paths containing brackets or other pathspec metacharacters are treated as literal names, so staging/discarding a selected file cannot match an unintended sibling.
- Archive operands are separated from options; dash-prefixed selections are rejected rather than interpreted as command flags.
- Saving acknowledges the snapshot actually written. Edits made during a save stay dirty; callbacks from a replaced editor do not alter the new document's state or modification-time baseline.

The #1146 source is merged to upstream dev, not an upstream main release: upstream main was `bd6363021dd4af8ca9df239e0c59df35b873d6b4` at evaluation, 44 commits behind that merge.

This is functional, selective absorption, not a merge of upstream dev and not a claim that these source commits are Git ancestors. Keep the DSH 0.2.1 support line, LHG selected-text handoff, same-session side-chat draft/image behavior, native attachments and history. Do not introduce upstream editor-backup or quote-chip features, change host React, permissions, workflows, or the official DSH client.

## Other selected sources

- Upstream PR #1123 dev merge `641bf969cacbfad8c27656c3eed790336a1b8b38`, plus follow-up `f3ff9d39df834153bb9b6e535269f062136bd8ce`: protect scriptable file responses without imposing document sandbox behavior on inert image/binary responses. Preserve the Fork's existing SVG isolation and request admission.
- Upstream PR #1129 dev merge `7c395231b888f1c86cc49bac7a56aeea1530f3d0`: use the host floating-action fill/hover tokens for the selection action, retaining geometry and interactions.
- Resolve KaTeX exactly to 0.18.2 and rebuild the self-contained Mermaid frame from ESM rather than copying the dependency's prebuilt UMD, which embeds an older KaTeX. Declare the existing locked rolldown 1.2.5 directly for this generator; do not unnecessarily move the rest of the build dependency graph. Keep strict Mermaid mode, isolated iframe and SVG cleanup.
- All these commits are in upstream dev `3f4d75a09072a0bd38d82b6eb130ef0278e6e0be`, not upstream main `bd6363021dd4af8ca9df239e0c59df35b873d6b4`. They are independently validated selective backports, not an upstream release update.

## Verification

The previous temporary candidate is no longer available; all published bytes must come from this reconstructed checkout and newly run checks. Before integration of the other candidates, 72 focused tests and the full 235-file suite (2857 passed, 17 existing conditional skips) pass, as do typecheck and ESLint. The three save-race regression cases fail against the old TextEditor source and pass against the fix. Independent source review found no blocking issue. These initial checks are not final combined-candidate evidence.

The normal Playwright Chromium installer was attempted without disabling validation. The official download returned an empty or truncated ZIP. The unchanged GitHub CI real-host browser lane remains a publication gate unless a local real-host browser run succeeds. No installation archive is uploaded as part of this maintenance.

## Combined-candidate local results

Frozen install, typecheck, full ESLint, 236 test files (2871 passed, 17 existing conditional skips), build, consumer declaration checks and pack pass on the final rolldown 1.2.5 graph. The first combined run identified an unsynchronized handwritten service version and a noncanonical test HOME path; the service version was synchronized and HOME normalized without weakening assertions, then the entire suite was rerun successfully.

KaTeX provenance: GHSA-238p-pmpm-9mq7 / CVE-2026-103923 (https://github.com/advisories/GHSA-238p-pmpm-9mq7), fixed in official 0.18.2 (https://github.com/KaTeX/KaTeX/releases/tag/v0.18.2), upstream fix 0adf7e77db6915d991803b29699f82b1ccf8d4f4. The issue is a trust bypass under existing prototype pollution, not a claim that an ordinary formula alone executes script. The new assertions fail against old response-header/CSS/frame generation code; independent source review covers the backported data safety behavior.

Real-host Chromium and Windows checks must pass on the candidate commit in the existing CI before main publication; local browser execution is not counted as passed.

The final package has 483 files; content matches the checkout, with only pnpm's expected package.json normalization (omit packageManager and prepublishOnly, preserve all remaining fields). SHA-256: `e2af9097e13233100643dd343bfba317a54bd2d0ac8de1be60d4e7f38c0750dd`. Installing through the official DSH rc.1 CLI into an isolated Web profile registers the bundle and starts the host. All 232 installed lib files match the checkout byte for byte. The local mount's 13 browser cases could not launch the unavailable Playwright executable; these are not feature assertions passed. A separate attempt using installed system Chromium fails with container socket EPERM. Existing CI is required for real-browser and Windows evidence.
