# LHG sidechat effort label (2026-10-29)

- Fork base: `6c0866e5b11f9b42cbe6dd5b9f13ee0064881861` (`0.28.2-lhg.2`). Result: `0.28.2-lhg.3`.
- User-requested UI-only change, not an upstream merge. MIT license retained.
- The model button and its full tooltip now include the selected reasoning effort. Names come from the current model's host catalog (including provider-specific Ultra labels), not a fixed list. The existing model-selection / info refresh path keeps the label in sync.
- Unset effort is shown as the existing localized default label only when the catalog advertises reasoning; no adapter default is presented as an explicit choice. Unknown explicit effort falls back to its ID; non-reasoning models keep the plain model label.
- Separate flex spans let only the model name ellipsize while retaining the effort label. No backend, model calls, custom draft/image bridge, session/history semantics, permissions, dependencies or workflows changed.

## Validation

- Frozen-lockfile install passed with supply-chain checks. No lockfile edits.
- 66 tests passed, 0 skipped across sidechat-view, theme, market-manifest, manifest-consistency, sidechat-draft-bridge and sidechat-image-input. New cases cover High/Max/provider-labelled Ultra changes, unset/unknown effort, non-reasoning models and shrinking CSS.
- Typecheck and changed-file ESLint passed. Build and pack passed. All 473 packaged src/lib files match the checkout byte-for-byte; host/client entry points, patch and license present. Local tarball SHA-256: `03787a3805dc03866ba7e3f6ba3ae34535dde68d03fc506b770080fc5e165d8e`. Generated bundle churn includes clean-checkout CSS identifiers and object ordering.
- No real-browser / DSH mount test requested; no live model calls. Existing fork Actions remain disabled (0 runs); not enabled or counted as CI success.
- Installation archives stay local; no npm, Release or upstream publication.
