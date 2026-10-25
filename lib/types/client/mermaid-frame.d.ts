export type MermaidTheme = 'dark' | 'default';
export declare function setMermaidFrameRendererForTests(renderer: ((code: string, theme: MermaidTheme) => Promise<string>) | null): void;
/** Reset transport state and detach all asynchronous work between protocol specs. */
export declare function resetMermaidFrameForTests(): void;
/**
 * Render one mermaid diagram off the host document's layout.
 * @param code - the diagram source (one fenced block body).
 * @param theme - mermaid theme to render with (follows the color scheme).
 * @returns the raw SVG markup (sanitized by the caller before injection).
 */
export declare function renderMermaidDiagram(code: string, theme: MermaidTheme): Promise<string>;
