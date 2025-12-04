/**
 * Custom Markdown Parser
 * Supports: New lines, Bold text (**text**), and Code blocks (`code`)
 */

export interface ParsedElement {
    type: 'text' | 'bold' | 'code' | 'newline';
    content: string;
}

/**
 * Parse markdown text into structured elements
 * @param text - The markdown text to parse
 * @returns Array of parsed elements
 */
export function parseMarkdown(text: string): ParsedElement[] {
    const elements: ParsedElement[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
        // Check for newline
        if (text[currentIndex] === '\n') {
            elements.push({ type: 'newline', content: '\n' });
            currentIndex++;
            continue;
        }

        // Check for bold (**text**)
        if (text.substring(currentIndex, currentIndex + 2) === '**') {
            const endIndex = text.indexOf('**', currentIndex + 2);
            if (endIndex !== -1) {
                const boldContent = text.substring(currentIndex + 2, endIndex);
                elements.push({ type: 'bold', content: boldContent });
                currentIndex = endIndex + 2;
                continue;
            }
        }

        // Check for inline code (`code`)
        if (text[currentIndex] === '`') {
            const endIndex = text.indexOf('`', currentIndex + 1);
            if (endIndex !== -1) {
                const codeContent = text.substring(currentIndex + 1, endIndex);
                elements.push({ type: 'code', content: codeContent });
                currentIndex = endIndex + 1;
                continue;
            }
        }

        // Regular text - collect until we hit a special character
        let textContent = '';
        while (
            currentIndex < text.length &&
            text[currentIndex] !== '\n' &&
            text[currentIndex] !== '`' &&
            text.substring(currentIndex, currentIndex + 2) !== '**'
        ) {
            textContent += text[currentIndex];
            currentIndex++;
        }

        if (textContent) {
            elements.push({ type: 'text', content: textContent });
        }
    }

    return elements;
}
