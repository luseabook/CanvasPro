import { sanitizePromptHtml } from '../utils/dom.js';
export const PROMPT_VIRTUAL_PASTE_THRESHOLD = 0x40 * 0x400;
export const PROMPT_VIRTUAL_CHUNK_SIZE = 0x4 * 0x400;
const PROMPT_VIRTUAL_CHUNK_SELECTOR = '[data-prompt-virtual-chunk]',
  PROMPT_VIRTUAL_END_SELECTOR = '[data-prompt-virtual-paste-end]',
  PROMPT_CONTAINER_TAGS = new Set(['div', 'p']),
  DANGEROUS_TAGS = new Set(['iframe', 'object', 'embed', 'script', 'style', 'link', 'meta']);
function escapePromptText(value = '') {
  const item = String(value || '');
  if (!/[&<>]/['test'](item)) return item;
  return item['replace'](/&/g, '&amp;')['replace'](/</g, '&lt;')['replace'](/>/g, '&gt;');
}
export function buildVirtualizedPromptPasteHtml(key = '') {
  const list = String(key || '');
  if (!list) return '';
  const list2 = [];
  for (let index = 0x0; index < list['length']; index += PROMPT_VIRTUAL_CHUNK_SIZE) {
    list2['push'](
      '<span\x20class=\x22prompt-virtual-chunk\x22\x20data-prompt-virtual-chunk=\x22true\x22>' +
        escapePromptText(list['slice'](index, index + PROMPT_VIRTUAL_CHUNK_SIZE)) +
        '</span>',
    );
  }
  return (
    list2['push'](
      '<span class="prompt-virtual-paste-end" ' + 'data-prompt-virtual-paste-end=\x22true\x22>&#8203;</span>',
    ),
    list2['join']('')
  );
}
export function canVirtualizePromptPaste(
  result,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (String(result || '')['length'] < PROMPT_VIRTUAL_PASTE_THRESHOLD) return ![];
  if (typeof documentObject?.['execCommand'] !== 'function') return ![];
  const data = documentObject?.['defaultView']?.['CSS'] || globalThis['CSS'];
  return typeof data?.['supports'] === 'function' && data['supports']('content-visibility', 'auto');
}
export function removeVirtualPromptPasteEndMarker(
  el,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  const el2 = el?.['querySelector']?.(PROMPT_VIRTUAL_END_SELECTOR);
  if (!el2) return;
  try {
    const options = documentObject?.['createRange']?.(),
      target =
        documentObject?.['defaultView']?.['getSelection']?.() || globalThis['window']?.['getSelection']?.();
    if (options && target) {
      (options['setStartBefore'](el2),
        options['collapse'](!![]),
        el2['remove']?.(),
        target['removeAllRanges']?.(),
        target['addRange']?.(options));
      return;
    }
  } catch {}
  el2['remove']?.();
}
export function insertVirtualizedPromptTextAtSelection(
  enabled,
  source,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (!enabled || !canVirtualizePromptPaste(source, { documentObject: documentObject })) return ![];
  const virtualizedPromptPasteHtml = buildVirtualizedPromptPasteHtml(source);
  if (!virtualizedPromptPasteHtml) return ![];
  try {
    const enabled2 = documentObject['execCommand']('insertHTML', ![], virtualizedPromptPasteHtml);
    if (!enabled2) return ![];
    return (removeVirtualPromptPasteEndMarker(enabled, { documentObject: documentObject }), !![]);
  } catch {
    return ![];
  }
}
export function hasVirtualizedPromptChunks(el3) {
  return Boolean(el3?.['querySelector']?.(PROMPT_VIRTUAL_CHUNK_SELECTOR));
}
function appendSerializedPromptNode(list3, el4) {
  const count = Number(el4?.['nodeType']);
  if (count === 0x3) {
    list3['push'](escapePromptText(el4['textContent'] || ''));
    return;
  }
  if (count !== 0x1) return;
  if (el4?.['matches']?.(PROMPT_VIRTUAL_END_SELECTOR)) return;
  const next = String(el4?.['tagName'] || '')['toLowerCase']();
  if (DANGEROUS_TAGS['has'](next)) return;
  if (next === 'br') {
    list3['push']('<br>');
    return;
  }
  if (next === 'span' && el4['classList']?.['contains']?.('ref-pill')) {
    list3['push'](sanitizePromptHtml(el4['outerHTML'] || ''));
    return;
  }
  const current = PROMPT_CONTAINER_TAGS['has'](next);
  if (current) list3['push']('<' + next + '>');
  Array['from'](el4['childNodes'] || [])['forEach']((entry) => {
    appendSerializedPromptNode(list3, entry);
  });
  if (current) list3['push']('</' + next + '>');
}
export function serializeVirtualizedPromptHtml(record) {
  if (!hasVirtualizedPromptChunks(record)) return null;
  const list4 = [];
  return (
    Array['from'](record?.['childNodes'] || [])['forEach']((payload) => {
      appendSerializedPromptNode(list4, payload);
    }),
    list4['join']('')
  );
}
export function rememberVirtualizedPromptCommit(enabled3, handle = '') {
  if (!enabled3) return;
  if (!hasVirtualizedPromptChunks(enabled3['promptEl'])) {
    enabled3['_virtualizedPromptCommitValue'] = null;
    return;
  }
  ((enabled3['_virtualizedPromptCommitValue'] = String(handle || '')),
    '_lastPromptContentSig' in enabled3 &&
      (enabled3['_lastPromptContentSig'] = enabled3['_virtualizedPromptCommitValue']));
}
export function isVirtualizedPromptEditorCurrent(state, config = '') {
  return Boolean(
    state &&
    hasVirtualizedPromptChunks(state['promptEl']) &&
    state['_virtualizedPromptCommitValue'] === String(config || ''),
  );
}
export function clearVirtualizedPromptCommit(enabled4) {
  if (!enabled4) return;
  enabled4['_virtualizedPromptCommitValue'] = null;
}
