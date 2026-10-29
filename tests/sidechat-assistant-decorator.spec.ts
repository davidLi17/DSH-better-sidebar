// @vitest-environment jsdom
/** Optional selection UI extensions use stable snapshots and cleanly detach. */
import { expect, it, vi } from 'vitest'
import { createBetterSidebarService } from '../src/client/service.ts'
import { createSidebarStore } from '../src/client/state.ts'

it('assistant decorators are optional, unique, observable and disposal-safe', () => {
  const service = createBetterSidebarService(createSidebarStore())
  const empty = service.getSidechatAssistantDecorators()
  expect(empty).toEqual([])
  expect(service.getSidechatAssistantDecorators()).toBe(empty)
  const changed = vi.fn()
  const off = service.subscribe(changed)
  const component = () => null
  const release = service.registerSidechatAssistantDecorator('lhg', component)
  const active = service.getSidechatAssistantDecorators()
  expect(active).toEqual([component])
  expect(service.getSidechatAssistantDecorators()).toBe(active)
  expect(changed).toHaveBeenCalledTimes(1)
  expect(() => service.registerSidechatAssistantDecorator('lhg', component)).toThrow()
  release()
  expect(service.getSidechatAssistantDecorators()).toEqual([])
  expect(changed).toHaveBeenCalledTimes(2)
  release()
  expect(changed).toHaveBeenCalledTimes(2)
  off()
})

it('the view only decorates visible assistant answers with source and parent identity', async () => {
  // Source-boundary regression: the view's remaining network/UI surfaces are
  // exercised by sidechat-view; actual selected DOM is covered by LHG's test.
  const { readFile } = await import('node:fs/promises')
  const source = await readFile('src/client/SideChatView.tsx', 'utf8')
  const assistant = source.slice(source.indexOf("    case 'assistant':"), source.indexOf("    case 'reasoning':"))
  expect(assistant).toContain('decorators.reduceRight')
  expect(assistant).toContain('parentSessionId={parentSessionId}')
  expect(assistant).toContain('threadId={threadId}')
  expect(assistant).toContain('seq={row.seq}')
  expect(assistant).toContain('JSON.stringify([parentSessionId, threadId, row.seq])')
  expect(source.match(/decorators\.reduceRight/g)).toHaveLength(1)
  expect(source).toContain('visible ? decorators : NO_ASSISTANT_DECORATORS')
  expect(source).not.toContain('data-chat-flow-kind')
})
