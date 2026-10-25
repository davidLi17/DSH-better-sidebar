/**
 * MermaidMarkdown architecture spec: the preview renders the WHOLE document
 * through one MarkdownText pass (cross-fence reference-style links must
 * resolve — the P1 regression from the CR), then swaps every rendered
 * mermaid CodeBlock for a diagram. The actual mermaid layout engine runs in
 * the isolated iframe (see mermaid-frame.ts), so the specs inject a stub
 * renderer instead of pulling mermaid into jsdom.
 */
// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

// The act() environment flag (React 18.2 reads it before flushing effects).
import { setupReactAct } from './test-utils.ts'
setupReactAct()

import { MermaidMarkdown, resetMermaidRenderQueueForTests } from '../src/client/mermaid.tsx'
import { setMermaidFrameRendererForTests, type MermaidTheme } from '../src/client/mermaid-frame.ts'

/** The stub renderer the specs install; each test clears its call log. */
const renderDiagram = vi.fn(async (_code: string, _theme: MermaidTheme) => (
  '<svg xmlns="http://www.w3.org/2000/svg"><text>MOCK-DIAGRAM</text></svg>'
))

const codeLabels = {
  copyLabel: 'Copy', copiedLabel: 'Copied', codeLabel: 'Code block', wrapLabel: 'Wrap lines', unwrapLabel: 'Do not wrap lines',
}

async function renderMarkdown(text: string): Promise<{ container: HTMLElement; root: Root }> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(MermaidMarkdown, { text, codeLabels }))
    // Let the queued render + its state update settle inside the act scope.
    await new Promise(resolve => { setTimeout(resolve, 0) })
  })
  return { container, root }
}

async function unmount(root: Root): Promise<void> {
  await act(async () => { root.unmount() })
}

/**
 * Wait until `check` returns a truthy value. Diagram rendering is queued (one
 * render at a time, idle slots between them — the whole point of the queue), so
 * a swap lands asynchronously instead of in the mount commit.
 */
async function waitFor<T>(check: () => T | null | false, timeoutMs = 3000): Promise<T> {
  const startedAt = Date.now()
  for (;;) {
    const value = check()
    if (value) return value
    if (Date.now() - startedAt > timeoutMs) throw new Error('timed out waiting for the diagram render')
    await act(async () => { await new Promise(resolve => { setTimeout(resolve, 10) }) })
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
  renderDiagram.mockClear()
  setMermaidFrameRendererForTests(renderDiagram)
})

afterEach(() => {
  setMermaidFrameRendererForTests(null)
  resetMermaidRenderQueueForTests()
})

describe('MermaidMarkdown', () => {
  it('swaps the mermaid code block for a rendered diagram', async () => {
    const { container, root } = await renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```')
    const diagram = await waitFor(() => container.querySelector('[data-mermaid-diagram] svg'))
    expect(diagram, 'the mermaid fence must be swapped for a diagram').not.toBeNull()
    expect(diagram?.textContent).toContain('MOCK-DIAGRAM')
    await unmount(root)
  })

  it('renders with the current scheme theme through the isolated renderer', async () => {
    const { root } = await renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```')
    await waitFor(() => renderDiagram.mock.calls.length > 0)
    expect(renderDiagram).toHaveBeenCalledWith(expect.stringContaining('graph TD'), 'default')
    await unmount(root)
  })

  it('shows a sized placeholder while the render is queued, then swaps it out', async () => {
    let release: ((svg: string) => void) | null = null
    setMermaidFrameRendererForTests(() => new Promise<string>((resolve) => { release = resolve }))
    const { container, root } = await renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```')
    const placeholder = await waitFor(() => container.querySelector<HTMLElement>('[data-mermaid-pending]'))
    expect(placeholder, 'a diagram placeholder is shown while the render is queued').not.toBeNull()
    expect(placeholder.style.minHeight, 'the placeholder reserves height so the article does not jump').not.toBe('')
    // The queue starts the render on the next idle slot; release it only after
    // the stub renderer was actually invoked.
    await waitFor(() => (release === null ? null : true))
    await act(async () => {
      release?.('<svg xmlns="http://www.w3.org/2000/svg"><text>LATE-DIAGRAM</text></svg>')
      await new Promise(resolve => { setTimeout(resolve, 30) })
    })
    await waitFor(() => container.querySelector('[data-mermaid-diagram] svg'))
    expect(container.querySelector('[data-mermaid-pending]'), 'the placeholder is gone once the diagram is in').toBeNull()
    await unmount(root)
  })

  it('falls back to the fence source when the renderer fails', async () => {
    setMermaidFrameRendererForTests(async () => { throw new Error('boom') })
    const { container, root } = await renderMarkdown('```mermaid\ngraph TD\n  A-->B\n```')
    const source = await waitFor(() => container.querySelector('pre code'))
    expect(source?.textContent, 'a failed render keeps the source visible').toContain('graph TD')
    expect(container.textContent, 'the mermaid error itself is shown, not only a generic label').toContain('boom')
    expect(container.querySelector('[data-mermaid-diagram]'), 'no diagram is injected for a failed render').toBeNull()
    await unmount(root)
  })

  it('drains every diagram of a multi-fence document', async () => {
    const text = [
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '',
      'prose between fences',
      '',
      '```mermaid',
      'graph LR',
      '  C --> D',
      '```',
      '',
      '```mermaid',
      'sequenceDiagram',
      '  A->>B: hi',
      '```',
    ].join('\n')
    const { container, root } = await renderMarkdown(text)
    await waitFor(() => container.querySelectorAll('[data-mermaid-diagram] svg').length >= 3 && true)
    expect(container.querySelectorAll('[data-mermaid-diagram] svg').length, 'every fence must render, none may stay a code block').toBe(3)
    await unmount(root)
  })

  it('resolves cross-fence reference-style links (single markdown parse)', async () => {
    const text = [
      '[before][shared]',
      '',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '',
      '[shared]: https://example.com',
    ].join('\n')
    const { container, root } = await renderMarkdown(text)
    const link = container.querySelector('a[href="https://example.com"]')
    expect(link, 'the definition after the fence must resolve the link before it').not.toBeNull()
    expect(link?.textContent).toContain('before')
    await waitFor(() => container.querySelector('[data-mermaid-diagram] svg'))
    expect(container.querySelector('[data-mermaid-diagram] svg'), 'the diagram must still swap in').not.toBeNull()
    await unmount(root)
  })

  it('leaves non-mermaid fences untouched', async () => {
    const { container, root } = await renderMarkdown('```ts\nconst a = 1\n```')
    expect(container.querySelector('[data-mermaid-diagram]'), 'no mermaid fence → no swap').toBeNull()
    expect(container.querySelectorAll('.md-code-block').length, 'the ts fence stays a code block').toBe(1)
    await unmount(root)
  })
})


/** Deterministic browser scheduling: no wall-clock sleeps, and observers fire
 * only when the spec moves a preview or diagram into/out of the viewport. */
describe('MermaidMarkdown render scheduling', () => {
  const roots = new Set<Root>()
  const observers: TestIntersectionObserver[] = []
  const idleCallbacks: IdleRequestCallback[] = []
  const visibleRect = new DOMRect(0, 0, 640, 480)
  const offscreenRect = new DOMRect(0, 10_000, 640, 240)
  let initiallyVisible = true
  let visibilityState: DocumentVisibilityState = 'visible'
  let now = 1000
  let originalColorScheme = ''

  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin: string
    readonly thresholds = [0]
    readonly targets = new Set<Element>()

    constructor(readonly callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.rootMargin = options?.rootMargin ?? '0px'
      observers.push(this)
    }

    observe(target: Element): void { this.targets.add(target) }
    unobserve(target: Element): void { this.targets.delete(target) }
    disconnect(): void { this.targets.clear() }
    takeRecords(): IntersectionObserverEntry[] { return [] }

    emit(target: Element, isIntersecting: boolean): void {
      this.callback([{
        target, isIntersecting, time: now,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: visibleRect,
        intersectionRect: isIntersecting ? visibleRect : new DOMRect(),
        rootBounds: visibleRect,
      }], this)
    }
  }

  const fences = (...names: string[]): string => names.map(name => (
    `\`\`\`mermaid\ngraph TD\n  ${name} --> End\n\`\`\``
  )).join('\n\n')

  async function mount(text: string): Promise<{ container: HTMLElement; root: Root }> {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.add(root)
    await act(async () => { root.render(createElement(MermaidMarkdown, { text, codeLabels })) })
    return { container, root }
  }

  async function intersect(target: Element, visible: boolean): Promise<void> {
    const observer = observers.find(candidate => candidate.targets.has(target))
    expect(observer, 'the target must have an active visibility observer').toBeDefined()
    await act(async () => { observer!.emit(target, visible) })
  }

  async function idle(): Promise<void> {
    const callback = idleCallbacks.shift()
    expect(callback, 'a queued render must have requested an idle slot').toBeDefined()
    await act(async () => { callback!({ didTimeout: false, timeRemaining: () => 50 }) })
  }

  async function advance(ms = 16): Promise<void> {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
  }

  async function setDocumentVisibility(state: DocumentVisibilityState): Promise<void> {
    await act(async () => {
      visibilityState = state
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  async function setDark(): Promise<void> {
    await act(async () => { document.body.setAttribute('data-ds-dark-theme', '') })
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    observers.length = 0
    idleCallbacks.length = 0
    initiallyVisible = true
    visibilityState = 'visible'
    now = 1000
    originalColorScheme = document.documentElement.style.colorScheme
    document.documentElement.style.colorScheme = 'light'
    document.body.removeAttribute('data-ds-dark-theme')
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
    vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
      idleCallbacks.push(callback)
      return idleCallbacks.length
    })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => visibilityState === 'hidden')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(offscreenRect)
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(() => (
      Object.assign(initiallyVisible ? [visibleRect] : [], {
        item: (index: number) => initiallyVisible && index === 0 ? visibleRect : null,
      })
    ))
  })

  afterEach(async () => {
    for (const root of roots) await unmount(root)
    roots.clear()
    resetMermaidRenderQueueForTests()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.documentElement.style.colorScheme = originalColorScheme
    document.body.removeAttribute('data-ds-dark-theme')
  })

  it('promotes an already queued diagram ahead of background work waiting for idle', async () => {
    const { container } = await mount(fences('First', 'Visible', 'Last'))
    const placeholders = container.querySelectorAll('[data-mermaid-pending]')
    expect(placeholders).toHaveLength(3)
    await intersect(placeholders[1]!.parentElement!, true)

    // The first idle wait belonged to First. Its stale priority must be
    // rechecked rather than starting it ahead of the newly visible diagram.
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    await idle()
    expect(renderDiagram).toHaveBeenNthCalledWith(1, expect.stringContaining('Visible --> End'), 'default')
    await advance()
    await idle()
    await advance()
    await idle()
    await advance()
    expect(renderDiagram.mock.calls.map(([code]) => code.match(/(\w+) --> End/)?.[1])).toEqual(['Visible', 'First', 'Last'])
    expect(idleCallbacks).toHaveLength(0)
    expect(container.querySelectorAll('[data-mermaid-diagram] svg')).toHaveLength(3)
  })

  it('promotes queued work during the scroll-quiet wait without warming background diagrams', async () => {
    window.dispatchEvent(new Event('scroll'))
    const { container } = await mount(fences('Background', 'Visible'))
    expect(idleCallbacks).toHaveLength(0)
    const placeholders = container.querySelectorAll('[data-mermaid-pending]')
    await intersect(placeholders[1]!.parentElement!, true)
    await advance(120)
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.stringContaining('Visible --> End'), 'default')
    await advance()
    expect(idleCallbacks).toHaveLength(0)
    now += 400
    await advance(120)
    await idle()
    expect(renderDiagram).toHaveBeenNthCalledWith(2, expect.stringContaining('Background --> End'), 'default')
  })

  it('keeps an initially hidden preview parked while another preview renders, then resumes it', async () => {
    initiallyVisible = false
    const hidden = await mount(fences('Hidden'))
    expect(idleCallbacks).toHaveLength(0)
    expect(renderDiagram).not.toHaveBeenCalled()

    initiallyVisible = true
    await mount(fences('Visible'))
    await idle()
    await advance()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.stringContaining('Visible --> End'), 'default')
    expect(hidden.container.querySelector('[data-mermaid-pending]')).not.toBeNull()

    await intersect(hidden.container.firstElementChild!, true)
    await idle()
    expect(renderDiagram).toHaveBeenNthCalledWith(2, expect.stringContaining('Hidden --> End'), 'default')
    expect(hidden.container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('rechecks preview visibility after an idle wait and resumes without losing the render', async () => {
    const { container } = await mount(fences('Paused'))
    await intersect(container.firstElementChild!, false)
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    expect(idleCallbacks).toHaveLength(0)
    await intersect(container.firstElementChild!, true)
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('pauses a hidden document, including during idle, and wakes on visibilitychange', async () => {
    visibilityState = 'hidden'
    const { container } = await mount(fences('Paused'))
    expect(idleCallbacks).toHaveLength(0)
    await setDocumentVisibility('visible')
    expect(idleCallbacks).toHaveLength(1)
    await setDocumentVisibility('hidden')
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    expect(idleCallbacks).toHaveLength(0)
    await setDocumentVisibility('visible')
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('drops a preview unmounted during an idle wait and still drains the next preview', async () => {
    const removed = await mount(fences('Removed'))
    await unmount(removed.root)
    roots.delete(removed.root)
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    expect(idleCallbacks).toHaveLength(0)
    const next = await mount(fences('Next'))
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.stringContaining('Next --> End'), 'default')
    expect(next.container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('replaces a queued old-theme generation instead of rendering it after the theme changes', async () => {
    const { container } = await mount(fences('Themed'))
    await setDark()
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram).toHaveBeenCalledWith(expect.stringContaining('Themed --> End'), 'dark')
    expect(container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('ignores an in-flight old-theme result and publishes only the current theme', async () => {
    let resolveOld: ((svg: string) => void) | undefined
    const renderer = vi.fn((_code: string, theme: MermaidTheme) => (
      theme === 'default'
        ? new Promise<string>(resolve => { resolveOld = resolve })
        : Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg"><text>CURRENT-THEME</text></svg>')
    ))
    setMermaidFrameRendererForTests(renderer)
    const { container } = await mount(fences('Themed'))
    await idle()
    expect(renderer).toHaveBeenCalledTimes(1)
    await setDark()
    await act(async () => {
      resolveOld!('<svg xmlns="http://www.w3.org/2000/svg"><text>STALE-THEME</text></svg>')
    })
    expect(container.textContent).not.toContain('STALE-THEME')
    expect(container.querySelector('[data-mermaid-pending]')).not.toBeNull()
    await advance()
    await idle()
    expect(renderer).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('CURRENT-THEME')
    expect(container.textContent).not.toContain('STALE-THEME')
  })

  it('discards queued source work when the document changes before the idle slot', async () => {
    const { container, root } = await mount(fences('OldSource'))
    await act(async () => { root.render(createElement(MermaidMarkdown, { text: fences('NewSource'), codeLabels })) })
    await idle()
    expect(renderDiagram).not.toHaveBeenCalled()
    await idle()
    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram).toHaveBeenCalledWith(expect.stringContaining('NewSource --> End'), 'default')
    expect(container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

  it('ignores an in-flight old-source result and renders the updated fence', async () => {
    let resolveOld: ((svg: string) => void) | undefined
    const renderer = vi.fn((code: string, _theme: MermaidTheme) => (
      code.includes('OldSource')
        ? new Promise<string>(resolve => { resolveOld = resolve })
        : Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg"><text>CURRENT-SOURCE</text></svg>')
    ))
    setMermaidFrameRendererForTests(renderer)
    const { container, root } = await mount(fences('OldSource'))
    await idle()
    await act(async () => { root.render(createElement(MermaidMarkdown, { text: fences('NewSource'), codeLabels })) })
    await act(async () => {
      resolveOld!('<svg xmlns="http://www.w3.org/2000/svg"><text>STALE-SOURCE</text></svg>')
    })
    expect(container.textContent).not.toContain('STALE-SOURCE')
    expect(container.querySelector('[data-mermaid-pending]')).not.toBeNull()
    await advance()
    await idle()
    expect(renderer).toHaveBeenCalledTimes(2)
    expect(renderer).toHaveBeenLastCalledWith(expect.stringContaining('NewSource --> End'), 'default')
    expect(container.textContent).toContain('CURRENT-SOURCE')
    expect(container.textContent).not.toContain('STALE-SOURCE')
  })

  it.each(['queued', 'rendered'] as const)('restores a normal code fence when a %s diagram changes language', async (state) => {
    const { container, root } = await mount(fences('Original'))
    if (state === 'rendered') {
      await idle()
      await advance()
    }
    const callsBeforeChange = renderDiagram.mock.calls.length
    await act(async () => {
      root.render(createElement(MermaidMarkdown, { text: '```text\nplain source\n```', codeLabels }))
    })
    if (state === 'queued') {
      await idle()
      await advance()
    }
    expect(container.querySelector('pre code')?.textContent).toBe('plain source')
    expect(container.querySelector('[data-mermaid-processed]')).toBeNull()
    expect(container.querySelector('[data-mermaid-pending]')).toBeNull()
    expect(container.querySelector('[data-mermaid-diagram]')).toBeNull()
    expect(renderDiagram).toHaveBeenCalledTimes(callsBeforeChange)

    // The restored React-owned source must remain usable for later edits.
    await act(async () => { root.render(createElement(MermaidMarkdown, { text: fences('Restored'), codeLabels })) })
    await idle()
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.stringContaining('Restored --> End'), 'default')
    expect(container.querySelector('[data-mermaid-diagram] svg')).not.toBeNull()
  })

})
