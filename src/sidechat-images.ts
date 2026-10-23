/** Shared image vocabulary and defensive projection of durable DSH image refs. */
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
export type { ImageAttachmentLimits, ImageAttachmentRef, ImageMediaType, PromptContentPart } from '@deepseek-ai/dsh-attachment'

export const SIDECHAT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** Never turn arbitrary URLs or filesystem paths from a log into image sources. */
export function sidechatImages(content: unknown): ImageAttachmentRef[] {
  if (!Array.isArray(content)) return []
  const images: ImageAttachmentRef[] = []
  for (const block of content) {
    if (block === null || typeof block !== 'object' || block.type !== 'image') continue
    const ref = block.attachment as ImageAttachmentRef | undefined
    if (ref === undefined || ref === null || typeof ref !== 'object'
      || typeof ref.attachmentId !== 'string' || ref.attachmentId === ''
      || !SIDECHAT_IMAGE_TYPES.includes(ref.mediaType)
      || !Number.isSafeInteger(ref.bytes) || ref.bytes <= 0
      || !Number.isSafeInteger(ref.width) || ref.width <= 0
      || !Number.isSafeInteger(ref.height) || ref.height <= 0) continue
    images.push({ attachmentId: ref.attachmentId, mediaType: ref.mediaType,
      bytes: ref.bytes, width: ref.width, height: ref.height,
      ...(typeof ref.name === 'string' ? { name: ref.name } : {}) })
  }
  return images
}
