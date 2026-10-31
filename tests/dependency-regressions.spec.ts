/** Regression coverage for the selected CodeMirror patch updates, not a
 * second editor implementation. Uses the same dependency instances as the
 * sidebar's TextEditor and preserves multi-selection/undo behavior. */
import { describe, expect, it } from 'vitest'
import { EditorSelection, EditorState } from '@codemirror/state'
import { history, undo } from '@codemirror/commands'

describe('CodeMirror dependency regressions', () => {
  it('associates a replacement cursor with its inserted text', () => {
    const state = EditorState.create({ doc: 'abc', selection: { anchor: 1, head: 2 } })
    const next = state.update(state.replaceSelection('中文')).state
    expect(next.doc.toString()).toBe('a中文c')
    expect(next.selection.main.head).toBe(3)
    expect(next.selection.main.assoc).toBe(-1)
  })

  it('keeps multi-cursor replacement and undo on one compatible state instance', () => {
    let state = EditorState.create({
      doc: 'ab cd',
      selection: EditorSelection.create([EditorSelection.range(0, 2), EditorSelection.range(3, 5)]),
      extensions: [EditorState.allowMultipleSelections.of(true), history()],
    })
    state = state.update(state.replaceSelection('中')).state
    expect(state.doc.toString()).toBe('中 中')
    expect(state.selection.ranges.map(range => range.head)).toEqual([1, 3])
    expect(state.selection.ranges.every(range => range.assoc === -1)).toBe(true)
    expect(undo({ state, dispatch: transaction => { state = transaction.state } })).toBe(true)
    expect(state.doc.toString()).toBe('ab cd')
  })
})
