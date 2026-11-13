import { describe, expect, it } from 'vitest'
import { installMissingResizeObserver } from './setup-resize-observer'

describe('jsdom ResizeObserver fallback', () => {
  it('supplies the missing lifecycle API without fabricating resize events', () => {
    const target: { ResizeObserver?: typeof ResizeObserver } = {}
    installMissingResizeObserver(target)
    let callbacks = 0
    const observer = new target.ResizeObserver!(() => { callbacks++ })
    expect(() => {
      observer.observe({} as Element)
      observer.unobserve({} as Element)
      observer.disconnect()
    }).not.toThrow()
    expect(callbacks).toBe(0)
    const installed = target.ResizeObserver
    installMissingResizeObserver(target)
    expect(target.ResizeObserver).toBe(installed)
  })

  it('preserves an existing native implementation or suite mock', () => {
    const existing = class implements ResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    const target = { ResizeObserver: existing }
    installMissingResizeObserver(target)
    expect(target.ResizeObserver).toBe(existing)
  })
})
