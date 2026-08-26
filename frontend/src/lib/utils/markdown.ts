import { Marked } from 'marked';
import hljs from 'highlight.js';

// Initialize Marked instance with custom renderer for code blocks
const marked = new Marked({
  gfm: true,
  breaks: true,
});

// Configure custom code block renderer
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = (lang && hljs.getLanguage(lang)) ? lang : 'plaintext';
      let highlightedCode = text;
      
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlightedCode = hljs.highlight(text, { language }).value;
        } else {
          highlightedCode = hljs.highlightAuto(text).value;
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
      onclick="(function(btn){
        const code = decodeURIComponent(btn.getAttribute('data-code'));
        navigator.clipboard.writeText(code).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Copied!';
          btn.classList.add('text-green-400');
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('text-green-400');
          }, 2000);
        });
      })(this)"
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
    return marked.parse(content) as string;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return `<p>${escapeHtml(content)}</p>`;
  }
}
