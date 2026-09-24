import { DOCUMENT_PREVIEW_LIMIT, splitDocumentText } from './storyDocumentImport.js';

function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text); return node;
}
export function createStoryDocumentPreview({ fileName, result, onConfirm, onCancel }) {
  const abort = new AbortController();
  const root = element('section', 'sw-document-preview'); root.setAttribute('aria-label', '文档提取预览');
  const heading = element('h3', '', `提取预览 · ${fileName}`);
  const info = element('p', 'sw-help', `${String(result.format || '').toUpperCase()}${Number.isInteger(result.pageCount) ? ` · ${result.pageCount} 页` : ''}。请核对文字后再追加到草稿，原有单集不会被覆盖。`);
  const warnings = element('ul', 'sw-document-warnings');
  for (const warning of (Array.isArray(result.warnings) ? result.warnings : []).slice(0, 20)) warnings.append(element('li', '', warning));
  const text = element('textarea'); text.value = result.text; text.setAttribute('aria-label', '提取文字（可编辑）'); text.spellcheck = false;
  const summary = element('p', 'sw-help'); summary.setAttribute('role', 'status');
  const tools = element('div', 'sw-tools');
  const confirm = element('button', 'sw-button', '确认追加到草稿'); confirm.type = 'button';
  const cancel = element('button', 'sw-button', '放弃此次提取'); cancel.type = 'button';
  const note = element('p', 'sw-help', '超长文档会按长度分成多个“文档片段”（每段不超过 20 万字符），尽量保留段落边界；这不是 AI 拆集。确认后仍需应用到项目并保存工程。');
  function update() {
    try {
      const count = splitDocumentText(text.value).length;
      summary.textContent = `${text.value.length} 个 UTF-16 字符单位，将追加 ${count} 个单集草稿。`;
      confirm.disabled = false;
    } catch (error) { summary.textContent = error.message; confirm.disabled = true; }
  }
  if (text.value.length > DOCUMENT_PREVIEW_LIMIT) throw new Error('提取结果超过预览上限。');
  text.addEventListener('input', update, { signal: abort.signal });
  confirm.addEventListener('click', () => {
    try { onConfirm(text.value); }
    catch (error) { summary.textContent = error.message; }
  }, { signal: abort.signal });
  cancel.addEventListener('click', onCancel, { signal: abort.signal });
  tools.append(confirm, cancel); root.append(heading, info, warnings, text, summary, tools, note); update();
  return { root, focus() { text.focus(); }, destroy() { abort.abort(); root.remove(); } };
}
