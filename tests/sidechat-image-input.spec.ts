/** Draft admission is atomic, and image-route JSON bounds preserve other API limits. */
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { validateSidechatImages, sidechatImagePart } from '../src/client/sidechat-image-input.ts'
import { readJsonBody } from '../src/wire.ts'
import type { SidebarHttpRequest } from '../src/context-types.ts'

const limits = { maxImageBytes: 6, maxMessageImageBytes: 9, maxImagesPerMessage: 2, maxImagePixels: 100, maxImageDimension: 10, mediaTypes: ['image/png' as const] }
const file = (size: number, type = 'image/png') => new File(['x'.repeat(size)], 'test.png', { type })

describe('sidechat draft image admission', () => {
  it('checks type, empty file, per-image bytes, aggregate bytes and count', () => {
    expect(() => validateSidechatImages([file(0)], [], limits)).toThrow('empty')
    expect(() => validateSidechatImages([file(1, 'image/svg+xml')], [], limits)).toThrow('PNG')
    expect(() => validateSidechatImages([file(7)], [], limits)).toThrow('limit')
    expect(() => validateSidechatImages([file(5), file(5)], [], limits)).toThrow('message limit')
    expect(() => validateSidechatImages([file(1), file(1)], [{ id: 'a', url: 'blob:a', file: file(1) }], limits)).toThrow('At most 2')
    expect(() => validateSidechatImages([file(4), file(5)], [], limits)).not.toThrow()
  })
  it('serializes bytes once as a native image part, without a data URL prefix', async () => {
    await expect(sidechatImagePart(new File(['abc'], 'shot.png', { type: 'image/png' }))).resolves.toEqual({ type: 'image', data: 'YWJj', mediaType: 'image/png', name: 'shot.png' })
  })
})

function request(body: string): SidebarHttpRequest {
  return { headers: {}, async *[Symbol.asyncIterator]() { yield body } }
}

describe('scoped image JSON body budget', () => {
  it('keeps ordinary requests at 1 MiB but permits explicitly bounded image bodies', async () => {
    const body = JSON.stringify({ content: 'x'.repeat((1 << 20) + 1) })
    await expect(readJsonBody(request(body))).rejects.toThrow('too large')
    await expect(readJsonBody(request(body), 2 << 20)).resolves.toHaveProperty('content')
    await expect(readJsonBody(request(body), body.length - 1)).rejects.toThrow('too large')
  })
})
