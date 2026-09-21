import {
  WEB_PREVIEW_MAX_TABS,
  getWebPreviewTabDisplayTitle,
  normalizeWebPreviewTabs,
} from '../../modules/webPreviewTabs.js';
import { createIcon } from './webPreviewDomUtils.js';
export class WebPreviewTabBarView {
  constructor({ onActivate: _0x34dedd, onClose: _0x286cee, onAdd: _0x4289b1 } = {}) {
    ((this._onActivate = _0x34dedd),
      (this._onClose = _0x286cee),
      (this._onAdd = _0x4289b1),
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
  ['setTabs'](_0x274082 = {}) {
    const _0x1aed64 = normalizeWebPreviewTabs(_0x274082);
    (this._tabsWrap.replaceChildren(
      ..._0x1aed64.tabs.map((_0xa801c1) => this._createTabButton(_0xa801c1, _0x1aed64.activeTabId)),
      this._addButton,
    ),
      (this._addButton.disabled = _0x1aed64.tabs.length >= WEB_PREVIEW_MAX_TABS),
      (this._addButton.hidden = _0x1aed64.tabs.length >= WEB_PREVIEW_MAX_TABS));
  }
  ['_createTabButton'](_0x1915b9, _0x5cd0ee) {
    const _0x546fe4 = document.createElement('div');
    _0x546fe4.className = 'web-preview-tab';
    if (_0x1915b9.id === _0x5cd0ee) _0x546fe4.classList.add('is-active');
    const _0x1af7e8 = document.createElement('button');
    ((_0x1af7e8.type = 'button'),
      (_0x1af7e8.className = 'web-preview-tab-main'),
      _0x1af7e8.addEventListener('click', () => this._onActivate?.(_0x1915b9.id)));
    if (_0x1915b9.faviconUrl) {
      const _0x24e83c = document.createElement('img');
      ((_0x24e83c.className = 'web-preview-tab-favicon'),
        (_0x24e83c.src = _0x1915b9.faviconUrl),
        (_0x24e83c.alt = ''),
        (_0x24e83c.decoding = 'async'),
        (_0x24e83c.loading = 'lazy'),
        (_0x24e83c.referrerPolicy = 'no-referrer'),
        _0x24e83c.addEventListener('error', () => _0x24e83c.remove()),
        _0x1af7e8.appendChild(_0x24e83c));
    }
    const _0x3f2003 = document.createElement('span');
    ((_0x3f2003.className = 'web-preview-tab-title'),
      (_0x3f2003.textContent = getWebPreviewTabDisplayTitle(_0x1915b9)),
      _0x1af7e8.appendChild(_0x3f2003));
    const _0x4de98f = document.createElement('button');
    return (
      (_0x4de98f.type = 'button'),
      (_0x4de98f.className = 'web-preview-tab-close'),
      _0x4de98f.appendChild(createIcon('M18 6 6 18M6 6l12 12', { size: 13 })),
      _0x4de98f.addEventListener('click', (_0x48aadf) => {
        (_0x48aadf.stopPropagation(), this._onClose?.(_0x1915b9.id));
      }),
      _0x546fe4.appendChild(_0x1af7e8),
      _0x546fe4.appendChild(_0x4de98f),
      _0x546fe4
    );
  }
}
