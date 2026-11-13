/**
 * jsdom has no layout engine or ResizeObserver. Supply only the lifecycle
 * surface needed by host menus; geometry/resize tests keep their own mocks.
 * Real resize and submenu positioning remain covered by browser tests.
 */
export function installMissingResizeObserver(target: { ResizeObserver?: typeof ResizeObserver }): void {
  if (target.ResizeObserver !== undefined) return
  target.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}
