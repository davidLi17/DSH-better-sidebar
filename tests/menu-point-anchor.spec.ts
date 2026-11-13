/** Both host menu APIs receive the same context-menu coordinates. */
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { menuPointAnchor } from '../src/client/menu-point-anchor.ts'

describe('menuPointAnchor', () => {
  it('provides rc.2 coordinates and an equivalent zero-sized rc.1 rect', () => {
    const point = { x: -12, y: 345 }
    const props = menuPointAnchor(point)
    expect(props.anchorPoint).toBe(point)
    expect(props.getAnchorRect()).toBeInstanceOf(DOMRect)
    expect(props.getAnchorRect()).toMatchObject({ x: -12, y: 345, width: 0, height: 0 })
  })
  it('leaves no point or rect when closed', () => {
    const props = menuPointAnchor(null)
    expect(props.anchorPoint).toBeUndefined()
    expect(props.getAnchorRect()).toBeNull()
  })
})
