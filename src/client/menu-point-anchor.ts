/** Context-menu positioning: rc.1 reads getAnchorRect, rc.2 reads anchorPoint.
 * Both hosts destructure known props without forwarding extras to the DOM. */
export function menuPointAnchor(point: { x: number; y: number } | null) {
  return {
    anchorPoint: point ?? undefined,
    getAnchorRect: (): DOMRect | null => point === null ? null : new DOMRect(point.x, point.y, 0, 0),
  }
}
