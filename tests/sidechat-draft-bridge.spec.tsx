// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { useRef, useState } from 'react'
import { act } from 'react-dom/test-utils'
import { renderRoot, setupReactAct } from './test-utils.ts'
import { deliverSidechatDraft, useSidechatDraftBridge } from '../src/client/sidechat-draft-bridge.ts'

setupReactAct()

function Composer({ sessionId, tabId = 'tab', visible = true, initial = '' }: {
  sessionId: string; tabId?: string; visible?: boolean; initial?: string
}) {
  const [composer, setComposer] = useState(initial)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  useSidechatDraftBridge({ sessionId, tabId, visible, composer, setComposer, composerRef })
  return <><textarea ref={composerRef} value={composer} readOnly /><img alt="existing attachment" src="data:image/png;base64,YQ==" /></>
}

describe('sidechat selected-text draft handoff', () => {
  it('reveals the same tab twice, appends to the existing draft, and focuses at end without sending', () => {
    const view = renderRoot(<Composer sessionId="parent" initial="My draft" />)
    const reveal = vi.fn()
    const open = vi.fn()
    act(() => {
      deliverSidechatDraft({ sessionId: 'parent', text: 'First selection' }, reveal, open)
      deliverSidechatDraft({ sessionId: 'parent', text: 'Second selection' }, reveal, open)
    })
    const field = view.container.querySelector('textarea')!
    expect(field.value).toBe('My draft\n\nFirst selection\n\nSecond selection')
    expect(reveal.mock.calls).toEqual([['tab'], ['tab']])
    expect(open).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe(field.value.length)
    expect(view.container.querySelector('img')).not.toBeNull()
    view.unmount()
  })

  it('opens once while mounting, consumes pending text once, and stays scoped to its parent', () => {
    const other = renderRoot(<Composer sessionId="other" initial="Leave me alone" />)
    const open = vi.fn()
    deliverSidechatDraft({ sessionId: 'new-parent', text: 'First' }, vi.fn(), open)
    deliverSidechatDraft({ sessionId: 'new-parent', text: 'Second' }, vi.fn(), open)
    expect(open).toHaveBeenCalledTimes(1)
    const view = renderRoot(<Composer sessionId="new-parent" />)
    expect(view.container.querySelector('textarea')!.value).toBe('First\n\nSecond')
    view.rerender(<Composer sessionId="new-parent" visible={false} />)
    view.rerender(<Composer sessionId="new-parent" />)
    expect(view.container.querySelector('textarea')!.value).toBe('First\n\nSecond')
    expect(other.container.querySelector('textarea')!.value).toBe('Leave me alone')
    view.unmount()
    other.unmount()
  })

  it('prefers the current visible side chat and focuses after a hidden tab is revealed', () => {
    const older = renderRoot(<Composer sessionId="many" tabId="old" visible={false} />)
    const current = renderRoot(<Composer sessionId="many" tabId="current" />)
    const reveal = vi.fn()
    act(() => deliverSidechatDraft({ sessionId: 'many', text: 'Current' }, reveal, vi.fn()))
    expect(reveal).toHaveBeenCalledWith('current')
    expect(older.container.querySelector('textarea')!.value).toBe('')
    current.rerender(<Composer sessionId="many" tabId="current" visible={false} />)
    act(() => deliverSidechatDraft({ sessionId: 'many', text: 'Again' }, reveal, vi.fn()))
    current.rerender(<Composer sessionId="many" tabId="current" />)
    const field = current.container.querySelector('textarea')!
    expect(field.value).toBe('Current\n\nAgain')
    expect(document.activeElement).toBe(field)
    older.unmount()
    current.unmount()
  })
})
