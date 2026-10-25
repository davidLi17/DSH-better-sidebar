/**
 * The iframe is an opaque-origin transport, not an error boundary for the
 * entire document: authenticate replies, retry only infrastructure failures,
 * and remove asynchronous work when a frame is replaced or disposed.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderMermaidDiagram, resetMermaidFrameForTests } from '../src/client/mermaid-frame.ts'

const createObjectURL = vi.fn()
const revokeObjectURL = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  createObjectURL.mockReset()
  revokeObjectURL.mockReset()
  let sequence = 0
  createObjectURL.mockImplementation(() => `blob:mermaid-test-${++sequence}`)
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createObjectURL
    static revokeObjectURL = revokeObjectURL
  })
  document.body.innerHTML = ''
})

afterEach(() => {
  resetMermaidFrameForTests()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function currentFrame(): HTMLIFrameElement {
  const iframe = document.querySelector('iframe')
  if (iframe === null) throw new Error('expected a rendering frame')
  return iframe
}

function message(iframe: HTMLIFrameElement, data: object, source: MessageEventSource | null = iframe.contentWindow): void {
  window.dispatchEvent(new MessageEvent('message', { source, data, origin: 'null' }))
}

async function ready(iframe = currentFrame()) {
  const target = iframe.contentWindow
  if (target === null) throw new Error('expected a frame window')
  const post = vi.spyOn(target, 'postMessage').mockImplementation(() => {})
  message(iframe, { type: 'mermaid-frame-ready' })
  await Promise.resolve()
  return { iframe, post }
}

function requestId(post: Awaited<ReturnType<typeof ready>>['post'], index = 0): number {
  const request = post.mock.calls[index]?.[0] as { id?: number } | undefined
  if (request?.id === undefined) throw new Error('expected a render request')
  return request.id
}

describe('mermaid frame transport', () => {
  it('keeps an opaque sandbox and reuses the healthy frame after a diagram parse error', async () => {
    const bad = renderMermaidDiagram('not mermaid', 'default').catch((error: unknown) => error)
    const { iframe, post } = await ready()
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
    message(iframe, { type: 'mermaid-error', id: requestId(post), message: 'Parse error on line 1' })
    expect(await bad).toEqual(expect.objectContaining({ message: 'Parse error on line 1' }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    const good = renderMermaidDiagram('graph TD; A-->B', 'dark')
    await Promise.resolve()
    message(iframe, { type: 'mermaid-result', id: requestId(post, 1), svg: '<svg>valid</svg>' })
    await expect(good).resolves.toBe('<svg>valid</svg>')
    expect(currentFrame()).toBe(iframe)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ignores readiness, errors and results from any other window', async () => {
    const result = renderMermaidDiagram('graph TD; A-->B', 'default')
    const iframe = currentFrame()
    const target = iframe.contentWindow!
    const post = vi.spyOn(target, 'postMessage').mockImplementation(() => {})
    message(iframe, { type: 'mermaid-frame-ready' }, window)
    await Promise.resolve()
    expect(post).not.toHaveBeenCalled()
    message(iframe, { type: 'mermaid-frame-ready' })
    await Promise.resolve()
    const id = requestId(post)
    message(iframe, { type: 'mermaid-error', id, message: 'forged' }, window)
    message(iframe, { type: 'mermaid-result', id, svg: '<svg>forged</svg>' }, window)
    expect(vi.getTimerCount()).toBe(1)
    message(iframe, { type: 'mermaid-result', id, svg: '<svg>real</svg>' })
    await expect(result).resolves.toBe('<svg>real</svg>')
  })

  it('retries a failed load with a new frame and revokes the old blob', async () => {
    const result = renderMermaidDiagram('graph TD; A-->B', 'default')
    const first = currentFrame()
    const oldWindow = first.contentWindow
    await vi.advanceTimersByTimeAsync(10_000)
    const { iframe, post } = await ready()
    expect(iframe).not.toBe(first)
    expect(first.isConnected).toBe(false)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mermaid-test-1')
    const id = requestId(post)
    message(iframe, { type: 'mermaid-result', id, svg: '<svg>stale</svg>' }, oldWindow)
    expect(vi.getTimerCount()).toBe(1)
    message(iframe, { type: 'mermaid-result', id, svg: '<svg>retry</svg>' })
    await expect(result).resolves.toBe('<svg>retry</svg>')
  })

  it('fails fast after two load failures without leaving timers or frames behind', async () => {
    const failure = renderMermaidDiagram('graph TD; A-->B', 'default').catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(await failure).toEqual(expect.objectContaining({ message: 'mermaid frame did not become ready' }))
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(document.querySelector('iframe')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    await expect(renderMermaidDiagram('graph TD; B-->C', 'default')).rejects.toThrow('unavailable')
    expect(createObjectURL).toHaveBeenCalledTimes(2)
  })

  it('does not disable later diagrams when one diagram times out twice', async () => {
    const failure = renderMermaidDiagram('expensive diagram', 'default').catch((error: unknown) => error)
    await ready()
    await vi.advanceTimersByTimeAsync(30_000)
    await ready()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await failure).toEqual(expect.objectContaining({ message: 'mermaid frame render timed out' }))
    expect(document.querySelector('iframe')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)

    const good = renderMermaidDiagram('graph TD; A-->B', 'default')
    const { iframe, post } = await ready()
    message(iframe, { type: 'mermaid-result', id: requestId(post), svg: '<svg>healthy</svg>' })
    await expect(good).resolves.toBe('<svg>healthy</svg>')
  })

  it('cleans up a synchronous blob creation failure before retrying', async () => {
    createObjectURL.mockImplementationOnce(() => { throw new Error('blob creation failed') })
    const result = renderMermaidDiagram('graph TD; A-->B', 'default')
    await vi.advanceTimersByTimeAsync(0)
    const { iframe, post } = await ready()
    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(1)
    message(iframe, { type: 'mermaid-result', id: requestId(post), svg: '<svg>retry</svg>' })
    await expect(result).resolves.toBe('<svg>retry</svg>')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cleans up synchronous postMessage failures before replacing the frame', async () => {
    const result = renderMermaidDiagram('graph TD; A-->B', 'default')
    const first = currentFrame()
    vi.spyOn(first.contentWindow!, 'postMessage').mockImplementation(() => { throw new Error('post failed') })
    message(first, { type: 'mermaid-frame-ready' })
    await vi.advanceTimersByTimeAsync(0)
    const { iframe, post } = await ready()
    expect(first.isConnected).toBe(false)
    expect(vi.getTimerCount()).toBe(1)
    message(iframe, { type: 'mermaid-result', id: requestId(post), svg: '<svg>retry</svg>' })
    await expect(result).resolves.toBe('<svg>retry</svg>')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels readiness and all pending requests on disposal without recreating a frame', async () => {
    const loading = renderMermaidDiagram('first', 'default').catch((error: unknown) => error)
    resetMermaidFrameForTests()
    expect(await loading).toEqual(expect.objectContaining({ message: 'mermaid frame disposed' }))
    expect(vi.getTimerCount()).toBe(0)

    const first = renderMermaidDiagram('first', 'default').catch((error: unknown) => error)
    const second = renderMermaidDiagram('second', 'default').catch((error: unknown) => error)
    await ready()
    expect(vi.getTimerCount()).toBe(2)
    resetMermaidFrameForTests()
    for (const result of await Promise.all([first, second])) {
      expect(result).toEqual(expect.objectContaining({ message: 'mermaid frame disposed' }))
    }
    expect(vi.getTimerCount()).toBe(0)
    expect(document.querySelector('iframe')).toBeNull()
    expect(createObjectURL).toHaveBeenCalledTimes(2)
  })
})
