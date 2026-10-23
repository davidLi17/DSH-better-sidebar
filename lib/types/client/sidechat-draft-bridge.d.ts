import { type Dispatch, type RefObject, type SetStateAction } from 'react';
/** Optional cross-plugin handoff. This only edits a draft; it never sends. */
export interface SidechatDraftInput {
    sessionId: string;
    text: string;
    requestId?: string;
    source?: string;
}
/** Reveal a mounted composer, or park one delivery until its tab mounts. */
export declare function deliverSidechatDraft(input: SidechatDraftInput, reveal: (tabId: string) => void, open: () => void): void;
/** Mount the handoff receiver beside the existing composer, preserving images. */
export declare function useSidechatDraftBridge({ sessionId, tabId, visible, composer, setComposer, composerRef }: {
    sessionId: string;
    tabId: string;
    visible: boolean;
    composer: string;
    setComposer: Dispatch<SetStateAction<string>>;
    composerRef: RefObject<HTMLTextAreaElement>;
}): void;
