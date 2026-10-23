/** Local, runtime-only image drafts. Bytes cross the wire only when Send is pressed. */
import { type ImageAttachmentLimits, type PromptContentPart } from '../sidechat-images.ts';
export interface SidechatDraftImage {
    id: string;
    file: File;
    url: string;
}
/** Validate the whole selection before creating previews, preserving selection order. */
export declare function validateSidechatImages(files: readonly File[], existing: readonly SidechatDraftImage[], limits: ImageAttachmentLimits): void;
/** FileReader also works for pasted browser Files without arrayBuffer(). */
export declare function sidechatImagePart(file: File): Promise<PromptContentPart>;
