/**
 * Client half of the isolated mermaid renderer.
 *
 * Mermaid sizes every label with `SVGElement.getBBox()`. In the live DSH
 * window one such measurement costs ~60-75ms (the document is large and
 * style-heavy, and the measurement node is appended to its body), so a single
 * diagram takes seconds and a document with dozens of them keeps the renderer
 * busy for minutes — long enough for the desktop shell's surface watchdog to
 * kill the page. An iframe has its own small layout tree: the same measurement
 * costs ~1ms, so diagrams render in milliseconds and the host window never
 * blocks.
 *
 * The frame is self-contained (the mermaid UMD bundle and protocol are inlined
 * by scripts/build-mermaid-frame-asset.mjs) and sandboxed WITHOUT
 * `allow-same-origin`: it runs only our own rendering code, cannot touch the
 * GUI document, and needs no host route. It is created lazily on the first
 * diagram and reused for every following render on the page.
 */
import { MERMAID_FRAME_HTML } from './mermaid-frame-asset.generated.ts'

export type MermaidTheme = 'dark' | 'default'

/** Frame viewport width: the empty document diagrams are laid out against. */
const FRAME_WIDTH = 1200
const FRAME_HEIGHT = 900
const FRAME_READY_TIMEOUT_MS = 10_000
const FRAME_RENDER_TIMEOUT_MS = 30_000

/** One pending render waiting on this frame's postMessage answer. */
interface PendingRender {
  resolve: (svg: string) => void
  reject: (error: Error) => void
  timer: number
}

interface MermaidFrame {
  iframe: HTMLIFrameElement
  ready: Promise<void>
  rejectReady: (error: Error) => void
  readyTimer: number | undefined
  objectUrl: string | null
  onMessage: (event: MessageEvent) => void
  pending: Map<number, PendingRender>
  disposed: boolean
}

/** Diagram errors are expected input failures, not a broken rendering frame. */
class MermaidDiagramError extends Error {}

/** Preserve the failed frame's identity so a late failure cannot remove its replacement. */
class MermaidFrameError extends Error {
  constructor(message: string, readonly kind: 'load' | 'render' | 'disposed', readonly owner: MermaidFrame | null) {
    super(message)
  }
}

let requestSeq = 0
let frame: MermaidFrame | null = null
/** Only repeated load failures disable the renderer. A bad or slow diagram must not. */
let frameUnavailable = false

/** Test seam: jsdom cannot run the real frame asset, so specs replace the
 * renderer with a stub. `null` restores the real one. */
let testRenderer: ((code: string, theme: MermaidTheme) => Promise<string>) | null = null
export function setMermaidFrameRendererForTests(
  renderer: ((code: string, theme: MermaidTheme) => Promise<string>) | null,
): void {
  testRenderer = renderer
}

/** Drop exactly one frame, including its listeners, timers and pending work. */
function disposeFrame(owner: MermaidFrame, error: MermaidFrameError): void {
  if (owner.disposed) return
  owner.disposed = true
  if (frame === owner) frame = null
  window.removeEventListener('message', owner.onMessage)
  if (owner.readyTimer !== undefined) window.clearTimeout(owner.readyTimer)
  owner.readyTimer = undefined
  owner.rejectReady(error)
  for (const entry of owner.pending.values()) {
    window.clearTimeout(entry.timer)
    entry.reject(error)
  }
  owner.pending.clear()
  owner.iframe.remove()
  if (owner.objectUrl !== null) URL.revokeObjectURL(owner.objectUrl)
  owner.objectUrl = null
}

/** Reset transport state and detach all asynchronous work between protocol specs. */
export function resetMermaidFrameForTests(): void {
  if (frame !== null) disposeFrame(frame, new MermaidFrameError('mermaid frame disposed', 'disposed', frame))
  frameUnavailable = false
  testRenderer = null
}

/** Create the hidden frame and resolve once its protocol posted `ready`. */
function ensureFrame(): MermaidFrame {
  if (frame !== null) return frame
  const iframe = document.createElement('iframe')
  // Opaque-origin sandbox: the frame cannot use the host origin's APIs.
  // postMessage is the only bridge; never add allow-same-origin here.
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${FRAME_WIDTH}px;height:${FRAME_HEIGHT}px;border:0;visibility:hidden;pointer-events:none`
  let resolveReady!: () => void
  let rejectReady!: (error: Error) => void
  const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
  const owner: MermaidFrame = {
    iframe, ready, rejectReady, readyTimer: undefined, objectUrl: null,
    onMessage, pending: new Map(), disposed: false,
  }
  frame = owner

  function onMessage(event: MessageEvent): void {
    // Opaque-origin messages have origin "null", so authenticate the exact
    // sending WindowProxy instead. Other frames and stale frames cannot reply.
    if (owner.disposed || event.source !== iframe.contentWindow) return
    const data = event.data as { type?: unknown; id?: unknown; svg?: unknown; message?: unknown } | null
    if (data === null || typeof data !== 'object') return
    if (data.type === 'mermaid-frame-ready') {
      if (owner.readyTimer !== undefined) window.clearTimeout(owner.readyTimer)
      owner.readyTimer = undefined
      resolveReady()
      return
    }
    if (data.type !== 'mermaid-result' && data.type !== 'mermaid-error') return
    if (typeof data.id !== 'number') return
    const entry = owner.pending.get(data.id)
    if (entry === undefined) return
    owner.pending.delete(data.id)
    window.clearTimeout(entry.timer)
    if (data.type === 'mermaid-result' && typeof data.svg === 'string') entry.resolve(data.svg)
    else if (data.type === 'mermaid-error') {
      entry.reject(new MermaidDiagramError(typeof data.message === 'string' ? data.message : 'mermaid diagram render failed'))
    } else {
      entry.reject(new MermaidFrameError('mermaid frame returned an invalid result', 'render', owner))
    }
  }

  owner.readyTimer = window.setTimeout(() => {
    disposeFrame(owner, new MermaidFrameError('mermaid frame did not become ready', 'load', owner))
  }, FRAME_READY_TIMEOUT_MS)
  window.addEventListener('message', onMessage)
  try {
    owner.objectUrl = URL.createObjectURL(new Blob([MERMAID_FRAME_HTML], { type: 'text/html' }))
    iframe.src = owner.objectUrl
    document.body.appendChild(iframe)
  } catch (error) {
    // Blob creation or DOM insertion may fail synchronously (CSP/platform).
    // Cancel readiness too, rather than retaining a rejected cached promise.
    disposeFrame(owner, new MermaidFrameError(
      `mermaid frame could not load: ${error instanceof Error ? error.message : String(error)}`, 'load', owner,
    ))
  }
  return owner
}

/** Ask the frame to render one diagram and resolve with the raw SVG markup. */
async function renderInFrame(code: string, theme: MermaidTheme): Promise<string> {
  const owner = ensureFrame()
  await owner.ready
  const target = owner.iframe.contentWindow
  if (owner.disposed || target === null) throw new MermaidFrameError('mermaid frame disappeared', 'render', owner)
  const id = ++requestSeq
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      owner.pending.delete(id)
      reject(new MermaidFrameError('mermaid frame render timed out', 'render', owner))
    }, FRAME_RENDER_TIMEOUT_MS)
    owner.pending.set(id, { resolve, reject, timer })
    try {
      target.postMessage({ type: 'mermaid-render', id, code, theme }, '*')
    } catch (error) {
      owner.pending.delete(id)
      window.clearTimeout(timer)
      reject(new MermaidFrameError(
        `mermaid frame message failed: ${error instanceof Error ? error.message : String(error)}`, 'render', owner,
      ))
    }
  })
}

/**
 * Render one mermaid diagram off the host document's layout.
 * @param code - the diagram source (one fenced block body).
 * @param theme - mermaid theme to render with (follows the color scheme).
 * @returns the raw SVG markup (sanitized by the caller before injection).
 */
export async function renderMermaidDiagram(code: string, theme: MermaidTheme): Promise<string> {
  if (testRenderer !== null) return testRenderer(code, theme)
  if (frameUnavailable) throw new Error('mermaid rendering frame is unavailable')
  let loadFailures = 0
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await renderInFrame(code, theme)
    } catch (error) {
      // Syntax/input failures are final for this fence only. Retrying them
      // cannot help and must never poison subsequent valid diagrams.
      if (!(error instanceof MermaidFrameError) || error.kind === 'disposed') throw error
      if (error.owner !== null) disposeFrame(error.owner, error)
      if (error.kind === 'load') loadFailures += 1
      if (attempt === 0) continue
      // A pathological diagram can time out even in an otherwise healthy
      // frame. Only two failed loads establish that the renderer is unavailable.
      if (loadFailures === 2) frameUnavailable = true
      throw error
    }
  }
  throw new Error('mermaid rendering frame is unavailable')
}
