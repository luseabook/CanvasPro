import { sanitizePromptHtml } from '../utils/dom.js';
export const PROMPT_VIRTUAL_PASTE_THRESHOLD = 0x40 * 0x400;
export const PROMPT_VIRTUAL_CHUNK_SIZE = 0x4 * 0x400;
const PROMPT_VIRTUAL_CHUNK_SELECTOR = '[data-prompt-virtual-chunk]',
  PROMPT_VIRTUAL_END_SELECTOR = '[data-prompt-virtual-paste-end]',
  PROMPT_CONTAINER_TAGS = new Set(['div', 'p']),
  DANGEROUS_TAGS = new Set(['iframe', 'object', 'embed', 'script', 'style', 'link', 'meta']);
function escapePromptText(_0x3d04eb = '') {
  const _0x50e8fa = String(_0x3d04eb || '');
  if (!/[&<>]/['test'](_0x50e8fa)) return _0x50e8fa;
  return _0x50e8fa['replace'](/&/g, '&amp;')['replace'](/</g, '&lt;')['replace'](/>/g, '&gt;');
}
export function buildVirtualizedPromptPasteHtml(_0x2ddf1c = '') {
  const _0x54efc2 = String(_0x2ddf1c || '');
  if (!_0x54efc2) return '';
  const _0x1a50ed = [];
  for (let _0x4d0a74 = 0x0; _0x4d0a74 < _0x54efc2['length']; _0x4d0a74 += PROMPT_VIRTUAL_CHUNK_SIZE) {
    _0x1a50ed['push'](
      '<span\x20class=\x22prompt-virtual-chunk\x22\x20data-prompt-virtual-chunk=\x22true\x22>' +
        escapePromptText(_0x54efc2['slice'](_0x4d0a74, _0x4d0a74 + PROMPT_VIRTUAL_CHUNK_SIZE)) +
        '</span>',
    );
  }
  return (
    _0x1a50ed['push'](
      '<span class="prompt-virtual-paste-end" ' + 'data-prompt-virtual-paste-end=\x22true\x22>&#8203;</span>',
    ),
    _0x1a50ed['join']('')
  );
}
export function canVirtualizePromptPaste(
  _0x289e17,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (String(_0x289e17 || '')['length'] < PROMPT_VIRTUAL_PASTE_THRESHOLD) return ![];
  if (typeof documentObject?.['execCommand'] !== 'function') return ![];
  const _0xe91750 = documentObject?.['defaultView']?.['CSS'] || globalThis['CSS'];
  return typeof _0xe91750?.['supports'] === 'function' && _0xe91750['supports']('content-visibility', 'auto');
}
export function removeVirtualPromptPasteEndMarker(
  _0x4f3b38,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  const _0x2b2ecc = _0x4f3b38?.['querySelector']?.(PROMPT_VIRTUAL_END_SELECTOR);
  if (!_0x2b2ecc) return;
  try {
    const _0x1c0928 = documentObject?.['createRange']?.(),
      _0x51f2f7 =
        documentObject?.['defaultView']?.['getSelection']?.() || globalThis['window']?.['getSelection']?.();
    if (_0x1c0928 && _0x51f2f7) {
      (_0x1c0928['setStartBefore'](_0x2b2ecc),
        _0x1c0928['collapse'](!![]),
        _0x2b2ecc['remove']?.(),
        _0x51f2f7['removeAllRanges']?.(),
        _0x51f2f7['addRange']?.(_0x1c0928));
      return;
    }
  } catch {}
  _0x2b2ecc['remove']?.();
}
export function insertVirtualizedPromptTextAtSelection(
  _0x48fdfb,
  _0x4c76c3,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  if (!_0x48fdfb || !canVirtualizePromptPaste(_0x4c76c3, { documentObject: documentObject })) return ![];
  const _0x2d41cd = buildVirtualizedPromptPasteHtml(_0x4c76c3);
  if (!_0x2d41cd) return ![];
  try {
    const _0x390e89 = documentObject['execCommand']('insertHTML', ![], _0x2d41cd);
    if (!_0x390e89) return ![];
    return (removeVirtualPromptPasteEndMarker(_0x48fdfb, { documentObject: documentObject }), !![]);
  } catch {
    return ![];
  }
}
export function hasVirtualizedPromptChunks(_0x5a571d) {
  return Boolean(_0x5a571d?.['querySelector']?.(PROMPT_VIRTUAL_CHUNK_SELECTOR));
}
function appendSerializedPromptNode(_0x442b04, _0x13c8ca) {
  const _0x342eee = Number(_0x13c8ca?.['nodeType']);
  if (_0x342eee === 0x3) {
    _0x442b04['push'](escapePromptText(_0x13c8ca['textContent'] || ''));
    return;
  }
  if (_0x342eee !== 0x1) return;
  if (_0x13c8ca?.['matches']?.(PROMPT_VIRTUAL_END_SELECTOR)) return;
  const _0x1989d8 = String(_0x13c8ca?.['tagName'] || '')['toLowerCase']();
  if (DANGEROUS_TAGS['has'](_0x1989d8)) return;
  if (_0x1989d8 === 'br') {
    _0x442b04['push']('<br>');
    return;
  }
  if (_0x1989d8 === 'span' && _0x13c8ca['classList']?.['contains']?.('ref-pill')) {
    _0x442b04['push'](sanitizePromptHtml(_0x13c8ca['outerHTML'] || ''));
    return;
  }
  const _0x407d0d = PROMPT_CONTAINER_TAGS['has'](_0x1989d8);
  if (_0x407d0d) _0x442b04['push']('<' + _0x1989d8 + '>');
  Array['from'](_0x13c8ca['childNodes'] || [])['forEach']((_0x4dc015) => {
    appendSerializedPromptNode(_0x442b04, _0x4dc015);
  });
  if (_0x407d0d) _0x442b04['push']('</' + _0x1989d8 + '>');
}
export function serializeVirtualizedPromptHtml(_0x2e8ce9) {
  if (!hasVirtualizedPromptChunks(_0x2e8ce9)) return null;
  const _0x3d4b30 = [];
  return (
    Array['from'](_0x2e8ce9?.['childNodes'] || [])['forEach']((_0x27b9aa) => {
      appendSerializedPromptNode(_0x3d4b30, _0x27b9aa);
    }),
    _0x3d4b30['join']('')
  );
}
export function rememberVirtualizedPromptCommit(_0x5ec4e2, _0x59c52f = '') {
  if (!_0x5ec4e2) return;
  if (!hasVirtualizedPromptChunks(_0x5ec4e2['promptEl'])) {
    _0x5ec4e2['_virtualizedPromptCommitValue'] = null;
    return;
  }
  ((_0x5ec4e2['_virtualizedPromptCommitValue'] = String(_0x59c52f || '')),
    '_lastPromptContentSig' in _0x5ec4e2 &&
      (_0x5ec4e2['_lastPromptContentSig'] = _0x5ec4e2['_virtualizedPromptCommitValue']));
}
export function isVirtualizedPromptEditorCurrent(_0x23043b, _0x496e23 = '') {
  return Boolean(
    _0x23043b &&
    hasVirtualizedPromptChunks(_0x23043b['promptEl']) &&
    _0x23043b['_virtualizedPromptCommitValue'] === String(_0x496e23 || ''),
  );
}
export function clearVirtualizedPromptCommit(_0x12e03b) {
  if (!_0x12e03b) return;
  _0x12e03b['_virtualizedPromptCommitValue'] = null;
}
