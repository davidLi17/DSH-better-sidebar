/**
 * rc.1 nests its child menu; rc.2 portals it to body. Neither version links
 * the child panel with aria-controls. These single-menu harnesses identify
 * the child by excluding the clicked parent's own menu, and fail rather than
 * accidentally including parent rows or choosing among unrelated panels.
 */
export function submenuItems<T extends HTMLElement = HTMLElement>(parent: HTMLElement): T[] {
  const root = parent.closest('[role="menu"]')
  if (parent.getAttribute('aria-haspopup') !== 'menu' || root === null) {
    throw new Error('expected a submenu trigger inside its root menu')
  }
  const panels = [...document.querySelectorAll<HTMLElement>('[role="menu"]')]
    .filter(menu => menu !== root)
  if (panels.length !== 1) throw new Error(`expected one child menu, found ${panels.length}`)
  const panel = panels[0]!
  return [...panel.querySelectorAll<T>('[role="menuitem"]')]
    .filter(item => item.closest('[role="menu"]') === panel && !item.hasAttribute('data-menu-back'))
}
