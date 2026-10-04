import {
  WEB_PREVIEW_MAX_TABS,
  getWebPreviewTabDisplayTitle,
  normalizeWebPreviewTabs,
} from '../../modules/webPreviewTabs.js';
import { createIcon } from './webPreviewDomUtils.js';
export class WebPreviewTabBarView {
  constructor({ onActivate: onActivate, onClose: onClose, onAdd: onAdd } = {}) {
    ((this._onActivate = onActivate),
      (this._onClose = onClose),
      (this._onAdd = onAdd),
      (this._root = document.createElement('div')),
      (this._root.className = 'web-preview-tabbar'),
      (this._tabsWrap = document.createElement('div')),
      (this._tabsWrap.className = 'web-preview-tabs'),
      (this._addButton = document.createElement('button')),
      (this._addButton.type = 'button'),
      (this._addButton.className = 'web-preview-tab-add'),
      this._addButton.appendChild(createIcon('M12 5v14M5 12h14', { size: 16 })),
      this._addButton.addEventListener('click', () => this._onAdd?.()),
      this._root.appendChild(this._tabsWrap));
  }
  get ['element']() {
    return this._root;
  }
  ['setTabs'](options = {}) {
    const args = normalizeWebPreviewTabs(options);
    (this._tabsWrap.replaceChildren(
      ...args.tabs.map((item) => this._createTabButton(item, args.activeTabId)),
      this._addButton,
    ),
      (this._addButton.disabled = args.tabs.length >= WEB_PREVIEW_MAX_TABS),
      (this._addButton.hidden = args.tabs.length >= WEB_PREVIEW_MAX_TABS));
  }
  ['_createTabButton'](value, key) {
    const el = document.createElement('div');
    el.className = 'web-preview-tab';
    if (value.id === key) el.classList.add('is-active');
    const el2 = document.createElement('button');
    ((el2.type = 'button'),
      (el2.className = 'web-preview-tab-main'),
      el2.addEventListener('click', () => this._onActivate?.(value.id)));
    if (value.faviconUrl) {
      const el3 = document.createElement('img');
      ((el3.className = 'web-preview-tab-favicon'),
        (el3.src = value.faviconUrl),
        (el3.alt = ''),
        (el3.decoding = 'async'),
        (el3.loading = 'lazy'),
        (el3.referrerPolicy = 'no-referrer'),
        el3.addEventListener('error', () => el3.remove()),
        el2.appendChild(el3));
    }
    const el4 = document.createElement('span');
    ((el4.className = 'web-preview-tab-title'),
      (el4.textContent = getWebPreviewTabDisplayTitle(value)),
      el2.appendChild(el4));
    const el5 = document.createElement('button');
    return (
      (el5.type = 'button'),
      (el5.className = 'web-preview-tab-close'),
      el5.appendChild(createIcon('M18 6 6 18M6 6l12 12', { size: 13 })),
      el5.addEventListener('click', (event) => {
        (event.stopPropagation(), this._onClose?.(value.id));
      }),
      el.appendChild(el2),
      el.appendChild(el5),
      el
    );
  }
}
