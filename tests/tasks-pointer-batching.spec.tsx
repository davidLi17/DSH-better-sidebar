/** Task detail surfaces coalesce pointer streams and preserve release/cancel positions. */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act } from 'react-dom/test-utils'
import { renderRoot, setupReactAct } from './test-utils.ts'
import { FloatingWindow } from '../src/client/FloatingWindow.tsx'
import { AnchoredPopover } from '../src/client/AnchoredPopover.tsx'

setupReactAct()
afterEach(() => { vi.unstubAllGlobals() })

function pointer(target: EventTarget, type: string, x: number, y: number): void {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }))
}

describe('task surface pointer batching', () => {
  it.each(['window', 'popover'] as const)('%s batches moves and flushes the final position on cancel', (kind) => {
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (key: number) => { frames.delete(key) })
    const anchor = document.createElement('div')
    document.body.append(anchor)
    const rendered = renderRoot(kind === 'window'
      ? createElement(FloatingWindow, { title: 'task', onClose: () => {}, children: 'body' })
      : createElement(AnchoredPopover, { anchor, draggable: true, onClose: () => {}, children: 'body' }))
    try {
      const frame = document.querySelector('[role="dialog"]') as HTMLElement
      const handle = kind === 'window' ? frame.querySelector('[data-window-handle]') as HTMLElement : frame
      const before = frame.style.left
      act(() => { pointer(handle, 'pointerdown', 100, 100) })
      for (let step = 1; step <= 20; step += 1) {
        act(() => { pointer(window, 'pointermove', 100 + step, 100 + step) })
      }
      expect(frame.style.left, 'moves wait for the frame').toBe(before)
      expect(frames.size).toBe(1)
      act(() => {
        const pending = [...frames.values()]
        frames.clear()
        for (const callback of pending) callback(performance.now())
      })
      expect(Number.parseFloat(frame.style.left)).toBe(Number.parseFloat(before) + 20)
      act(() => { pointer(window, 'pointermove', 130, 130) })
      act(() => { pointer(window, 'pointercancel', 130, 130) })
      expect(Number.parseFloat(frame.style.left)).toBe(Number.parseFloat(before) + 30)
      expect(frames.size).toBe(0)
    } finally {
      act(() => { pointer(window, 'pointerup', 130, 130) })
      rendered.unmount()
      anchor.remove()
    }
  })
})
