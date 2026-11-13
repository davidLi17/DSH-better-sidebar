// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { submenuItems } from './submenu-items'

afterEach(() => { document.body.innerHTML = '' })

describe('submenu item locator', () => {
  for (const portaled of [false, true]) {
    it(`selects only child actions in ${portaled ? 'portaled' : 'nested'} menus`, () => {
      document.body.innerHTML = '<div role="menu"><button role="menuitem" aria-haspopup="menu">Open with</button><button role="menuitem">Parent action</button></div>'
      const root = document.querySelector<HTMLElement>('[role="menu"]')!
      const trigger = root.querySelector<HTMLElement>('[aria-haspopup]')!
      const panel = document.createElement('div')
      panel.setAttribute('role', 'menu')
      panel.innerHTML = '<button role="menuitem" data-menu-back>Back</button><button role="menuitem">VS Code</button>'
      ;(portaled ? document.body : root).append(panel)
      expect(submenuItems(trigger).map(item => item.textContent)).toEqual(['VS Code'])
      const other = document.createElement('div')
      other.setAttribute('role', 'menu')
      document.body.append(other)
      expect(() => submenuItems(trigger)).toThrow('expected one child menu, found 2')
      panel.remove()
      other.remove()
      expect(() => submenuItems(trigger)).toThrow('expected one child menu, found 0')
    })
  }
})
