# LHG sidechat selection toolbar

User-requested local integration (not an upstream merge). Bases: Sidebar
`aaee3b25f7a6d201b82ce196967199bf9c0594ea` and LHG Utils
`a542b0faafeac3410d18c889936f64c3b5aac93c`.

Sidebar renders assistant answers independently of the main `conversation.chat.node`
slot decorated by LHG. Add an optional service registration for visible assistant
answer components; LHG reuses its existing source/annotation wrapper. Main-session
identity owns composer/BTW/draft actions, while source identity is
`JSON.stringify(['sidechat', threadId, seq])`. No fake host DOM attributes or backend
changes. Hidden surfaces and identity changes remove old wrappers/portals. Sidechat
citation links are not looked up in the parent's transcript.

Compatibility: either plugin can run without the other/new API. Both new versions
are needed for this added toolbar. Registration/disposal use the existing optional
Cordis injection and registry subscription. No new dependency, permission, or workflow.

Validation: focused service/draft/manifest tests; actual DOM Range + pointerup toolbar
regression covers annotation, independent BTW, draft handoff, source navigation,
citation isolation and unmount. Typechecks/builds and local package-entry checks.
Real DSH browser/account acceptance not run. Local package archives are verification
artifacts only, never uploaded.
