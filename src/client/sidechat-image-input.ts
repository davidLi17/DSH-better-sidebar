/** Local, runtime-only image drafts. Bytes cross the wire only when Send is pressed. */
import { SIDECHAT_IMAGE_TYPES, type ImageAttachmentLimits, type ImageMediaType, type PromptContentPart } from '../sidechat-images.ts'

export interface SidechatDraftImage { id: string; file: File; url: string }

/** Validate the whole selection before creating previews, preserving selection order. */
export function validateSidechatImages(files: readonly File[], existing: readonly SidechatDraftImage[], limits: ImageAttachmentLimits): void {
  const all = [...existing.map(image => image.file), ...files]
  if (all.length > limits.maxImagesPerMessage) throw new Error(`At most ${limits.maxImagesPerMessage} images per message`)
  for (const file of files) {
    if (!SIDECHAT_IMAGE_TYPES.includes(file.type as ImageMediaType) || !limits.mediaTypes.includes(file.type as ImageMediaType)) {
      throw new Error('Use PNG, JPEG, WebP or GIF images')
    }
    if (file.size === 0) throw new Error(`Image is empty: ${file.name}`)
    if (file.size > limits.maxImageBytes) throw new Error(`Image exceeds the ${Math.floor(limits.maxImageBytes / 1024 / 1024)} MiB limit: ${file.name}`)
  }
  if (all.reduce((bytes, file) => bytes + file.size, 0) > limits.maxMessageImageBytes) {
    throw new Error(`Images exceed the ${Math.floor(limits.maxMessageImageBytes / 1024 / 1024)} MiB message limit`)
  }
}

/** FileReader also works for pasted browser Files without arrayBuffer(). */
export function sidechatImagePart(file: File): Promise<PromptContentPart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => { reject(new Error(`Could not read image: ${file.name}`)) }
    reader.onabort = () => { reject(new Error(`Image read cancelled: ${file.name}`)) }
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result.split(',')[1] : undefined
      if (data === undefined) reject(new Error(`Could not read image: ${file.name}`))
      else resolve({ type: 'image', mediaType: file.type as ImageMediaType, data, name: file.name })
    }
    reader.readAsDataURL(file)
  })
}
