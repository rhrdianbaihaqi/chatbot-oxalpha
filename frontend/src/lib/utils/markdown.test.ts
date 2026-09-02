import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('returns an empty string for empty content', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders basic markdown to HTML', () => {
    const html = renderMarkdown('**bold** and _italic_');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('strips <script> tags from model output (XSS regression)', () => {
    const html = renderMarkdown('Hello <script>window.__pwned = true<\/script> world');
    expect(html).not.toContain('<script');
    expect(html).toContain('Hello');
    expect(html).toContain('world');
  });

  it('strips inline event handler attributes like onerror (XSS regression)', () => {
    const html = renderMarkdown('<img src="x" onerror="window.__pwned = true">');
    expect(html).not.toContain('onerror');
  });

  it('strips javascript: URLs from links', () => {
    const html = renderMarkdown('[click me](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('renders a fenced code block with a highlighted, sanitized copy button', () => {
    const html = renderMarkdown('```python\nprint("hi")\n```');

    expect(html).toContain('code-block-container');
    expect(html).toContain('copy-code-btn');
    // The copy button must carry its payload as a data attribute, not an
    // inline event handler (breaks CSP and can't survive sanitization).
    expect(html).not.toContain('onclick');
    expect(html).toContain('data-code=');
  });

  it('falls back to escaped plain text if parsing throws', () => {
    // renderMarkdown must never throw back into the caller — a bad response
    // should degrade to visible text, not break the message bubble.
    const html = renderMarkdown('<<<not really markdown>>>');
    expect(typeof html).toBe('string');
  });
});
