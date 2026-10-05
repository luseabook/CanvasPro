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
export function registerStaticInnerHTML(enabled, value) {
  if (typeof enabled !== 'string' || !enabled) throw new Error('templateId must be a non-empty string');
  if (typeof value !== 'string') throw new Error('html must be a string');
  if (_staticInnerHtmlRegistry.has(enabled))
    throw new Error('Static HTML template already registered: ' + enabled);
  _staticInnerHtmlRegistry.set(enabled, value);
}
export function setStaticInnerHTML(el, item) {
  if (!el) return;
  const key = _staticTemplateCache.get(item);
  if (key) {
    el.replaceChildren(key.content.cloneNode(true));
    return;
  }
  const enabled2 = _staticInnerHtmlRegistry.get(item);
  if (!enabled2) throw new Error('Unknown static HTML template: ' + item);
  if (typeof document === 'undefined') {
    el.innerHTML = enabled2;
    return;
  }
  const el2 = document.createElement('template');
  ((el2.innerHTML = enabled2),
    _staticTemplateCache.set(item, el2),
    el.replaceChildren(el2.content.cloneNode(true)));
}
export function clearElement(enabled3) {
  if (!enabled3) return;
  enabled3.replaceChildren();
}
export function setText(el3, index) {
  if (!el3) return;
  el3.textContent = index == null ? '' : String(index);
}
export function setTextWithLineBreaks(el4, result) {
  if (!el4) return;
  el4.replaceChildren();
  const data = result == null ? '' : String(result),
    list = data.split('\n');
  for (let count = 0; count < list.length; count++) {
    if (count > 0) el4.appendChild(document.createElement('br'));
    el4.appendChild(document.createTextNode(list[count]));
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
function _sanitizeSvgNode(enabled4) {
  if (!enabled4 || enabled4.nodeType !== Node.ELEMENT_NODE) return null;
  const options = String(enabled4.tagName || '').toLowerCase();
  if (!_ALLOWED_SVG_TAGS.has(options)) return null;
  const el5 = document.createElementNS(_SVG_NS, options);
  for (const el6 of Array.from(enabled4.attributes || [])) {
    const enabled5 = el6.name,
      target = el6.value;
    if (!enabled5) continue;
    const source = enabled5.toLowerCase();
    if (source.startsWith('on')) continue;
    if (source === 'href' || source === 'xlink:href') continue;
    if (!_ALLOWED_SVG_ATTRS.has(enabled5)) continue;
    el5.setAttribute(enabled5, target);
  }
  for (const next of Array.from(enabled4.childNodes || [])) {
    if (next.nodeType === Node.ELEMENT_NODE) {
      const _sanitizeSvgNode2 = _sanitizeSvgNode(next);
      if (_sanitizeSvgNode2) el5.appendChild(_sanitizeSvgNode2);
    }
  }
  return el5;
}
export function createSafeSvg(current) {
  if (typeof current !== 'string') return null;
  const enabled6 = current.trim();
  if (!enabled6) return null;
  const el7 = new DOMParser().parseFromString(enabled6, 'image/svg+xml');
  if (el7.querySelector('parsererror')) return null;
  const enabled7 = el7.documentElement;
  if (!enabled7 || String(enabled7.tagName || '').toLowerCase() !== 'svg') return null;
  const el8 = _sanitizeSvgNode(enabled7);
  if (!el8) return null;
  if (!el8.getAttribute('focusable')) el8.setAttribute('focusable', 'false');
  if (!el8.getAttribute('aria-hidden')) el8.setAttribute('aria-hidden', 'true');
  return el8;
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
function _escapeHtmlText(entry) {
  return String(entry ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function _escapeHtmlAttr(record) {
  return _escapeHtmlText(record).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function _stripHtmlTags(payload) {
  return String(payload ?? '').replace(/<\/?[^>]+>/g, '');
}
function _stripDangerousHtml(handle) {
  let state = String(handle ?? '');
  return (
    _DANGEROUS_HTML_TAGS.forEach((item2) => {
      const regExp = new RegExp('<' + item2 + '\\b[^>]*>[\\s\\S]*?<\\/' + item2 + '\\s*>', 'gi'),
        regExp2 = new RegExp('<\\/?' + item2 + '\\b[^>]*\\/?>', 'gi');
      ((state = state.replace(regExp, '')), (state = state.replace(regExp2, '')));
    }),
    state
  );
}
function _extractHtmlAttr(config, scope) {
  const input = String(config ?? ''),
    output = String(scope || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    regExp3 = new RegExp(output + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'),
    value2 = input.match(regExp3);
  if (value2) return value2[2] ?? value2[3] ?? '';
  const regExp4 = new RegExp(output + '\\s*=\\s*([^\\s"\'>]+)', 'i'),
    value3 = input.match(regExp4);
  return value3 ? (value3[1] ?? '') : '';
}
function _classAttrContains(value4, value5) {
  const _extractHtmlAttr2 = _extractHtmlAttr(value4, 'class');
  return String(_extractHtmlAttr2 || '')
    .split(/\s+/)
    .filter(Boolean)
    .includes(String(value5 || ''));
}
function _replaceAllowedTagsWithTokens(value6, list2) {
  const list3 = [],
    pushToken = (value7) => {
      const value8 = '__AIC_HTML_TOKEN_' + list3.length + '__';
      return (list3.push(String(value7 ?? '')), value8);
    };
  let output2 = String(value6 ?? '');
  const run = (value9) => {
    const regExp5 = new RegExp('<' + value9 + '\\b[^>]*>', 'gi'),
      regExp6 = new RegExp('<\\/' + value9 + '\\s*>', 'gi');
    ((output2 = output2.replace(regExp5, () => pushToken('<' + value9 + '>'))),
      (output2 = output2.replace(regExp6, () => pushToken('</' + value9 + '>'))));
  };
  return (
    list2.forEach((item3) => {
      if (item3 === 'br' || item3 === 'hr') {
        const regExp7 = new RegExp('<' + item3 + '\\b[^>]*\\/?>', 'gi');
        output2 = output2.replace(regExp7, () => pushToken('<' + item3 + '>'));
        return;
      }
      run(item3);
    }),
    {
      output: output2,
      restore() {
        return output2.replace(/__AIC_HTML_TOKEN_(\d+)__/g, (value10, value11) => {
          const value12 = list3[Number(value11)];
          return typeof value12 === 'string' ? value12 : '';
        });
      },
      pushToken: pushToken,
      setOutput(value13) {
        output2 = String(value13 ?? '');
      },
    }
  );
}
function _sanitizePromptHtmlWithoutDom(value14) {
  const ctx = _replaceAllowedTagsWithTokens(_stripDangerousHtml(value14), _PROMPT_CONTAINER_TAGS);
  let value15 = ctx.output
    .replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (value16, value17, value18) => {
      if (!_classAttrContains(value17, 'ref-pill')) return value18;
      const _extractHtmlAttr3 = _extractHtmlAttr(value17, 'data-label') || _stripHtmlTags(value18),
        _stripHtmlTags2 = _stripHtmlTags(_extractHtmlAttr3).replace(/[×✕✖]/g, '').trim(),
        _stripHtmlTags3 = _stripHtmlTags(
          _extractHtmlAttr(value17, 'data-node-id') || _extractHtmlAttr(value17, 'data-nodeId'),
        ).trim(),
        _stripHtmlTags4 = _stripHtmlTags(_extractHtmlAttr(value17, 'data-ref-origin')).trim(),
        _stripHtmlTags5 = _stripHtmlTags(_extractHtmlAttr(value17, 'data-asset-id')).trim(),
        _stripHtmlTags6 = _stripHtmlTags(_extractHtmlAttr(value17, 'data-asset-index')).trim(),
        _stripHtmlTags7 = _stripHtmlTags(_extractHtmlAttr(value17, 'data-ref-type')).trim(),
        _stripHtmlTags8 = _stripHtmlTags(_extractHtmlAttr(value17, 'data-ref-unresolved')).trim(),
        list4 = ['class="ref-pill"', 'contenteditable="false"'];
      if (_stripHtmlTags2) list4.push('data-label="' + _escapeHtmlAttr(_stripHtmlTags2) + '"');
      if (_stripHtmlTags3) list4.push('data-node-id="' + _escapeHtmlAttr(_stripHtmlTags3) + '"');
      if (_stripHtmlTags4 === 'asset') list4.push('data-ref-origin="asset"');
      if (_stripHtmlTags5) list4.push('data-asset-id="' + _escapeHtmlAttr(_stripHtmlTags5) + '"');
      if (_stripHtmlTags6) list4.push('data-asset-index="' + _escapeHtmlAttr(_stripHtmlTags6) + '"');
      if (_stripHtmlTags7) list4.push('data-ref-type="' + _escapeHtmlAttr(_stripHtmlTags7) + '"');
      if (_stripHtmlTags8 === 'true') list4.push('data-ref-unresolved="true"');
      return ctx.pushToken('<span ' + list4.join(' ') + '>' + _escapeHtmlText(_stripHtmlTags2) + '</span>');
    })
    .replace(/<br\b[^>]*\/?>/gi, () => ctx.pushToken('<br>'));
  return (ctx.setOutput(value15.replace(/<\/?[^>]+>/g, '')), ctx.restore());
}
function _sanitizeRichTextHtmlWithoutDom(value19) {
  const ctx2 = _replaceAllowedTagsWithTokens(_stripDangerousHtml(value19), _RICH_TEXT_ALLOWED_TAGS);
  return (ctx2.setOutput(ctx2.output.replace(/<\/?[^>]+>/g, '')), ctx2.restore());
}
function _appendSanitizedPromptNode(el9, el10) {
  const count2 = Number(el10?.nodeType);
  if (count2 === 3) {
    el9.appendChild(document.createTextNode(String(el10?.textContent || '')));
    return;
  }
  if (count2 !== 1) return;
  const value20 = String(el10?.tagName || '').toLowerCase();
  if (_DANGEROUS_HTML_TAGS.has(value20)) return;
  if (value20 === 'br') {
    el9.appendChild(document.createElement('br'));
    return;
  }
  if (value20 === 'span' && el10.classList?.contains('ref-pill')) {
    const value21 = String(el10.getAttribute?.('data-label') || el10.dataset?.label || el10.textContent || '')
        .replace(/[×✕✖]/g, '')
        .trim(),
      value22 = String(el10.getAttribute?.('data-node-id') || el10.dataset?.nodeId || '').trim(),
      value23 = String(el10.getAttribute?.('data-ref-origin') || el10.dataset?.refOrigin || '').trim(),
      value24 = String(el10.getAttribute?.('data-asset-id') || el10.dataset?.assetId || '').trim(),
      value25 = String(el10.getAttribute?.('data-asset-index') || el10.dataset?.assetIndex || '').trim(),
      value26 = String(el10.getAttribute?.('data-ref-type') || el10.dataset?.refType || '').trim(),
      value27 = String(
        el10.getAttribute?.('data-ref-unresolved') || el10.dataset?.refUnresolved || '',
      ).trim(),
      el11 = document.createElement('span');
    ((el11.className = 'ref-pill'), el11.setAttribute('contenteditable', 'false'));
    if (value21) el11.setAttribute('data-label', value21);
    if (value22) el11.setAttribute('data-node-id', value22);
    if (value23 === 'asset') el11.setAttribute('data-ref-origin', 'asset');
    if (value24) el11.setAttribute('data-asset-id', value24);
    if (value25) el11.setAttribute('data-asset-index', value25);
    if (value26) el11.setAttribute('data-ref-type', value26);
    if (value27 === 'true') el11.setAttribute('data-ref-unresolved', 'true');
    ((el11.textContent = value21), el9.appendChild(el11));
    return;
  }
  if (_PROMPT_CONTAINER_TAGS.has(value20)) {
    const value28 = document.createElement(value20);
    (Array.from(el10.childNodes || []).forEach((item4) => _appendSanitizedPromptNode(value28, item4)),
      el9.appendChild(value28));
    return;
  }
  Array.from(el10.childNodes || []).forEach((item5) => _appendSanitizedPromptNode(el9, item5));
}
function _appendSanitizedRichTextNode(el12, el13) {
  const count3 = Number(el13?.nodeType);
  if (count3 === 3) {
    el12.appendChild(document.createTextNode(String(el13?.textContent || '')));
    return;
  }
  if (count3 !== 1) return;
  const value29 = String(el13?.tagName || '').toLowerCase();
  if (_DANGEROUS_HTML_TAGS.has(value29)) return;
  if (!_RICH_TEXT_ALLOWED_TAGS.has(value29)) {
    Array.from(el13.childNodes || []).forEach((item6) => _appendSanitizedRichTextNode(el12, item6));
    return;
  }
  const value30 = document.createElement(value29);
  (value29 !== 'br' &&
    value29 !== 'hr' &&
    Array.from(el13.childNodes || []).forEach((item7) => _appendSanitizedRichTextNode(value30, item7)),
    el12.appendChild(value30));
}
function _sanitizeHtmlWithDom(value31, value32) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function')
    throw new Error('Document API is unavailable');
  const el14 = document.createElement('template'),
    el15 = document.createElement('div');
  el14.innerHTML = String(value31 ?? '');
  const list5 = Array.from(el14.content?.childNodes || el14.childNodes || []);
  return (
    list5.forEach((item8) => {
      if (value32 === 'prompt') {
        _appendSanitizedPromptNode(el15, item8);
        return;
      }
      _appendSanitizedRichTextNode(el15, item8);
    }),
    el15.innerHTML || ''
  );
}
export function sanitizePromptHtml(value33) {
  const enabled8 = typeof value33 === 'string' ? value33 : '';
  if (!enabled8.trim()) return '';
  try {
    return _sanitizeHtmlWithDom(enabled8, 'prompt');
  } catch {
    return _sanitizePromptHtmlWithoutDom(enabled8);
  }
}
export function sanitizeRichTextHtml(value34) {
  const enabled9 = typeof value34 === 'string' ? value34 : '';
  if (!enabled9.trim()) return '';
  try {
    return _sanitizeHtmlWithDom(enabled9, 'richText');
  } catch {
    return _sanitizeRichTextHtmlWithoutDom(enabled9);
  }
}
export function createElement(value35, value36 = {}, list6 = null) {
  const el16 = document.createElement(value35);
  Object.entries(value36).forEach(([list7, value37]) => {
    if (list7 === 'className') el16.className = value37;
    else {
      if (list7 === 'dataset')
        Object.entries(value37).forEach(([value38, value39]) => {
          el16.dataset[value38] = value39;
        });
      else
        list7.startsWith('on') && typeof value37 === 'function'
          ? el16.addEventListener(list7.slice(2).toLowerCase(), value37)
          : el16.setAttribute(list7, value37);
    }
  });
  if (list6) {
    if (typeof list6 === 'string') el16.textContent = list6;
    else {
      if (list6 instanceof Node) el16.appendChild(list6);
      else Array.isArray(list6) && el16.append(...list6.filter(Boolean));
    }
  }
  return el16;
}
export function closest(el17, value40) {
  if (!el17) return null;
  if (el17.matches && el17.matches(value40)) return el17;
  return el17.closest ? el17.closest(value40) : null;
}
export function addEvents(el18, value41, value42 = false) {
  Object.entries(value41).forEach(([value43, value44]) => {
    el18.addEventListener(value43, value44, value42);
  });
}
export function removeEvents(el19, value45, value46 = false) {
  Object.entries(value45).forEach(([value47, value48]) => {
    el19.removeEventListener(value47, value48, value46);
  });
}
export function raf(value49) {
  return requestAnimationFrame(value49);
}
export function nextFrame(handler) {
  return new Promise((handler2) => {
    requestAnimationFrame(() => {
      (handler(), handler2());
    });
  });
}
export function debounce(value50, value51 = 300) {
  let setTimeout2 = null;
  return function (...args) {
    (clearTimeout(setTimeout2), (setTimeout2 = setTimeout(() => value50.apply(this, args), value51)));
  };
}
export function throttle(value52, value53 = 100) {
  let enabled10 = false;
  return function (...args2) {
    !enabled10 &&
      (value52.apply(this, args2), (enabled10 = true), setTimeout(() => (enabled10 = false), value53));
  };
}
export function rafSampleLatest(value54) {
  let requestAnimationFrame2 = null,
    value55 = null,
    value56 = null;
  function run2(...args3) {
    ((value55 = args3), (value56 = this));
    if (requestAnimationFrame2 !== null) return;
    requestAnimationFrame2 = requestAnimationFrame(() => {
      requestAnimationFrame2 = null;
      const enabled11 = value55,
        value57 = value56;
      ((value55 = null), (value56 = null));
      if (!enabled11) return;
      value54.apply(value57, enabled11);
    });
  }
  return (
    (run2.cancel = () => {
      if (requestAnimationFrame2 !== null) cancelAnimationFrame(requestAnimationFrame2);
      ((requestAnimationFrame2 = null), (value55 = null), (value56 = null));
    }),
    run2
  );
}
export function waitForElement(value58, value59 = 5000) {
  return new Promise((handler3, handler4) => {
    const value60 = document.querySelector(value58);
    if (value60) {
      handler3(value60);
      return;
    }
    const mutationObserver = new MutationObserver(() => {
      const value61 = document.querySelector(value58);
      value61 && (mutationObserver.disconnect(), clearTimeout(setTimeout3), handler3(value61));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    const setTimeout3 = setTimeout(() => {
      (mutationObserver.disconnect(),
        handler4(new Error('Element ' + value58 + ' not found within ' + value59 + 'ms')));
    }, value59);
  });
}
export function safeRemove(el20) {
  el20 && el20.parentNode && el20.parentNode.removeChild(el20);
}
export function getViewportRect(el21) {
  const top = el21.getBoundingClientRect();
  return {
    top: top.top,
    left: top.left,
    bottom: top.bottom,
    right: top.right,
    width: top.width,
    height: top.height,
  };
}
export function isInViewport(el22, value62 = 0) {
  const box = el22.getBoundingClientRect();
  return (
    box.top >= -value62 &&
    box.left >= -value62 &&
    box.bottom <= window.innerHeight + value62 &&
    box.right <= window.innerWidth + value62
  );
}
export function getDisplayedMediaSizeFromNode(value63, value64) {
  const enabled12 = String(value63 || '').trim();
  if (!enabled12) return { w: 0, h: 0 };
  const el23 = document.getElementById(enabled12);
  if (!el23) return { w: 0, h: 0 };
  const w = readNodeMediaMetricsDataset(el23, value64);
  if (w) return { w: w.w, h: w.h };
  const el24 = el23.querySelector('.img-node-preview') || el23,
    value65 = String(value64 || ''),
    value66 = value65 === 'video' ? 'video' : 'img',
    value67 = Array.from(el24.querySelectorAll(value66));
  let w2 = 0,
    h = 0,
    value68 = -1000000000;
  for (const value69 of value67) {
    const enabled13 = window.getComputedStyle(value69);
    if (!enabled13) continue;
    if (enabled13.display === 'none') continue;
    if (enabled13.visibility === 'hidden') continue;
    if (Number(enabled13.opacity || '1') <= 0.05) continue;
    if (enabled13.pointerEvents === 'none') continue;
    const enabled14 = value65 === 'video' ? value69.videoWidth || 0 : value69.naturalWidth || 0,
      enabled15 = value65 === 'video' ? value69.videoHeight || 0 : value69.naturalHeight || 0;
    if (!enabled14 || !enabled15) continue;
    const value70 = Number(enabled13.zIndex),
      value71 = Number.isFinite(value70) ? value70 : 0;
    value71 >= value68 && ((value68 = value71), (w2 = enabled14), (h = enabled15));
  }
  return { w: w2, h: h };
}
export function getDisplayedVideoMetaFromNode(value72) {
  const enabled16 = String(value72 || '').trim();
  if (!enabled16) return { src: '', w: 0, h: 0 };
  const el25 = document.getElementById(enabled16);
  if (!el25) return { src: '', w: 0, h: 0 };
  const src = readNodeMediaMetricsDataset(el25, 'video');
  if (src?.src) return { src: src.src, w: src.w, h: src.h };
  const el26 = el25.querySelector('.img-node-preview') || el25,
    value73 = Array.from(el26.querySelectorAll('video'));
  let src2 = '',
    w3 = 0,
    h2 = 0,
    value74 = -1000000000;
  for (const value75 of value73) {
    const enabled17 = window.getComputedStyle(value75);
    if (!enabled17) continue;
    if (enabled17.display === 'none') continue;
    if (enabled17.visibility === 'hidden') continue;
    if (Number(enabled17.opacity || '1') <= 0.05) continue;
    if (enabled17.pointerEvents === 'none') continue;
    const enabled18 = String(value75.currentSrc || value75.src || '').trim();
    if (!enabled18) continue;
    const value76 = Number(value75.videoWidth || 0),
      value77 = Number(value75.videoHeight || 0),
      value78 = Number(enabled17.zIndex),
      value79 = Number.isFinite(value78) ? value78 : 0;
    value79 >= value74 &&
      ((value74 = value79),
      (src2 = enabled18),
      (w3 = Number.isFinite(value76) ? value76 : 0),
      (h2 = Number.isFinite(value77) ? value77 : 0));
  }
  return { src: src2, w: w3, h: h2 };
}
