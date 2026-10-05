import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
function debugNodeText(value, item = {}) {
  return t('debugNode.' + value, item);
}
export class DebugNode {
  constructor(key) {
    ((this._data = key), (this.nodeId = key.id), (this.contentEl = null), (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const el = document.createElement('div');
    (Object.assign(el.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      pointerEvents: 'auto',
    }),
      (this._root = el));
    const el2 = document.createElement('div');
    (Object.assign(el2.style, {
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
      el2.replaceChildren());
    const index = 'http://www.w3.org/2000/svg',
      el3 = document.createElementNS(index, 'svg');
    (el3.setAttribute('width', '14'),
      el3.setAttribute('height', '14'),
      el3.setAttribute('viewBox', '0 0 24 24'),
      el3.setAttribute('fill', 'none'),
      el3.setAttribute('stroke', 'currentColor'),
      el3.setAttribute('stroke-width', '2'));
    const el4 = document.createElementNS(index, 'path');
    (el4.setAttribute(
      'd',
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ),
      el3.appendChild(el4),
      el2.appendChild(el3),
      (this._headerLabel = document.createTextNode(debugNodeText('title'))),
      el2.appendChild(this._headerLabel),
      el.appendChild(el2),
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
      this.contentEl.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'a')) return;
        event.preventDefault();
      }),
      this.contentEl.addEventListener('input', (event2) => {
        event2.preventDefault();
      }));
    this._data.outputText
      ? (this.contentEl.textContent = this._data.outputText)
      : ((this.contentEl.textContent = debugNodeText('empty')),
        (this.contentEl.style.color = 'var(--text-muted)'));
    (this.contentEl.addEventListener(
      'wheel',
      (event3) => {
        event3.stopPropagation();
      },
      { passive: true },
    ),
      this.contentEl.addEventListener('mousedown', (event4) => {
        event4.stopPropagation();
      }),
      this.contentEl.addEventListener('pointerdown', (event5) => {
        event5.stopPropagation();
      }),
      el.appendChild(this.contentEl));
    const el5 = document.createElement('div');
    return (
      (el5.className = 'group-resizer'),
      (el5.style.pointerEvents = 'auto'),
      el5.addEventListener('pointerdown', (event6) => {
        (event6.stopPropagation(), event6.preventDefault());
        const result = event6.clientX,
          data = event6.clientY,
          options = this._data.width || 300,
          target = this._data.height || 200,
          source = (event7) => {
            const { viewport: viewport } = appStore.getState(),
              next = (event7.clientX - result) / viewport.zoom,
              current = (event7.clientY - data) / viewport.zoom;
            appStore.updateNodeData(this.nodeId, {
              width: Math.max(200, options + next),
              height: Math.max(120, target + current),
            });
          },
          entry = () => {
            (window.removeEventListener('pointermove', source),
              window.removeEventListener('pointerup', entry));
          };
        (window.addEventListener('pointermove', source), window.addEventListener('pointerup', entry));
      }),
      el.appendChild(el5),
      el
    );
  }
  ['update'](record) {
    ((this._data = record),
      this.contentEl &&
        document.activeElement !== this.contentEl &&
        (record.outputText
          ? ((this.contentEl.textContent = record.outputText),
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
