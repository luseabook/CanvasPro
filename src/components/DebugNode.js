import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
function debugNodeText(_0x2ec791, _0xe91af3 = {}) {
  return t('debugNode.' + _0x2ec791, _0xe91af3);
}
export class DebugNode {
  constructor(_0x1f2dc1) {
    ((this._data = _0x1f2dc1),
      (this.nodeId = _0x1f2dc1.id),
      (this.contentEl = null),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const _0x295995 = document.createElement('div');
    (Object.assign(_0x295995.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      pointerEvents: 'auto',
    }),
      (this._root = _0x295995));
    const _0x2f2dc2 = document.createElement('div');
    (Object.assign(_0x2f2dc2.style, {
      padding: '8px 12px',
      background: 'var(--debug-header-bg)',
      borderBottom: '1px solid var(--debug-header-border)',
      color: 'var(--debug-header-text)',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      cursor: 'move',
    }),
      _0x2f2dc2.replaceChildren());
    const _0x3a2a14 = 'http://www.w3.org/2000/svg',
      _0x57d566 = document.createElementNS(_0x3a2a14, 'svg');
    (_0x57d566.setAttribute('width', '14'),
      _0x57d566.setAttribute('height', '14'),
      _0x57d566.setAttribute('viewBox', '0 0 24 24'),
      _0x57d566.setAttribute('fill', 'none'),
      _0x57d566.setAttribute('stroke', 'currentColor'),
      _0x57d566.setAttribute('stroke-width', '2'));
    const _0xda1dc2 = document.createElementNS(_0x3a2a14, 'path');
    (_0xda1dc2.setAttribute(
      'd',
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ),
      _0x57d566.appendChild(_0xda1dc2),
      _0x2f2dc2.appendChild(_0x57d566),
      (this._headerLabel = document.createTextNode(debugNodeText('title'))),
      _0x2f2dc2.appendChild(this._headerLabel),
      _0x295995.appendChild(_0x2f2dc2),
      (this.contentEl = document.createElement('div')),
      (this.contentEl.className = 'debug-output-content custom-scrollbar'),
      Object.assign(this.contentEl.style, {
        flex: '1',
        margin: '0',
        padding: '12px',
        background: 'var(--debug-body-bg)',
        border: 'none',
        outline: 'none',
        color: 'var(--debug-body-text)',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        pointerEvents: 'auto',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        cursor: 'text',
      }),
      this.contentEl.setAttribute('contenteditable', 'true'),
      this.contentEl.style.setProperty('user-select', 'text', 'important'),
      this.contentEl.style.setProperty('-webkit-user-select', 'text', 'important'),
      this.contentEl.addEventListener('keydown', (_0x22c393) => {
        if ((_0x22c393.ctrlKey || _0x22c393.metaKey) && (_0x22c393.key === 'c' || _0x22c393.key === 'a'))
          return;
        _0x22c393.preventDefault();
      }),
      this.contentEl.addEventListener('input', (_0x410044) => {
        _0x410044.preventDefault();
      }));
    this._data.outputText
      ? (this.contentEl.textContent = this._data.outputText)
      : ((this.contentEl.textContent = debugNodeText('empty')),
        (this.contentEl.style.color = 'var(--text-muted)'));
    (this.contentEl.addEventListener(
      'wheel',
      (_0x509133) => {
        _0x509133.stopPropagation();
      },
      { passive: true },
    ),
      this.contentEl.addEventListener('mousedown', (_0x22e8e4) => {
        _0x22e8e4.stopPropagation();
      }),
      this.contentEl.addEventListener('pointerdown', (_0x55131f) => {
        _0x55131f.stopPropagation();
      }),
      _0x295995.appendChild(this.contentEl));
    const _0x368493 = document.createElement('div');
    return (
      (_0x368493.className = 'group-resizer'),
      (_0x368493.style.pointerEvents = 'auto'),
      _0x368493.addEventListener('pointerdown', (_0x10c4bc) => {
        (_0x10c4bc.stopPropagation(), _0x10c4bc.preventDefault());
        const _0x9593e1 = _0x10c4bc.clientX,
          _0x1f3d0b = _0x10c4bc.clientY,
          _0x4625ce = this._data.width || 0x12c,
          _0x18fb16 = this._data.height || 200,
          _0x4f4ebf = (_0x236952) => {
            const { viewport: _0x117596 } = appStore.getState(),
              _0x4c1d0f = (_0x236952.clientX - _0x9593e1) / _0x117596.zoom,
              _0x4d99cd = (_0x236952.clientY - _0x1f3d0b) / _0x117596.zoom;
            appStore.updateNodeData(this.nodeId, {
              width: Math.max(200, _0x4625ce + _0x4c1d0f),
              height: Math.max(120, _0x18fb16 + _0x4d99cd),
            });
          },
          _0x3111b5 = () => {
            (window.removeEventListener('pointermove', _0x4f4ebf),
              window.removeEventListener('pointerup', _0x3111b5));
          };
        (window.addEventListener('pointermove', _0x4f4ebf), window.addEventListener('pointerup', _0x3111b5));
      }),
      _0x295995.appendChild(_0x368493),
      _0x295995
    );
  }
  ['update'](_0x28b3fe) {
    ((this._data = _0x28b3fe),
      this.contentEl &&
        document.activeElement !== this.contentEl &&
        (_0x28b3fe.outputText
          ? ((this.contentEl.textContent = _0x28b3fe.outputText),
            (this.contentEl.style.color = 'var(--debug-body-text)'))
          : ((this.contentEl.textContent = debugNodeText('empty')),
            (this.contentEl.style.color = 'var(--text-muted)'))));
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_syncLocaleTexts']() {
    if (this._headerLabel) this._headerLabel.textContent = debugNodeText('title');
    this.contentEl && !this._data?.outputText && (this.contentEl.textContent = debugNodeText('empty'));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}
