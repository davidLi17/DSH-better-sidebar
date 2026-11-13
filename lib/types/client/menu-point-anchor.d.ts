/** Context-menu positioning: rc.1 reads getAnchorRect, rc.2 reads anchorPoint.
 * Both hosts destructure known props without forwarding extras to the DOM. */
export declare function menuPointAnchor(point: {
    x: number;
    y: number;
} | null): {
    anchorPoint: {
        x: number;
        y: number;
    } | undefined;
    getAnchorRect: () => DOMRect | null;
};
