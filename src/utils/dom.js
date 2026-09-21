import { readNodeMediaMetricsDataset } from '../modules/nodeMediaMetrics.js';
const _staticInnerHtmlRegistry = new Map([
    [
      'cpdProjectItemIcon16',
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-text)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    ],
    [
      'iconTrash18',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    ],
    [
      'iconFolderOpen18',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2"/><path d="M3 10h18l-2 8a2 2 0 0 1-2 1.5H5a2 2 0 0 1-2-1.5Z"/></svg>',
    ],
    [
      'iconSaveAs18',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v3"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/><path d="M18 14v6"/><path d="M15 17h6"/></svg>',
    ],
    [
      'iconPackageExport18',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M3 8l9 5 9-5"/><path d="M12 13v7"/><path d="M7 4h10l4 4H3z"/><path d="M12 2v6"/><path d="M9 5l3-3 3 3"/></svg>',
    ],
    [
      'iconPackageImport18',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M3 8l9 5 9-5"/><path d="M12 13v7"/><path d="M7 4h10l4 4H3z"/><path d="M12 2v6"/><path d="M15 5l-3 3-3-3"/></svg>',
    ],
  ]),
  _staticTemplateCache = new Map();
export function registerStaticInnerHTML(_0x5e2054, _0x4623d0) {
  if (typeof _0x5e2054 !== 'string' || !_0x5e2054) throw new Error('templateId must be a non-empty string');
  if (typeof _0x4623d0 !== 'string') throw new Error('html must be a string');
  if (_staticInnerHtmlRegistry.has(_0x5e2054))
    throw new Error('Static HTML template already registered: ' + _0x5e2054);
  _staticInnerHtmlRegistry.set(_0x5e2054, _0x4623d0);
}
export function setStaticInnerHTML(_0x184a32, _0x436ea9) {
  if (!_0x184a32) return;
  const _0x44adf8 = _staticTemplateCache.get(_0x436ea9);
  if (_0x44adf8) {
    _0x184a32.replaceChildren(_0x44adf8.content.cloneNode(true));
    return;
  }
  const _0x40c386 = _staticInnerHtmlRegistry.get(_0x436ea9);
  if (!_0x40c386) throw new Error('Unknown static HTML template: ' + _0x436ea9);
  if (typeof document === 'undefined') {
    _0x184a32.innerHTML = _0x40c386;
    return;
  }
  const _0x74d605 = document.createElement('template');
  ((_0x74d605.innerHTML = _0x40c386),
    _staticTemplateCache.set(_0x436ea9, _0x74d605),
    _0x184a32.replaceChildren(_0x74d605.content.cloneNode(true)));
}
export function clearElement(_0x1e3305) {
  if (!_0x1e3305) return;
  _0x1e3305.replaceChildren();
}
export function setText(_0x5ac798, _0x48f3ab) {
  if (!_0x5ac798) return;
  _0x5ac798.textContent = _0x48f3ab == null ? '' : String(_0x48f3ab);
}
export function setTextWithLineBreaks(_0x24d05e, _0x3aa5ed) {
  if (!_0x24d05e) return;
  _0x24d05e.replaceChildren();
  const _0x48a785 = _0x3aa5ed == null ? '' : String(_0x3aa5ed),
    _0x4caa2a = _0x48a785.split('\n');
  for (let _0x439833 = 0; _0x439833 < _0x4caa2a.length; _0x439833++) {
    if (_0x439833 > 0) _0x24d05e.appendChild(document.createElement('br'));
    _0x24d05e.appendChild(document.createTextNode(_0x4caa2a[_0x439833]));
  }
}
const _SVG_NS = 'http://www.w3.org/2000/svg',
  _ALLOWED_SVG_TAGS = new Set([
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
  ]),
  _ALLOWED_SVG_ATTRS = new Set([
    'viewBox',
    'width',
    'height',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'opacity',
    'transform',
    'd',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'points',
    'xmlns',
    'class',
    'aria-hidden',
    'focusable',
  ]);
function _sanitizeSvgNode(_0x2ee028) {
  if (!_0x2ee028 || _0x2ee028.nodeType !== Node.ELEMENT_NODE) return null;
  const _0x490481 = String(_0x2ee028.tagName || '').toLowerCase();
  if (!_ALLOWED_SVG_TAGS.has(_0x490481)) return null;
  const _0xc494f2 = document.createElementNS(_SVG_NS, _0x490481);
  for (const _0x176262 of Array.from(_0x2ee028.attributes || [])) {
    const _0x4fcf9e = _0x176262.name,
      _0x5108d6 = _0x176262.value;
    if (!_0x4fcf9e) continue;
    const _0x523434 = _0x4fcf9e.toLowerCase();
    if (_0x523434.startsWith('on')) continue;
    if (_0x523434 === 'href' || _0x523434 === 'xlink:href') continue;
    if (!_ALLOWED_SVG_ATTRS.has(_0x4fcf9e)) continue;
    _0xc494f2.setAttribute(_0x4fcf9e, _0x5108d6);
  }
  for (const _0x3a376a of Array.from(_0x2ee028.childNodes || [])) {
    if (_0x3a376a.nodeType === Node.ELEMENT_NODE) {
      const _0x3a7e8e = _sanitizeSvgNode(_0x3a376a);
      if (_0x3a7e8e) _0xc494f2.appendChild(_0x3a7e8e);
    }
  }
  return _0xc494f2;
}
export function createSafeSvg(_0x20280d) {
  if (typeof _0x20280d !== 'string') return null;
  const _0x2163d5 = _0x20280d.trim();
  if (!_0x2163d5) return null;
  const _0x16b4ba = new DOMParser().parseFromString(_0x2163d5, 'image/svg+xml');
  if (_0x16b4ba.querySelector('parsererror')) return null;
  const _0x4d5e3b = _0x16b4ba.documentElement;
  if (!_0x4d5e3b || String(_0x4d5e3b.tagName || '').toLowerCase() !== 'svg') return null;
  const _0x273382 = _sanitizeSvgNode(_0x4d5e3b);
  if (!_0x273382) return null;
  if (!_0x273382.getAttribute('focusable')) _0x273382.setAttribute('focusable', 'false');
  if (!_0x273382.getAttribute('aria-hidden')) _0x273382.setAttribute('aria-hidden', 'true');
  return _0x273382;
}
const _DANGEROUS_HTML_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template']),
  _PROMPT_CONTAINER_TAGS = new Set(['div', 'p']),
  _RICH_TEXT_ALLOWED_TAGS = new Set([
    'h1',
    'h2',
    'h3',
    'p',
    'div',
    'br',
    'b',
    'strong',
    'i',
    'em',
    'ul',
    'ol',
    'li',
    'hr',
    'blockquote',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ]);
function _escapeHtmlText(_0x581b83) {
  return String(_0x581b83 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function _escapeHtmlAttr(_0x52c637) {
  return _escapeHtmlText(_0x52c637).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _stripHtmlTags(_0x35eb20) {
  return String(_0x35eb20 ?? '').replace(/<\/?[^>]+>/g, '');
}
function _stripDangerousHtml(_0x9c6b6d) {
  let _0x48ad04 = String(_0x9c6b6d ?? '');
  return (
    _DANGEROUS_HTML_TAGS.forEach((_0x46e4fe) => {
      const _0x14cd7f = new RegExp('<' + _0x46e4fe + '\\b[^>]*>[\\s\\S]*?<\\/' + _0x46e4fe + '\\s*>', 'gi'),
        _0x2b52e6 = new RegExp('<\\/?' + _0x46e4fe + '\\b[^>]*\\/?>', 'gi');
      ((_0x48ad04 = _0x48ad04.replace(_0x14cd7f, '')), (_0x48ad04 = _0x48ad04.replace(_0x2b52e6, '')));
    }),
    _0x48ad04
  );
}
function _extractHtmlAttr(_0x1dfdb1, _0x5205ab) {
  const _0x2d7bf1 = String(_0x1dfdb1 ?? ''),
    _0x180dc2 = String(_0x5205ab || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    _0x54d956 = new RegExp(_0x180dc2 + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'),
    _0x5c0a73 = _0x2d7bf1.match(_0x54d956);
  if (_0x5c0a73) return _0x5c0a73[2] ?? _0x5c0a73[3] ?? '';
  const _0x30e47e = new RegExp(_0x180dc2 + '\\s*=\\s*([^\\s"\'>]+)', 'i'),
    _0x42dec9 = _0x2d7bf1.match(_0x30e47e);
  return _0x42dec9 ? (_0x42dec9[1] ?? '') : '';
}
function _classAttrContains(_0xaa36c7, _0x403aba) {
  const _0x1b101f = _extractHtmlAttr(_0xaa36c7, 'class');
  return String(_0x1b101f || '')
    .split(/\s+/)
    .filter(Boolean)
    .includes(String(_0x403aba || ''));
}
function _replaceAllowedTagsWithTokens(_0x14ec12, _0x3edc2f) {
  const _0x109e82 = [],
    _0x3da2cd = (_0x529bf2) => {
      const _0x350af0 = '__AIC_HTML_TOKEN_' + _0x109e82.length + '__';
      return (_0x109e82.push(String(_0x529bf2 ?? '')), _0x350af0);
    };
  let _0x1c8682 = String(_0x14ec12 ?? '');
  const _0x55cfd3 = (_0x318b4b) => {
    const _0x362a6b = new RegExp('<' + _0x318b4b + '\\b[^>]*>', 'gi'),
      _0x3611db = new RegExp('<\\/' + _0x318b4b + '\\s*>', 'gi');
    ((_0x1c8682 = _0x1c8682.replace(_0x362a6b, () => _0x3da2cd('<' + _0x318b4b + '>'))),
      (_0x1c8682 = _0x1c8682.replace(_0x3611db, () => _0x3da2cd('</' + _0x318b4b + '>'))));
  };
  return (
    _0x3edc2f.forEach((_0x24ea96) => {
      if (_0x24ea96 === 'br' || _0x24ea96 === 'hr') {
        const _0x358be2 = new RegExp('<' + _0x24ea96 + '\\b[^>]*\\/?>', 'gi');
        _0x1c8682 = _0x1c8682.replace(_0x358be2, () => _0x3da2cd('<' + _0x24ea96 + '>'));
        return;
      }
      _0x55cfd3(_0x24ea96);
    }),
    {
      output: _0x1c8682,
      restore() {
        return _0x1c8682.replace(/__AIC_HTML_TOKEN_(\d+)__/g, (_0x27f81b, _0x69a6d1) => {
          const _0x3b9a49 = _0x109e82[Number(_0x69a6d1)];
          return typeof _0x3b9a49 === 'string' ? _0x3b9a49 : '';
        });
      },
      pushToken: _0x3da2cd,
      setOutput(_0x3c465c) {
        _0x1c8682 = String(_0x3c465c ?? '');
      },
    }
  );
}
function _sanitizePromptHtmlWithoutDom(_0x1805a0) {
  const _0x906482 = _replaceAllowedTagsWithTokens(_stripDangerousHtml(_0x1805a0), _PROMPT_CONTAINER_TAGS);
  let _0x5301f2 = _0x906482.output
    .replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (_0xd7fa95, _0x205412, _0x163006) => {
      if (!_classAttrContains(_0x205412, 'ref-pill')) return _0x163006;
      const _0x179ca0 = _extractHtmlAttr(_0x205412, 'data-label') || _stripHtmlTags(_0x163006),
        _0x218c93 = _stripHtmlTags(_0x179ca0).replace(/[×✕✖]/g, '').trim(),
        _0x2bcc9b = _stripHtmlTags(
          _extractHtmlAttr(_0x205412, 'data-node-id') || _extractHtmlAttr(_0x205412, 'data-nodeId'),
        ).trim(),
        _0x5013be = _stripHtmlTags(_extractHtmlAttr(_0x205412, 'data-ref-origin')).trim(),
        _0x5412d1 = _stripHtmlTags(_extractHtmlAttr(_0x205412, 'data-asset-id')).trim(),
        _0x5b6bae = _stripHtmlTags(_extractHtmlAttr(_0x205412, 'data-asset-index')).trim(),
        _0x73b372 = _stripHtmlTags(_extractHtmlAttr(_0x205412, 'data-ref-type')).trim(),
        _0x1fc035 = _stripHtmlTags(_extractHtmlAttr(_0x205412, 'data-ref-unresolved')).trim(),
        _0x52bcfd = ['class="ref-pill"', 'contenteditable="false"'];
      if (_0x218c93) _0x52bcfd.push('data-label="' + _escapeHtmlAttr(_0x218c93) + '"');
      if (_0x2bcc9b) _0x52bcfd.push('data-node-id="' + _escapeHtmlAttr(_0x2bcc9b) + '"');
      if (_0x5013be === 'asset') _0x52bcfd.push('data-ref-origin="asset"');
      if (_0x5412d1) _0x52bcfd.push('data-asset-id="' + _escapeHtmlAttr(_0x5412d1) + '"');
      if (_0x5b6bae) _0x52bcfd.push('data-asset-index="' + _escapeHtmlAttr(_0x5b6bae) + '"');
      if (_0x73b372) _0x52bcfd.push('data-ref-type="' + _escapeHtmlAttr(_0x73b372) + '"');
      if (_0x1fc035 === 'true') _0x52bcfd.push('data-ref-unresolved="true"');
      return _0x906482.pushToken(
        '<span ' + _0x52bcfd.join(' ') + '>' + _escapeHtmlText(_0x218c93) + '</span>',
      );
    })
    .replace(/<br\b[^>]*\/?>/gi, () => _0x906482.pushToken('<br>'));
  return (_0x906482.setOutput(_0x5301f2.replace(/<\/?[^>]+>/g, '')), _0x906482.restore());
}
function _sanitizeRichTextHtmlWithoutDom(_0x79aef0) {
  const _0x2e3c86 = _replaceAllowedTagsWithTokens(_stripDangerousHtml(_0x79aef0), _RICH_TEXT_ALLOWED_TAGS);
  return (_0x2e3c86.setOutput(_0x2e3c86.output.replace(/<\/?[^>]+>/g, '')), _0x2e3c86.restore());
}
function _appendSanitizedPromptNode(_0x940188, _0x46215b) {
  const _0x1acd04 = Number(_0x46215b?.nodeType);
  if (_0x1acd04 === 3) {
    _0x940188.appendChild(document.createTextNode(String(_0x46215b?.textContent || '')));
    return;
  }
  if (_0x1acd04 !== 1) return;
  const _0x20d9cd = String(_0x46215b?.tagName || '').toLowerCase();
  if (_DANGEROUS_HTML_TAGS.has(_0x20d9cd)) return;
  if (_0x20d9cd === 'br') {
    _0x940188.appendChild(document.createElement('br'));
    return;
  }
  if (_0x20d9cd === 'span' && _0x46215b.classList?.contains('ref-pill')) {
    const _0x1cb524 = String(
        _0x46215b.getAttribute?.('data-label') || _0x46215b.dataset?.label || _0x46215b.textContent || '',
      )
        .replace(/[×✕✖]/g, '')
        .trim(),
      _0x443b72 = String(_0x46215b.getAttribute?.('data-node-id') || _0x46215b.dataset?.nodeId || '').trim(),
      _0x245718 = String(
        _0x46215b.getAttribute?.('data-ref-origin') || _0x46215b.dataset?.refOrigin || '',
      ).trim(),
      _0x1171cd = String(
        _0x46215b.getAttribute?.('data-asset-id') || _0x46215b.dataset?.assetId || '',
      ).trim(),
      _0x3c7faa = String(
        _0x46215b.getAttribute?.('data-asset-index') || _0x46215b.dataset?.assetIndex || '',
      ).trim(),
      _0x262e23 = String(
        _0x46215b.getAttribute?.('data-ref-type') || _0x46215b.dataset?.refType || '',
      ).trim(),
      _0x5e2a9f = String(
        _0x46215b.getAttribute?.('data-ref-unresolved') || _0x46215b.dataset?.refUnresolved || '',
      ).trim(),
      _0x4a3526 = document.createElement('span');
    ((_0x4a3526.className = 'ref-pill'), _0x4a3526.setAttribute('contenteditable', 'false'));
    if (_0x1cb524) _0x4a3526.setAttribute('data-label', _0x1cb524);
    if (_0x443b72) _0x4a3526.setAttribute('data-node-id', _0x443b72);
    if (_0x245718 === 'asset') _0x4a3526.setAttribute('data-ref-origin', 'asset');
    if (_0x1171cd) _0x4a3526.setAttribute('data-asset-id', _0x1171cd);
    if (_0x3c7faa) _0x4a3526.setAttribute('data-asset-index', _0x3c7faa);
    if (_0x262e23) _0x4a3526.setAttribute('data-ref-type', _0x262e23);
    if (_0x5e2a9f === 'true') _0x4a3526.setAttribute('data-ref-unresolved', 'true');
    ((_0x4a3526.textContent = _0x1cb524), _0x940188.appendChild(_0x4a3526));
    return;
  }
  if (_PROMPT_CONTAINER_TAGS.has(_0x20d9cd)) {
    const _0x2e36ea = document.createElement(_0x20d9cd);
    (Array.from(_0x46215b.childNodes || []).forEach((_0x554810) =>
      _appendSanitizedPromptNode(_0x2e36ea, _0x554810),
    ),
      _0x940188.appendChild(_0x2e36ea));
    return;
  }
  Array.from(_0x46215b.childNodes || []).forEach((_0x50c24b) =>
    _appendSanitizedPromptNode(_0x940188, _0x50c24b),
  );
}
function _appendSanitizedRichTextNode(_0x523847, _0x176213) {
  const _0x3575e0 = Number(_0x176213?.nodeType);
  if (_0x3575e0 === 3) {
    _0x523847.appendChild(document.createTextNode(String(_0x176213?.textContent || '')));
    return;
  }
  if (_0x3575e0 !== 1) return;
  const _0x3802a2 = String(_0x176213?.tagName || '').toLowerCase();
  if (_DANGEROUS_HTML_TAGS.has(_0x3802a2)) return;
  if (!_RICH_TEXT_ALLOWED_TAGS.has(_0x3802a2)) {
    Array.from(_0x176213.childNodes || []).forEach((_0x1d71b0) =>
      _appendSanitizedRichTextNode(_0x523847, _0x1d71b0),
    );
    return;
  }
  const _0x4135de = document.createElement(_0x3802a2);
  (_0x3802a2 !== 'br' &&
    _0x3802a2 !== 'hr' &&
    Array.from(_0x176213.childNodes || []).forEach((_0x2cae2e) =>
      _appendSanitizedRichTextNode(_0x4135de, _0x2cae2e),
    ),
    _0x523847.appendChild(_0x4135de));
}
function _sanitizeHtmlWithDom(_0x295f9d, _0x28ccd5) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function')
    throw new Error('Document API is unavailable');
  const _0x3bd49f = document.createElement('template'),
    _0x417ec9 = document.createElement('div');
  _0x3bd49f.innerHTML = String(_0x295f9d ?? '');
  const _0x33e44d = Array.from(_0x3bd49f.content?.childNodes || _0x3bd49f.childNodes || []);
  return (
    _0x33e44d.forEach((_0x3b1a88) => {
      if (_0x28ccd5 === 'prompt') {
        _appendSanitizedPromptNode(_0x417ec9, _0x3b1a88);
        return;
      }
      _appendSanitizedRichTextNode(_0x417ec9, _0x3b1a88);
    }),
    _0x417ec9.innerHTML || ''
  );
}
export function sanitizePromptHtml(_0x12640e) {
  const _0x4cb4f2 = typeof _0x12640e === 'string' ? _0x12640e : '';
  if (!_0x4cb4f2.trim()) return '';
  try {
    return _sanitizeHtmlWithDom(_0x4cb4f2, 'prompt');
  } catch {
    return _sanitizePromptHtmlWithoutDom(_0x4cb4f2);
  }
}
export function sanitizeRichTextHtml(_0x2e8d03) {
  const _0x257753 = typeof _0x2e8d03 === 'string' ? _0x2e8d03 : '';
  if (!_0x257753.trim()) return '';
  try {
    return _sanitizeHtmlWithDom(_0x257753, 'richText');
  } catch {
    return _sanitizeRichTextHtmlWithoutDom(_0x257753);
  }
}
export function createElement(_0x2f85ef, _0x216d8a = {}, _0x9574ce = null) {
  const _0x26ce28 = document.createElement(_0x2f85ef);
  Object.entries(_0x216d8a).forEach(([_0x1d49a3, _0xbe5541]) => {
    if (_0x1d49a3 === 'className') _0x26ce28.className = _0xbe5541;
    else {
      if (_0x1d49a3 === 'dataset')
        Object.entries(_0xbe5541).forEach(([_0x4f41ed, _0x31011a]) => {
          _0x26ce28.dataset[_0x4f41ed] = _0x31011a;
        });
      else
        _0x1d49a3.startsWith('on') && typeof _0xbe5541 === 'function'
          ? _0x26ce28.addEventListener(_0x1d49a3.slice(2).toLowerCase(), _0xbe5541)
          : _0x26ce28.setAttribute(_0x1d49a3, _0xbe5541);
    }
  });
  if (_0x9574ce) {
    if (typeof _0x9574ce === 'string') _0x26ce28.textContent = _0x9574ce;
    else {
      if (_0x9574ce instanceof Node) _0x26ce28.appendChild(_0x9574ce);
      else Array.isArray(_0x9574ce) && _0x26ce28.append(..._0x9574ce.filter(Boolean));
    }
  }
  return _0x26ce28;
}
export function closest(_0x483b06, _0x137595) {
  if (!_0x483b06) return null;
  if (_0x483b06.matches && _0x483b06.matches(_0x137595)) return _0x483b06;
  return _0x483b06.closest ? _0x483b06.closest(_0x137595) : null;
}
export function addEvents(_0x589ef8, _0x1f6dfc, _0x1cc9f3 = false) {
  Object.entries(_0x1f6dfc).forEach(([_0xce0e71, _0x1076c5]) => {
    _0x589ef8.addEventListener(_0xce0e71, _0x1076c5, _0x1cc9f3);
  });
}
export function removeEvents(_0x4e88f6, _0x8e7117, _0x50f6c3 = false) {
  Object.entries(_0x8e7117).forEach(([_0x58d55d, _0x53d11b]) => {
    _0x4e88f6.removeEventListener(_0x58d55d, _0x53d11b, _0x50f6c3);
  });
}
export function raf(_0x13ee83) {
  return requestAnimationFrame(_0x13ee83);
}
export function nextFrame(_0x1573c7) {
  return new Promise((_0x2d82c5) => {
    requestAnimationFrame(() => {
      (_0x1573c7(), _0x2d82c5());
    });
  });
}
export function debounce(_0x57f8dc, _0x2060ee = 0x12c) {
  let _0x1a6465 = null;
  return function (..._0x250ed4) {
    (clearTimeout(_0x1a6465), (_0x1a6465 = setTimeout(() => _0x57f8dc.apply(this, _0x250ed4), _0x2060ee)));
  };
}
export function throttle(_0x25640e, _0x196fd2 = 100) {
  let _0x5049e6 = false;
  return function (..._0x5bae1b) {
    !_0x5049e6 &&
      (_0x25640e.apply(this, _0x5bae1b),
      (_0x5049e6 = true),
      setTimeout(() => (_0x5049e6 = false), _0x196fd2));
  };
}
export function rafSampleLatest(_0x3a7898) {
  let _0x1516e1 = null,
    _0x40c0be = null,
    _0x109c30 = null;
  function _0x1d362d(..._0x289da9) {
    ((_0x40c0be = _0x289da9), (_0x109c30 = this));
    if (_0x1516e1 !== null) return;
    _0x1516e1 = requestAnimationFrame(() => {
      _0x1516e1 = null;
      const _0x304d0f = _0x40c0be,
        _0x34a418 = _0x109c30;
      ((_0x40c0be = null), (_0x109c30 = null));
      if (!_0x304d0f) return;
      _0x3a7898.apply(_0x34a418, _0x304d0f);
    });
  }
  return (
    (_0x1d362d.cancel = () => {
      if (_0x1516e1 !== null) cancelAnimationFrame(_0x1516e1);
      ((_0x1516e1 = null), (_0x40c0be = null), (_0x109c30 = null));
    }),
    _0x1d362d
  );
}
export function waitForElement(_0x346c36, _0x5a3260 = 0x1388) {
  return new Promise((_0x10d214, _0x39fc82) => {
    const _0x3357e4 = document.querySelector(_0x346c36);
    if (_0x3357e4) {
      _0x10d214(_0x3357e4);
      return;
    }
    const _0x5553c3 = new MutationObserver(() => {
      const _0x1f37b5 = document.querySelector(_0x346c36);
      _0x1f37b5 && (_0x5553c3.disconnect(), clearTimeout(_0x4d9d7a), _0x10d214(_0x1f37b5));
    });
    _0x5553c3.observe(document.body, { childList: true, subtree: true });
    const _0x4d9d7a = setTimeout(() => {
      (_0x5553c3.disconnect(),
        _0x39fc82(new Error('Element ' + _0x346c36 + ' not found within ' + _0x5a3260 + 'ms')));
    }, _0x5a3260);
  });
}
export function safeRemove(_0xa54430) {
  _0xa54430 && _0xa54430.parentNode && _0xa54430.parentNode.removeChild(_0xa54430);
}
export function getViewportRect(_0x347d0e) {
  const _0x50dde7 = _0x347d0e.getBoundingClientRect();
  return {
    top: _0x50dde7.top,
    left: _0x50dde7.left,
    bottom: _0x50dde7.bottom,
    right: _0x50dde7.right,
    width: _0x50dde7.width,
    height: _0x50dde7.height,
  };
}
export function isInViewport(_0x578724, _0x3c82fb = 0) {
  const _0x52c4f7 = _0x578724.getBoundingClientRect();
  return (
    _0x52c4f7.top >= -_0x3c82fb &&
    _0x52c4f7.left >= -_0x3c82fb &&
    _0x52c4f7.bottom <= window.innerHeight + _0x3c82fb &&
    _0x52c4f7.right <= window.innerWidth + _0x3c82fb
  );
}
export function getDisplayedMediaSizeFromNode(_0x3858e1, _0x443064) {
  const _0x4a7d02 = String(_0x3858e1 || '').trim();
  if (!_0x4a7d02) return { w: 0, h: 0 };
  const _0x26682d = document.getElementById(_0x4a7d02);
  if (!_0x26682d) return { w: 0, h: 0 };
  const _0x181727 = readNodeMediaMetricsDataset(_0x26682d, _0x443064);
  if (_0x181727) return { w: _0x181727.w, h: _0x181727.h };
  const _0x275bd4 = _0x26682d.querySelector('.img-node-preview') || _0x26682d,
    _0x13fa79 = String(_0x443064 || ''),
    _0x2ac7b2 = _0x13fa79 === 'video' ? 'video' : 'img',
    _0x3762ed = Array.from(_0x275bd4.querySelectorAll(_0x2ac7b2));
  let _0x5abcdc = 0,
    _0x396bcf = 0,
    _0x53f628 = -0x3b9aca00;
  for (const _0xe36e45 of _0x3762ed) {
    const _0x14541d = window.getComputedStyle(_0xe36e45);
    if (!_0x14541d) continue;
    if (_0x14541d.display === 'none') continue;
    if (_0x14541d.visibility === 'hidden') continue;
    if (Number(_0x14541d.opacity || '1') <= 0.05) continue;
    if (_0x14541d.pointerEvents === 'none') continue;
    const _0x206ec2 = _0x13fa79 === 'video' ? _0xe36e45.videoWidth || 0 : _0xe36e45.naturalWidth || 0,
      _0x427b1d = _0x13fa79 === 'video' ? _0xe36e45.videoHeight || 0 : _0xe36e45.naturalHeight || 0;
    if (!_0x206ec2 || !_0x427b1d) continue;
    const _0x251300 = Number(_0x14541d.zIndex),
      _0x1bc214 = Number.isFinite(_0x251300) ? _0x251300 : 0;
    _0x1bc214 >= _0x53f628 && ((_0x53f628 = _0x1bc214), (_0x5abcdc = _0x206ec2), (_0x396bcf = _0x427b1d));
  }
  return { w: _0x5abcdc, h: _0x396bcf };
}
export function getDisplayedVideoMetaFromNode(_0xb068db) {
  const _0x5adb63 = String(_0xb068db || '').trim();
  if (!_0x5adb63) return { src: '', w: 0, h: 0 };
  const _0x1546eb = document.getElementById(_0x5adb63);
  if (!_0x1546eb) return { src: '', w: 0, h: 0 };
  const _0x72491 = readNodeMediaMetricsDataset(_0x1546eb, 'video');
  if (_0x72491?.src) return { src: _0x72491.src, w: _0x72491.w, h: _0x72491.h };
  const _0x299eda = _0x1546eb.querySelector('.img-node-preview') || _0x1546eb,
    _0x404a20 = Array.from(_0x299eda.querySelectorAll('video'));
  let _0x32f07b = '',
    _0x2bb760 = 0,
    _0x44a6f7 = 0,
    _0x35b13a = -0x3b9aca00;
  for (const _0x51ecb1 of _0x404a20) {
    const _0x212b24 = window.getComputedStyle(_0x51ecb1);
    if (!_0x212b24) continue;
    if (_0x212b24.display === 'none') continue;
    if (_0x212b24.visibility === 'hidden') continue;
    if (Number(_0x212b24.opacity || '1') <= 0.05) continue;
    if (_0x212b24.pointerEvents === 'none') continue;
    const _0x299089 = String(_0x51ecb1.currentSrc || _0x51ecb1.src || '').trim();
    if (!_0x299089) continue;
    const _0x2d419b = Number(_0x51ecb1.videoWidth || 0),
      _0x400004 = Number(_0x51ecb1.videoHeight || 0),
      _0xaf65f0 = Number(_0x212b24.zIndex),
      _0x56f4cf = Number.isFinite(_0xaf65f0) ? _0xaf65f0 : 0;
    _0x56f4cf >= _0x35b13a &&
      ((_0x35b13a = _0x56f4cf),
      (_0x32f07b = _0x299089),
      (_0x2bb760 = Number.isFinite(_0x2d419b) ? _0x2d419b : 0),
      (_0x44a6f7 = Number.isFinite(_0x400004) ? _0x400004 : 0));
  }
  return { src: _0x32f07b, w: _0x2bb760, h: _0x44a6f7 };
}
