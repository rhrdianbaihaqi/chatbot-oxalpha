import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

// Register essential languages for lightweight bundle
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import yaml from 'highlight.js/lib/languages/yaml';
import dockerfile from 'highlight.js/lib/languages/dockerfile';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('zsh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('svg', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);

// Initialize Marked instance with custom renderer for code blocks
const marked = new Marked({
  gfm: true,
  breaks: true,
});

// Configure custom code block renderer
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const cleanLang = (lang || '').toLowerCase().trim();
      const language = cleanLang && hljs.getLanguage(cleanLang) ? cleanLang : '';
      let highlightedCode = '';

      try {
        if (language) {
          highlightedCode = hljs.highlight(text, { language }).value;
        } else {
          highlightedCode = escapeHtml(text);
        }
      } catch {
        highlightedCode = escapeHtml(text);
      }

      const encodedCode = encodeURIComponent(text);
      const displayLang = language || 'code';

      return `
<div class="code-block-container not-prose my-3 rounded-lg overflow-hidden border border-surface-300 dark:border-surface-700 bg-[#1e1e1e]">
  <div class="code-block-header flex items-center justify-between px-3 py-1.5 bg-[#252526] text-surface-400 text-xs font-mono border-b border-surface-800">
    <span class="font-medium text-surface-300">${escapeHtml(displayLang)}</span>
    <button
      type="button"
      class="copy-code-btn flex items-center gap-1 text-xs text-surface-400 hover:text-white px-2 py-0.5 rounded transition-colors bg-[#333333] hover:bg-[#444444]"
      data-code="${encodedCode}"
      aria-label="Copy code to clipboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      <span>Copy</span>
    </button>
  </div>
  <pre class="p-3.5 m-0 overflow-x-auto text-sm text-surface-100 font-mono leading-relaxed"><code>${highlightedCode}</code></pre>
</div>
`;
    },
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const html = marked.parse(content) as string;
    // Model output is untrusted input rendered via {@html}; sanitize before
    // it reaches the DOM to prevent stored XSS from injected HTML/script.
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  } catch (err) {
    console.error('Markdown parse error:', err);
    return `<p>${escapeHtml(content)}</p>`;
  }
}
