/** Shared image vocabulary and defensive projection of durable DSH image refs. */
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
export type { ImageAttachmentLimits, ImageAttachmentRef, ImageMediaType, PromptContentPart } from '@deepseek-ai/dsh-attachment';
export declare const SIDECHAT_IMAGE_TYPES: readonly ["image/png", "image/jpeg", "image/webp", "image/gif"];
/** Never turn arbitrary URLs or filesystem paths from a log into image sources. */
export declare function sidechatImages(content: unknown): ImageAttachmentRef[];
