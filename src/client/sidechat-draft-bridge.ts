import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'

/** Optional cross-plugin handoff. This only edits a draft; it never sends. */
export interface SidechatDraftInput {
  sessionId: string
  text: string
  requestId?: string
  source?: string
}

interface DraftTarget {
  sessionId: string
  tabId: string
  visible: boolean
  append(text: string): void
}

// Only mounted composers are retained. Unmount removes its entry; no history,
// interval, child-session allocation, or second copy of the draft is kept here.
const targets = new Set<DraftTarget>()
let pending: { sessionId: string; text: string } | undefined

/** Reveal a mounted composer, or park one delivery until its tab mounts. */
export function deliverSidechatDraft(
  input: SidechatDraftInput,
  reveal: (tabId: string) => void,
  open: () => void,
): void {
  if (!input.sessionId || !input.text.trim()) throw new Error('A session and selected text are required')
  const candidates = [...targets].filter(target => target.sessionId === input.sessionId)
  const target = candidates.findLast(candidate => candidate.visible) ?? candidates.at(-1)
  if (target !== undefined) {
    reveal(target.tabId)
    target.append(input.text)
    return
  }
  if (pending !== undefined) {
    if (pending.sessionId !== input.sessionId) throw new Error('Another side chat is still opening; try again shortly')
    pending.text += `\n\n${input.text}`
    return
  }
  pending = { sessionId: input.sessionId, text: input.text }
  try {
    open()
  } catch (error) {
    pending = undefined
    throw error
  }
}

/** Mount the handoff receiver beside the existing composer, preserving images. */
export function useSidechatDraftBridge({ sessionId, tabId, visible, composer, setComposer, composerRef }: {
  sessionId: string
  tabId: string
  visible: boolean
  composer: string
  setComposer: Dispatch<SetStateAction<string>>
  composerRef: RefObject<HTMLTextAreaElement>
}): void {
  // Read the composer to keep the hook contract explicit; focus waits for the
  // actual textarea to mount (a freshly created thread first shows a hero).
  void composer
  const focusPending = useRef(false)
  const targetRef = useRef<DraftTarget>()
  useEffect(() => {
    const target: DraftTarget = {
      sessionId,
      tabId,
      visible: false,
      append(text) {
        focusPending.current = true
        setComposer(previous => previous ? `${previous}\n\n${text}` : text)
      },
    }
    targetRef.current = target
    targets.add(target)
    if (pending?.sessionId === sessionId) {
      const delivery = pending
      pending = undefined
      target.append(delivery.text)
    }
    return () => { targets.delete(target) }
  }, [sessionId, tabId, setComposer])

  useEffect(() => {
    const target = targetRef.current
    if (target !== undefined) {
      target.visible = visible
      if (visible) {
        // Most recently viewed composer wins when all tabs are parked.
        targets.delete(target)
        targets.add(target)
      }
    }
    const field = composerRef.current
    if (!visible || !focusPending.current || field === null) return
    focusPending.current = false
    field.focus()
    field.setSelectionRange(field.value.length, field.value.length)
    field.style.height = '0px'
    field.style.height = `${Math.min(field.scrollHeight, 132)}px`
    // Native open/expand uses flushSync then focuses its pane. Restore the
    // explicitly requested input focus after that synchronous host action.
    queueMicrotask(() => {
      if (target === undefined || !targets.has(target) || !target.visible || !field.isConnected) return
      field.focus()
      field.setSelectionRange(field.value.length, field.value.length)
    })
  })
}
