/**
 * The text editor's save baseline (#1059). `mtimeRef` is the optimistic-
 * concurrency baseline the editor sends as `expectedMtimeMs`; the host refuses
 * the save (`fs-conflict`) when the file on disk no longer matches it.
 *
 * A fresh load can return the SAME bytes with a NEW mtime — `touch`, a
 * `git checkout`, a formatter rewriting identical text — and then `content`
 * never changes, so the file-switch effect keyed on it never runs. The
 * baseline must therefore ALSO follow the `mtimeMs` prop, or every later save
 * keeps sending the stale value and the conflict never clears.
 *
 * The second case pins the other side of the contract: a genuinely different
 * document must still run the original file-switch reset (preview mode, no
 * draft, clean editor, conflict cleared, new baseline) unchanged.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act } from 'react-dom/test-utils'
import { EditorView } from '@codemirror/view'
import { renderRoot, setupReactAct } from './test-utils.ts'
import { TextEditor } from '../src/client/TextEditor.tsx'
import { SidebarApiError } from '../src/client/api.ts'
import { createSidebarStore } from '../src/client/state.ts'
import type { EditorToolbarControls, EditorToolbarState, FileViewerProps } from '../src/client/service.ts'

setupReactAct()

const fsWrite = vi.fn()
const fsReadProbe = vi.fn()
vi.mock('../src/client/api.ts', async (importOriginal) => {
  // Keep the real module (the api surface and the error class); only the save
  // call is observed.
  const actual = await importOriginal<typeof import('../src/client/api.ts')>()
  return {
    ...actual,
    api: { ...actual.api, fsWrite: (...args: unknown[]) => fsWrite(...args), fsRead: (...args: unknown[]) => fsReadProbe(...args) },
  }
})

const CONTENT = 'const a = 1\n'
const NEXT_CONTENT = 'const a = 2\n'

function viewerProps(overrides: Partial<FileViewerProps> = {}): FileViewerProps {
  return {
    ctx: {} as FileViewerProps['ctx'],
    store: createSidebarStore(),
    scope: { sessionId: 's1', cwd: '/p' },
    path: '/p/a.ts',
    title: 'a.ts',
    viewerId: 'code',
    content: CONTENT,
    mtimeMs: 100,
    // The real editor's deployment: the host header owns the toolbar, so the
    // save/mode commands arrive through the registered controls.
    toolbar: 'host',
    ...overrides,
  }
}

interface Harness {
  container: HTMLDivElement
  /** Re-render the SAME instance with the next load (a reload / file swap). */
  rerender: (next: Partial<FileViewerProps>) => void
  /** The last toolbar state the editor reported. */
  state: () => EditorToolbarState
  /** The toolbar commands the editor registered on mount. */
  controls: () => EditorToolbarControls
  /** The live CodeMirror view. */
  view: () => EditorView
  unmount: () => void
}

function mountEditor(overrides: Partial<FileViewerProps> = {}): Harness {
  const props = viewerProps(overrides)
  let toolbar: EditorToolbarState | undefined
  let controls: EditorToolbarControls | null = null
  const element = (next: Partial<FileViewerProps> = {}): ReturnType<typeof createElement> =>
    createElement(TextEditor, {
      ...props,
      ...next,
      onToolbarState: (state: EditorToolbarState) => { toolbar = state },
      onToolbarControls: (nextControls: EditorToolbarControls | null) => { controls = nextControls },
    })
  const root = renderRoot(element())
  const view = (): EditorView => {
    const host = root.container.querySelector('.cm-editor')
    if (host === null) throw new Error('the mounted editor has no .cm-editor')
    const live = EditorView.findFromDOM(host as HTMLElement)
    if (live === null) throw new Error('the mounted editor has no CodeMirror view')
    return live
  }
  return {
    container: root.container,
    rerender: (next: Partial<FileViewerProps>) => { root.rerender(element(next)) },
    state: () => {
      if (toolbar === undefined) throw new Error('the editor reported no toolbar state')
      return toolbar
    },
    controls: () => {
      if (controls === null) throw new Error('the editor registered no toolbar controls')
      return controls
    },
    view,
    unmount: root.unmount,
  }
}

/** Apply the CodeMirror transaction a keystroke would (same doc-change path). */
function type(view: EditorView, insert: string): void {
  act(() => { view.dispatch({ changes: { from: 0, insert } }) })
}

beforeEach(() => {
  fsWrite.mockReset()
  fsReadProbe.mockReset()
  fsWrite.mockResolvedValue({ ok: true, mtimeMs: 999 })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('TextEditor save baseline (#1059)', () => {
  it('follows a fresh load of unchanged text, not just a content change', async () => {
    const editor = mountEditor()
    try {
      const mounted = editor.view()
      // The reported reload: same bytes on disk, new mtime. `content` is
      // unchanged, so the file-switch effect must not be what re-bases the ref.
      editor.rerender({ content: CONTENT, mtimeMs: 200 })
      expect(editor.view(), 'the same viewer instance stays mounted').toBe(mounted)
      type(editor.view(), '// touched\n')
      expect(editor.state().dirty).toBe(true)
      await act(async () => { editor.controls().save() })
      await act(async () => { await Promise.resolve() })
      expect(fsWrite).toHaveBeenCalledTimes(1)
      // (scope, path, content, expectedMtimeMs) — the fresh load's mtime.
      expect(fsWrite.mock.calls[0]![3]).toBe(200)
    } finally {
      editor.unmount()
    }
  })

  it('still performs the file-switch reset when the content really changes', async () => {
    const editor = mountEditor({ viewerId: 'markdown', path: '/p/a.md', title: 'a.md' })
    try {
      expect(editor.state()).toMatchObject({ mode: 'preview', dirty: false, saveState: 'idle' })
      act(() => { editor.controls().setMode('edit') })
      expect(editor.state().mode).toBe('edit')
      type(editor.view(), '# draft\n')
      expect(editor.state().dirty).toBe(true)
      // A genuinely different document: the original [content] reset runs.
      editor.rerender({ content: NEXT_CONTENT, mtimeMs: 400 })
      expect(editor.view().state.doc.toString()).toBe(NEXT_CONTENT)
      expect(editor.state()).toMatchObject({ mode: 'preview', dirty: false, saveState: 'idle' })
      await act(async () => { editor.controls().save() })
      await act(async () => { await Promise.resolve() })
      expect(fsWrite).toHaveBeenCalledTimes(1)
      expect(fsWrite.mock.calls[0]![2]).toBe(NEXT_CONTENT)
      expect(fsWrite.mock.calls[0]![3]).toBe(400)
    } finally {
      editor.unmount()
    }
  })
})

/** Async reload probes must not modify a newer save, load, or resource. */
describe('TextEditor conflict probe ordering', () => {
  function pendingProbe(): { resolve: (content?: string, mtimeMs?: number) => void; reject: () => void } {
    let resolve!: (result: { kind: 'text'; content: string; size: number; mtimeMs: number }) => void
    let reject!: (error: Error) => void
    fsReadProbe.mockReturnValueOnce(new Promise((yes, no) => { resolve = yes; reject = no }))
    return {
      resolve: (content = CONTENT, mtimeMs = 200) => { resolve({ kind: 'text', content, size: content.length, mtimeMs }) },
      reject: () => { reject(new Error('old probe failed')) },
    }
  }
  async function save(editor: Harness): Promise<void> {
    await act(async () => { editor.controls().save() })
    await act(async () => { await Promise.resolve() })
  }
  async function conflict(editor: Harness): Promise<void> {
    fsWrite.mockRejectedValueOnce(new SidebarApiError('fs-conflict', 'changed on disk'))
    await save(editor)
    expect(editor.container.textContent).toContain('changed on disk since it was loaded')
  }
  function reload(editor: Harness): void {
    const button = [...editor.container.querySelectorAll('button')].find(button => button.textContent === 'Reload from disk')
    expect(button).toBeDefined()
    act(() => { button!.click() })
  }

  it('does not roll back a successful save or clear its newer conflict with an older probe', async () => {
    const editor = mountEditor()
    try {
      type(editor.view(), '// draft\n')
      await conflict(editor)
      const probe = pendingProbe()
      reload(editor)
      await save(editor) // new baseline 999
      type(editor.view(), '// newer\n')
      await conflict(editor)
      await act(async () => { probe.resolve() })
      expect(editor.container.textContent).toContain('changed on disk since it was loaded')
      await save(editor)
      expect(fsWrite.mock.calls.at(-1)![3]).toBe(999)
    } finally { editor.unmount() }
  })

  it('does not replace a fresh same-content load baseline with a stale probe', async () => {
    const editor = mountEditor()
    try {
      await conflict(editor)
      const probe = pendingProbe()
      reload(editor)
      editor.rerender({ mtimeMs: 300 })
      await act(async () => { probe.resolve(CONTENT, 200) })
      await save(editor)
      expect(fsWrite.mock.calls.at(-1)![3]).toBe(300)
    } finally { editor.unmount() }
  })

  it.each([
    { path: '/p/b.ts' },
    { scope: { sessionId: 's2', cwd: '/p' } },
    { scope: { sessionId: 's1', cwd: '/other' } },
    { scope: { sessionId: 's1', cwd: '/p', repoRoot: '/nested' } },
  ])('does not apply the old probe to a changed resource %j', async (next) => {
    const onReload = vi.fn()
    const editor = mountEditor({ onReload })
    try {
      await conflict(editor)
      const probe = pendingProbe()
      reload(editor)
      editor.rerender(next)
      await act(async () => { probe.resolve(CONTENT, 200) })
      await save(editor)
      expect(fsWrite.mock.calls.at(-1)![3]).toBe(100)
      expect(onReload).not.toHaveBeenCalled()
    } finally { editor.unmount() }
  })

  it('ignores an older probe after a newer reload has already resolved', async () => {
    const onReload = vi.fn()
    const editor = mountEditor({ onReload })
    try {
      await conflict(editor)
      const old = pendingProbe()
      reload(editor)
      const latest = pendingProbe()
      reload(editor)
      await act(async () => { latest.resolve(CONTENT, 300) })
      await act(async () => { old.resolve(NEXT_CONTENT, 200) })
      expect(onReload).not.toHaveBeenCalled()
      await save(editor)
      expect(fsWrite.mock.calls.at(-1)![3]).toBe(300)
    } finally { editor.unmount() }
  })

  it('keeps edits made while the current valid probe is pending', async () => {
    const editor = mountEditor()
    try {
      await conflict(editor)
      const probe = pendingProbe()
      reload(editor)
      type(editor.view(), '// while reading\n')
      await act(async () => { probe.resolve(CONTENT, 200) })
      expect(editor.view().state.doc.toString()).toBe(`// while reading\n${CONTENT}`)
      expect(editor.state().dirty).toBe(true)
      await save(editor)
      expect(fsWrite.mock.calls.at(-1)!.slice(2)).toEqual([`// while reading\n${CONTENT}`, 200])
    } finally { editor.unmount() }
  })

  it('does not call the old host reload if a failed probe returns after changing paths', async () => {
    const onReload = vi.fn()
    const editor = mountEditor({ onReload })
    try {
      await conflict(editor)
      const probe = pendingProbe()
      reload(editor)
      editor.rerender({ path: '/p/b.ts' })
      await act(async () => { probe.reject() })
      expect(onReload).not.toHaveBeenCalled()
    } finally { editor.unmount() }
  })

  it('does not call the old host reload after the editor unmounts', async () => {
    const onReload = vi.fn()
    const editor = mountEditor({ onReload })
    await conflict(editor)
    const probe = pendingProbe()
    reload(editor)
    editor.unmount()
    await act(async () => { probe.reject() })
    expect(onReload).not.toHaveBeenCalled()
  })
})
