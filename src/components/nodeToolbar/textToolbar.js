import { showError, showWarning } from '../../services/index.js';
import { markSystemClipboardWrite } from '../../modules/clipboard.js';
import appStore from '../../core/stores/appStore.js';
import { registerStaticInnerHTML, sanitizeRichTextHtml } from '../../utils/dom.js';
import { TEXT_TOOLBAR_HTML } from './textToolbarHtml.js';
import { bindStoryboardScriptToolbarAction } from './storyboardScriptAction.js';
import { t } from '../../i18n/index.js';
export { TEXT_TOOLBAR_HTML };
registerStaticInnerHTML('toolbar:text', TEXT_TOOLBAR_HTML);
function textToolbarText(_0x2d497a) {
  return t('nodeToolbar.text.' + _0x2d497a);
}
export function bindTextToolbarEvents(_0xd3f677, _0x332cec, _0x19c3fc) {
  if (!_0xd3f677) return;
  (_0xd3f677.addEventListener('pointerdown', (_0x16c923) => _0x16c923.stopPropagation()),
    _0xd3f677.addEventListener('dblclick', (_0x141c79) => {
      (_0x141c79.preventDefault(), _0x141c79.stopPropagation());
    }));
  const _0x254978 = (..._0x3b1190) => {
      for (const _0x3caf5c of _0x3b1190) {
        if (typeof _0x3caf5c === 'string') return _0x3caf5c;
      }
      return '';
    },
    _0x11bf4a = () => {
      const _0x32541f = typeof _0x332cec?.id === 'string' ? _0x332cec.id : '';
      if (!_0x32541f) return _0x332cec || {};
      const _0x51bfc9 =
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
      return _0x51bfc9?.nodes?.[_0x32541f] || _0x332cec || {};
    },
    _0x841bda = (_0x3b7c9f) => String(_0x3b7c9f ?? '').replace(/\r\n?/g, '\n'),
    _0x15c822 = (_0x34353b) => _0x841bda(_0x34353b).replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ''),
    _0x354805 = (_0x3ac247) => {
      const _0x40b92e = _0x15c822(_0x3ac247);
      return _0x40b92e
        .split('\n')
        .filter((_0x1fdb0c) => _0x1fdb0c.trim() !== '')
        .join('\n');
    },
    _0xe099c1 = (_0x183805) => {
      const _0x39a554 = sanitizeRichTextHtml(typeof _0x183805 === 'string' ? _0x183805 : '');
      if (!_0x39a554.trim()) return '';
      const _0x852eb3 = document.createElement('div');
      _0x852eb3.innerHTML = _0x39a554;
      const _0x263aea = (_0x4d875b) =>
          _0x4d875b?.nodeType === Node.ELEMENT_NODE && String(_0x4d875b.tagName || '').toLowerCase() === 'br',
        _0x40b043 = (_0x21cc19) => {
          const _0x26543c = String(_0x21cc19?.tagName || '').toLowerCase(),
            _0x26a9b0 =
              _0x26543c === 'hr' || !!_0x21cc19.querySelector?.('img, video, audio, canvas, svg, iframe, hr'),
            _0x1d3855 = _0x15c822(_0x21cc19.innerText || _0x21cc19.textContent || '').trim();
          return !!_0x1d3855 || _0x26a9b0;
        },
        _0x6f95cc = [];
      let _0x8b9ba3 = false,
        _0xa608ca = false;
      return (
        Array.from(_0x852eb3.childNodes).forEach((_0x11766b) => {
          if (_0x11766b.nodeType === Node.TEXT_NODE) {
            if (!_0x15c822(_0x11766b.textContent || '').trim()) return;
            _0xa608ca && (_0x6f95cc.push(document.createElement('br')), (_0xa608ca = false));
            (_0x6f95cc.push(_0x11766b), (_0x8b9ba3 = true));
            return;
          }
          if (_0x11766b.nodeType !== Node.ELEMENT_NODE) return;
          if (_0x263aea(_0x11766b)) {
            if (_0x8b9ba3) _0xa608ca = true;
            return;
          }
          const _0xb4c9c = _0x11766b;
          if (!_0x40b043(_0xb4c9c)) return;
          (_0xa608ca && (_0x6f95cc.push(document.createElement('br')), (_0xa608ca = false)),
            _0x6f95cc.push(_0xb4c9c),
            (_0x8b9ba3 = true));
        }),
        _0x852eb3.replaceChildren(..._0x6f95cc),
        _0x852eb3.innerHTML || ''
      );
    },
    _0x25021d = (_0x3c07f6) => {
      const _0x3dd160 = document.createElement('div');
      return _0x841bda(_0x3c07f6)
        .split('\n')
        .map((_0x3860be) => {
          return ((_0x3dd160.textContent = _0x3860be), _0x3dd160.innerHTML);
        })
        .join('<br>');
    },
    _0x3aba3b = ({ rawText: _0x893cc8, richHtml: _0x7d079d } = {}) => {
      const _0x157842 = typeof _0x893cc8 === 'string' ? _0x893cc8 : '',
        _0x3ec8e6 = sanitizeRichTextHtml(typeof _0x7d079d === 'string' ? _0x7d079d : ''),
        _0x30d43b = typeof _0x332cec?.id === 'string' ? _0x332cec.id : '';
      if (!_0x30d43b) {
        window._triggerLocalCacheSave?.();
        return;
      }
      const _0x15ab8d = _0x11bf4a(),
        _0x4638d9 = String(_0x15ab8d?.type || _0x332cec?.type || ''),
        _0x3ff5fe = {};
      (_0x4638d9 === 'ai-text' ||
        Object.prototype.hasOwnProperty.call(_0x15ab8d || {}, 'outputText') ||
        Object.prototype.hasOwnProperty.call(_0x332cec || {}, 'outputText')) &&
        (_0x3ff5fe.outputText = _0x157842);
      (_0x4638d9 === 'source-text' ||
        _0x4638d9 === 'text' ||
        Object.prototype.hasOwnProperty.call(_0x15ab8d || {}, 'content') ||
        Object.prototype.hasOwnProperty.call(_0x332cec || {}, 'content')) &&
        ((_0x3ff5fe.content = _0x157842), (_0x3ff5fe.contentHtml = _0x3ec8e6));
      if (!Object.keys(_0x3ff5fe).length) _0x3ff5fe.content = _0x157842;
      try {
        (appStore.updateNodeData(_0x30d43b, _0x3ff5fe), Object.assign(_0x332cec, _0x3ff5fe));
      } catch (_0x409cb0) {
        console.warn('[TextToolbar] Persist fullscreen text failed:', _0x409cb0);
      }
      window._triggerLocalCacheSave?.();
    },
    _0x3ef8fa = _0xd3f677.querySelector('.act-copy');
  if (_0x3ef8fa) {
    const _0x419802 = Array.from(_0x3ef8fa.childNodes).map((_0x5b8061) => _0x5b8061.cloneNode(true)),
      _0x4456bf = _0x3ef8fa.getAttribute('data-tooltip') || textToolbarText('copy'),
      _0x1198c7 = _0x3ef8fa.getAttribute('aria-label') || '';
    let _0x31a5ca = null;
    _0x3ef8fa.addEventListener('click', (_0x14e083) => {
      _0x14e083.stopPropagation();
      const _0x1457c7 = _0x19c3fc ? _0x19c3fc() : _0x332cec.content || _0x332cec.resultText || '';
      if (!_0x1457c7) {
        showWarning(textToolbarText('noTextToCopy'));
        return;
      }
      navigator.clipboard
        .writeText(_0x1457c7)
        .then(() => {
          markSystemClipboardWrite({ text: _0x1457c7 });
          _0x31a5ca && (clearTimeout(_0x31a5ca), (_0x31a5ca = null));
          _0x3ef8fa.replaceChildren();
          const _0x55a179 = 'http://www.w3.org/2000/svg',
            _0x3fd82d = document.createElementNS(_0x55a179, 'svg');
          (_0x3fd82d.setAttribute('viewBox', '0 0 24 24'),
            _0x3fd82d.setAttribute('fill', 'none'),
            _0x3fd82d.setAttribute('stroke', 'currentColor'),
            _0x3fd82d.setAttribute('stroke-width', '2'),
            _0x3fd82d.setAttribute('width', '16'),
            _0x3fd82d.setAttribute('height', '16'));
          const _0x440a19 = document.createElementNS(_0x55a179, 'polyline');
          (_0x440a19.setAttribute('points', '20 6 9 17 4 12'),
            _0x3fd82d.appendChild(_0x440a19),
            _0x3ef8fa.appendChild(_0x3fd82d),
            _0x3ef8fa.classList.add('is-copied'),
            _0x3ef8fa.setAttribute('data-tooltip', textToolbarText('copied')),
            _0x3ef8fa.setAttribute('aria-label', textToolbarText('copied')),
            (_0x31a5ca = setTimeout(() => {
              (_0x3ef8fa.replaceChildren(..._0x419802.map((_0x5bebdb) => _0x5bebdb.cloneNode(true))),
                _0x3ef8fa.setAttribute('data-tooltip', _0x4456bf));
              if (_0x1198c7) _0x3ef8fa.setAttribute('aria-label', _0x1198c7);
              else _0x3ef8fa.removeAttribute('aria-label');
              (_0x3ef8fa.classList.remove('is-copied'), (_0x31a5ca = null));
            }, 0x7d0)));
        })
        .catch((_0xf66b7c) => {
          (console.error('复制失败:', _0xf66b7c), showError(textToolbarText('copyFailed')));
        });
    });
  }
  const _0x35a282 = _0xd3f677.querySelector('.act-clear-empty-lines');
  _0x35a282 &&
    _0x35a282.addEventListener('click', (_0x11b88c) => {
      _0x11b88c.stopPropagation();
      const _0x59187f = _0x11bf4a(),
        _0xa42c7 = _0x254978(
          _0x19c3fc ? _0x19c3fc() : undefined,
          _0x59187f?.content,
          _0x59187f?.outputText,
          _0x332cec?.content,
          _0x332cec?.outputText,
          _0x332cec?.resultText,
        ),
        _0x3b6cdd = _0x841bda(_0xa42c7);
      if (!_0x3b6cdd.trim()) {
        showWarning(textToolbarText('noTextToClean'));
        return;
      }
      const _0x13e0bd = _0x354805(_0x3b6cdd);
      if (_0x15c822(_0x13e0bd) === _0x15c822(_0x3b6cdd)) {
        window.showToast?.(textToolbarText('noBlankLines'), 'info');
        return;
      }
      const _0x1269cb = _0x254978(_0x59187f?.contentHtml, _0x332cec?.contentHtml);
      let _0x19c387 = _0xe099c1(_0x1269cb);
      if (_0x1269cb.trim()) {
        const _0x334360 = _0x841bda(_0x1269cb).trim(),
          _0x9b42b = _0x841bda(_0x19c387).trim();
        _0x334360 === _0x9b42b && (_0x19c387 = _0x25021d(_0x13e0bd));
      }
      (_0x3aba3b({ rawText: _0x13e0bd, richHtml: _0x19c387 }),
        window.showToast?.(textToolbarText('clearedBlankLines'), 'success'));
    });
  bindStoryboardScriptToolbarAction({
    toolbarEl: _0xd3f677,
    nodeData: _0x332cec,
    store: appStore,
    getStateSnapshot: () =>
      typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
  });
  const _0x5b43f0 = _0xd3f677.querySelector('.act-fullscreen');
  _0x5b43f0 &&
    _0x5b43f0.addEventListener('click', (_0x4554fd) => {
      _0x4554fd.stopPropagation();
      const _0x51d0e4 = _0x11bf4a(),
        _0x1f41d3 = _0x254978(
          _0x51d0e4?.content,
          _0x51d0e4?.outputText,
          _0x19c3fc ? _0x19c3fc() : undefined,
          _0x332cec?.content,
          _0x332cec?.resultText,
        ),
        _0x581d23 = _0x254978(_0x51d0e4?.contentHtml, _0x332cec?.contentHtml),
        _0x46f00b = sanitizeRichTextHtml(_0x581d23),
        _0x38f430 = document.createElement('div');
      Object.assign(_0x38f430.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-dim)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      });
      const _0x7fed0e = document.createElement('div');
      Object.assign(_0x7fed0e.style, {
        background: 'var(--bg-2)',
        border: '1px solid var(--stroke-08)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1000px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-dialog)',
      });
      const _0x2ee4d8 = document.createElement('div');
      Object.assign(_0x2ee4d8.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--stroke-05)',
      });
      const _0x1afe58 = document.createElement('div'),
        _0x4d8958 = document.createElement('button');
      (_0x4d8958.setAttribute('data-tooltip', textToolbarText('copy')),
        _0x4d8958.setAttribute('aria-label', textToolbarText('copy')),
        Object.assign(_0x4d8958.style, {
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.2s',
        }));
      const _0x62cb84 = 'http://www.w3.org/2000/svg',
        _0x408ace = document.createElementNS(_0x62cb84, 'svg');
      (_0x408ace.setAttribute('viewBox', '0 0 24 24'),
        _0x408ace.setAttribute('fill', 'none'),
        _0x408ace.setAttribute('stroke', 'currentColor'),
        _0x408ace.setAttribute('stroke-width', '2'),
        _0x408ace.setAttribute('width', '16'),
        _0x408ace.setAttribute('height', '16'));
      const _0x425f06 = document.createElementNS(_0x62cb84, 'rect');
      (_0x425f06.setAttribute('x', '9'),
        _0x425f06.setAttribute('y', '9'),
        _0x425f06.setAttribute('width', '13'),
        _0x425f06.setAttribute('height', '13'),
        _0x425f06.setAttribute('rx', '2'),
        _0x425f06.setAttribute('ry', '2'));
      const _0x6b2cc1 = document.createElementNS(_0x62cb84, 'path');
      (_0x6b2cc1.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'),
        _0x408ace.appendChild(_0x425f06),
        _0x408ace.appendChild(_0x6b2cc1),
        _0x4d8958.appendChild(_0x408ace),
        _0x1afe58.appendChild(_0x4d8958),
        (_0x4d8958.onmouseenter = () => (_0x4d8958.style.background = 'var(--white-10)')),
        (_0x4d8958.onmouseleave = () => (_0x4d8958.style.background = 'transparent')));
      const _0x43f5fa = document.createElement('div');
      Object.assign(_0x43f5fa.style, { display: 'flex', alignItems: 'center', gap: '4px' });
      const _0x246628 = (_0x5efb69, _0x591b50, _0x4bf3bc = null, _0x55bd69 = '') => {
          if (_0x5efb69 === '|') {
            const _0x543ed6 = document.createElement('div');
            return (
              Object.assign(_0x543ed6.style, {
                width: '1px',
                height: '14px',
                background: 'var(--stroke-10)',
                margin: '0 4px',
              }),
              _0x543ed6
            );
          }
          const _0xf6071f = document.createElement('button');
          _0x55bd69 &&
            (_0xf6071f.setAttribute('data-tooltip', _0x55bd69),
            _0xf6071f.setAttribute('aria-label', _0x55bd69));
          _0xf6071f.replaceChildren();
          if (_0x5efb69 && typeof _0x5efb69 === 'object' && _0x5efb69.kind === 'svg') {
            const _0x296807 = document.createElementNS(_0x62cb84, 'svg');
            (_0x296807.setAttribute('viewBox', '0 0 24 24'),
              _0x296807.setAttribute('fill', 'none'),
              _0x296807.setAttribute('stroke', 'currentColor'),
              _0x296807.setAttribute('stroke-width', '2'),
              _0x296807.setAttribute('width', '14'),
              _0x296807.setAttribute('height', '14'));
            if (_0x5efb69.name === 'ul') {
              const _0x418635 = document.createElementNS(_0x62cb84, 'line');
              (_0x418635.setAttribute('x1', '8'),
                _0x418635.setAttribute('y1', '6'),
                _0x418635.setAttribute('x2', '21'),
                _0x418635.setAttribute('y2', '6'));
              const _0x3bffba = document.createElementNS(_0x62cb84, 'line');
              (_0x3bffba.setAttribute('x1', '8'),
                _0x3bffba.setAttribute('y1', '12'),
                _0x3bffba.setAttribute('x2', '21'),
                _0x3bffba.setAttribute('y2', '12'));
              const _0x34e0f2 = document.createElementNS(_0x62cb84, 'line');
              (_0x34e0f2.setAttribute('x1', '8'),
                _0x34e0f2.setAttribute('y1', '18'),
                _0x34e0f2.setAttribute('x2', '21'),
                _0x34e0f2.setAttribute('y2', '18'));
              const _0x80049f = document.createElementNS(_0x62cb84, 'line');
              (_0x80049f.setAttribute('x1', '3'),
                _0x80049f.setAttribute('y1', '6'),
                _0x80049f.setAttribute('x2', '3.01'),
                _0x80049f.setAttribute('y2', '6'));
              const _0x33c32d = document.createElementNS(_0x62cb84, 'line');
              (_0x33c32d.setAttribute('x1', '3'),
                _0x33c32d.setAttribute('y1', '12'),
                _0x33c32d.setAttribute('x2', '3.01'),
                _0x33c32d.setAttribute('y2', '12'));
              const _0x31a247 = document.createElementNS(_0x62cb84, 'line');
              (_0x31a247.setAttribute('x1', '3'),
                _0x31a247.setAttribute('y1', '18'),
                _0x31a247.setAttribute('x2', '3.01'),
                _0x31a247.setAttribute('y2', '18'),
                _0x296807.appendChild(_0x418635),
                _0x296807.appendChild(_0x3bffba),
                _0x296807.appendChild(_0x34e0f2),
                _0x296807.appendChild(_0x80049f),
                _0x296807.appendChild(_0x33c32d),
                _0x296807.appendChild(_0x31a247));
            } else {
              if (_0x5efb69.name === 'ol') {
                const _0x1498a8 = document.createElementNS(_0x62cb84, 'line');
                (_0x1498a8.setAttribute('x1', '10'),
                  _0x1498a8.setAttribute('y1', '6'),
                  _0x1498a8.setAttribute('x2', '21'),
                  _0x1498a8.setAttribute('y2', '6'));
                const _0x69ba1a = document.createElementNS(_0x62cb84, 'line');
                (_0x69ba1a.setAttribute('x1', '10'),
                  _0x69ba1a.setAttribute('y1', '12'),
                  _0x69ba1a.setAttribute('x2', '21'),
                  _0x69ba1a.setAttribute('y2', '12'));
                const _0x40c440 = document.createElementNS(_0x62cb84, 'line');
                (_0x40c440.setAttribute('x1', '10'),
                  _0x40c440.setAttribute('y1', '18'),
                  _0x40c440.setAttribute('x2', '21'),
                  _0x40c440.setAttribute('y2', '18'));
                const _0x5dec60 = document.createElementNS(_0x62cb84, 'path');
                _0x5dec60.setAttribute('d', 'M4 6h1v4');
                const _0x14b427 = document.createElementNS(_0x62cb84, 'path');
                _0x14b427.setAttribute('d', 'M4 10h2');
                const _0xcf9b8c = document.createElementNS(_0x62cb84, 'path');
                (_0xcf9b8c.setAttribute('d', 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'),
                  _0x296807.appendChild(_0x1498a8),
                  _0x296807.appendChild(_0x69ba1a),
                  _0x296807.appendChild(_0x40c440),
                  _0x296807.appendChild(_0x5dec60),
                  _0x296807.appendChild(_0x14b427),
                  _0x296807.appendChild(_0xcf9b8c));
              }
            }
            _0xf6071f.appendChild(_0x296807);
          } else {
            _0xf6071f.textContent = String(_0x5efb69 ?? '');
            if (_0x5efb69 === 'B') _0xf6071f.style.fontWeight = '700';
            if (_0x5efb69 === 'I') _0xf6071f.style.fontStyle = 'italic';
            ((_0x5efb69 === 'H₁' || _0x5efb69 === 'H₂' || _0x5efb69 === 'H₃') &&
              ((_0xf6071f.style.fontSize = '12px'), (_0xf6071f.style.fontWeight = '700')),
              _0x5efb69 === '¶' &&
                ((_0xf6071f.style.fontSize = '14px'), (_0xf6071f.style.fontWeight = '700')));
          }
          return (
            Object.assign(_0xf6071f.style, {
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontFamily: 'serif',
              transition: 'all 0.2s',
            }),
            (_0xf6071f.onmouseenter = () => (_0xf6071f.style.background = 'var(--white-10)')),
            (_0xf6071f.onmouseleave = () => (_0xf6071f.style.background = 'transparent')),
            (_0xf6071f.onclick = (_0x5cd6af) => {
              (_0x5cd6af.preventDefault(), document.execCommand(_0x591b50, false, _0x4bf3bc));
            }),
            _0xf6071f
          );
        },
        _0x3ab784 = [
          { l: 'H₁', c: 'formatBlock', v: 'H1', tooltip: textToolbarText('heading1') },
          { l: 'H₂', c: 'formatBlock', v: 'H2', tooltip: textToolbarText('heading2') },
          { l: 'H₃', c: 'formatBlock', v: 'H3', tooltip: textToolbarText('heading3') },
          { l: '¶', c: 'formatBlock', v: 'P', tooltip: textToolbarText('paragraph') },
          { l: '|' },
          { l: 'B', c: 'bold', tooltip: textToolbarText('bold') },
          { l: 'I', c: 'italic', tooltip: textToolbarText('italic') },
          { l: '|' },
          {
            l: { kind: 'svg', name: 'ul' },
            c: 'insertUnorderedList',
            tooltip: textToolbarText('unorderedList'),
          },
          { l: { kind: 'svg', name: 'ol' }, c: 'insertOrderedList', tooltip: textToolbarText('orderedList') },
          { l: '|' },
          { l: '—', c: 'insertHorizontalRule', tooltip: textToolbarText('divider') },
        ];
      _0x3ab784.forEach((_0x5ca9b9) =>
        _0x43f5fa.appendChild(_0x246628(_0x5ca9b9.l, _0x5ca9b9.c, _0x5ca9b9.v, _0x5ca9b9.tooltip)),
      );
      const _0x12aa4d = document.createElement('div'),
        _0x5d9186 = document.createElement('button');
      (_0x5d9186.setAttribute('data-tooltip', textToolbarText('close')),
        _0x5d9186.setAttribute('aria-label', textToolbarText('close')),
        Object.assign(_0x5d9186.style, {
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.2s',
        }));
      const _0x2700c9 = document.createElementNS(_0x62cb84, 'svg');
      (_0x2700c9.setAttribute('viewBox', '0 0 24 24'),
        _0x2700c9.setAttribute('fill', 'none'),
        _0x2700c9.setAttribute('stroke', 'currentColor'),
        _0x2700c9.setAttribute('stroke-width', '2'),
        _0x2700c9.setAttribute('width', '16'),
        _0x2700c9.setAttribute('height', '16'));
      const _0x3cd1b7 = document.createElementNS(_0x62cb84, 'path');
      _0x3cd1b7.setAttribute('d', 'M18 6L6 18');
      const _0x58bc4a = document.createElementNS(_0x62cb84, 'path');
      (_0x58bc4a.setAttribute('d', 'M6 6l12 12'),
        _0x2700c9.appendChild(_0x3cd1b7),
        _0x2700c9.appendChild(_0x58bc4a),
        _0x5d9186.appendChild(_0x2700c9),
        _0x12aa4d.appendChild(_0x5d9186),
        (_0x5d9186.onmouseenter = () => (_0x5d9186.style.background = 'var(--white-10)')),
        (_0x5d9186.onmouseleave = () => (_0x5d9186.style.background = 'transparent')),
        _0x2ee4d8.appendChild(_0x1afe58),
        _0x2ee4d8.appendChild(_0x43f5fa),
        _0x2ee4d8.appendChild(_0x12aa4d));
      const _0x10d505 = document.createElement('div');
      (Object.assign(_0x10d505.style, {
        flex: '1',
        padding: '40px 60px',
        overflowY: 'auto',
        color: 'var(--text-secondary)',
        fontSize: '16px',
        lineHeight: '1.8',
        outline: 'none',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }),
        (_0x10d505.contentEditable = 'true'),
        (_0x10d505.spellcheck = false));
      _0x46f00b ? (_0x10d505.innerHTML = _0x46f00b) : (_0x10d505.textContent = _0x1f41d3);
      ((_0x10d505.className = 'v2-rt-editor'),
        _0x7fed0e.appendChild(_0x2ee4d8),
        _0x7fed0e.appendChild(_0x10d505),
        (_0x4d8958.onclick = () => {
          const _0x522d08 = _0x10d505.innerText || '';
          navigator.clipboard.writeText(_0x522d08).then(() => {
            markSystemClipboardWrite({ text: _0x522d08 });
            const _0x480e14 = Array.from(_0x4d8958.childNodes).map((_0x20564e) => _0x20564e.cloneNode(true));
            _0x4d8958.replaceChildren();
            const _0x223178 = document.createElementNS(_0x62cb84, 'svg');
            (_0x223178.setAttribute('viewBox', '0 0 24 24'),
              _0x223178.setAttribute('fill', 'none'),
              _0x223178.setAttribute('stroke', 'currentColor'),
              _0x223178.setAttribute('stroke-width', '2'),
              _0x223178.setAttribute('width', '16'),
              _0x223178.setAttribute('height', '16'));
            const _0x579698 = document.createElementNS(_0x62cb84, 'polyline');
            (_0x579698.setAttribute('points', '20 6 9 17 4 12'),
              _0x223178.appendChild(_0x579698),
              _0x4d8958.appendChild(_0x223178),
              setTimeout(() => {
                _0x4d8958.replaceChildren(..._0x480e14.map((_0x52a7e3) => _0x52a7e3.cloneNode(true)));
              }, 0x7d0));
          });
        }),
        _0x7fed0e.addEventListener('click', (_0x342193) => _0x342193.stopPropagation()));
      const _0x2aca54 = () => {
        (_0x3aba3b({
          rawText: _0x10d505.innerText || '',
          richHtml: sanitizeRichTextHtml(_0x10d505.innerHTML || ''),
        }),
          _0x38f430.remove());
      };
      ((_0x5d9186.onclick = _0x2aca54),
        _0x38f430.addEventListener('click', (_0x16cdbe) => {
          if (_0x16cdbe.target === _0x38f430) _0x2aca54();
        }),
        _0x38f430.appendChild(_0x7fed0e),
        document.body.appendChild(_0x38f430),
        window._triggerLocalCacheSave?.(),
        setTimeout(() => _0x10d505.focus(), 50));
    });
}
