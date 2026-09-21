import {
  addWebPreviewShortcut,
  deleteWebPreviewHistoryUrl,
  deleteWebPreviewShortcut,
  getWebPreviewStartPageTiles,
  pinWebPreviewUrl,
  renameWebPreviewShortcut,
  unpinWebPreviewShortcut,
} from '../../services/webPreviewStartPageService.js';
import { getWebPreviewDefaultStatusText } from './webPreviewConstants.js';
import { createIcon, stopNodeDragPropagation } from './webPreviewDomUtils.js';
import { t } from '../../i18n/index.js';
function webPreviewText(_0x42d1e0, _0x1438fc = {}) {
  return t('webPreview.' + _0x42d1e0, _0x1438fc);
}
export class WebPreviewStartPageView {
  constructor({
    statusText: statusText = getWebPreviewDefaultStatusText(),
    onOpenUrl: _0x10b722,
    showToast: showToast = globalThis.window?.showToast,
  } = {}) {
    ((this._statusText = statusText),
      (this._onOpenUrl = _0x10b722),
      (this._showToast = showToast),
      (this._statusIsDefault =
        !String(statusText || '').trim() || statusText === getWebPreviewDefaultStatusText()),
      (this._root = null),
      (this._title = null),
      (this._emptyInput = null),
      (this._emptySubmit = null),
      (this._hint = null),
      (this._shortcutGrid = null),
      (this._shortcutEditor = null),
      (this._shortcutEditorMode = 'add'),
      (this._shortcutEditorTarget = null),
      (this._shortcutTitleInput = null),
      (this._shortcutUrlInput = null),
      (this._shortcutCancelButton = null),
      (this._shortcutSaveButton = null),
      (this._openShortcutMenuKey = ''));
  }
  get ['element']() {
    return this._root;
  }
  get ['input']() {
    return this._emptyInput;
  }
  ['mount']() {
    if (this._root) return this._root;
    const _0x30fa97 = document.createElement('div');
    _0x30fa97.className = 'web-preview-placeholder';
    const _0x4ec7ad = document.createElement('div');
    ((_0x4ec7ad.className = 'web-preview-placeholder-icon'),
      _0x4ec7ad.appendChild(createIcon('M3 4h18v16H3zM3 9h18M8 4v5', { size: 30, strokeWidth: 1.7 })),
      _0x30fa97.appendChild(_0x4ec7ad));
    const _0x24e2f6 = document.createElement('div');
    ((_0x24e2f6.className = 'web-preview-placeholder-title'),
      (_0x24e2f6.textContent = webPreviewText('startPage.title')));
    const _0x5c85b2 = document.createElement('div');
    ((_0x5c85b2.className = 'web-preview-placeholder-hint'), (_0x5c85b2.textContent = this._statusText));
    const _0x1904a9 = document.createElement('form');
    ((_0x1904a9.className = 'web-preview-empty-form'),
      _0x1904a9.addEventListener('pointerdown', stopNodeDragPropagation));
    const _0x57d473 = document.createElement('input');
    ((_0x57d473.className = 'web-preview-empty-input'),
      (_0x57d473.type = 'text'),
      (_0x57d473.inputMode = 'search'),
      (_0x57d473.placeholder = webPreviewText('addressPlaceholder')),
      _0x57d473.addEventListener('keydown', (_0x3f283a) => {
        _0x3f283a.stopPropagation();
        if (_0x3f283a.key === 'Escape') _0x57d473.blur();
      }),
      _0x1904a9.addEventListener('submit', (_0x1e1ab3) => {
        (_0x1e1ab3.preventDefault(), this._onOpenUrl?.(_0x57d473.value));
      }));
    const _0x573fac = document.createElement('button');
    ((_0x573fac.className = 'web-preview-empty-submit'),
      (_0x573fac.type = 'submit'),
      (_0x573fac.title = webPreviewText('toolbar.open')),
      _0x573fac.appendChild(createIcon('M5 12h14M13 5l7 7-7 7', { size: 15 })),
      _0x1904a9.appendChild(_0x57d473),
      _0x1904a9.appendChild(_0x573fac));
    const _0x2f0f11 = document.createElement('div');
    _0x2f0f11.className = 'web-preview-shortcuts';
    const _0x4c5dd0 = this._createShortcutEditor();
    return (
      _0x30fa97.appendChild(_0x24e2f6),
      _0x30fa97.appendChild(_0x1904a9),
      _0x30fa97.appendChild(_0x5c85b2),
      _0x30fa97.appendChild(_0x2f0f11),
      _0x30fa97.appendChild(_0x4c5dd0),
      (this._root = _0x30fa97),
      (this._title = _0x24e2f6),
      (this._emptyInput = _0x57d473),
      (this._emptySubmit = _0x573fac),
      (this._hint = _0x5c85b2),
      (this._shortcutGrid = _0x2f0f11),
      (this._shortcutEditor = _0x4c5dd0),
      this.renderTiles(),
      _0x30fa97
    );
  }
  ['setStatus'](_0x45d54b) {
    const _0x5793e6 = String(_0x45d54b || '');
    ((this._statusIsDefault = !_0x5793e6 || _0x5793e6 === getWebPreviewDefaultStatusText()),
      (this._statusText = _0x5793e6 || getWebPreviewDefaultStatusText()));
    if (this._hint) this._hint.textContent = this._statusText;
  }
  ['syncLocale']() {
    if (this._title) this._title.textContent = webPreviewText('startPage.title');
    if (this._emptyInput) this._emptyInput.placeholder = webPreviewText('addressPlaceholder');
    if (this._emptySubmit) this._emptySubmit.title = webPreviewText('toolbar.open');
    (this._shortcutTitleInput &&
      (this._shortcutTitleInput.placeholder = webPreviewText('shortcutEditor.namePlaceholder')),
      this._shortcutUrlInput &&
        (this._shortcutUrlInput.placeholder = webPreviewText('shortcutEditor.urlPlaceholder')),
      this._shortcutCancelButton &&
        (this._shortcutCancelButton.textContent = webPreviewText('shortcutEditor.cancel')),
      this._shortcutSaveButton &&
        (this._shortcutSaveButton.textContent = webPreviewText('shortcutEditor.save')),
      this._statusIsDefault && this.setStatus(getWebPreviewDefaultStatusText()),
      this.renderTiles());
  }
  ['setUrl'](_0xbf918f = '') {
    this._emptyInput && document.activeElement !== this._emptyInput && (this._emptyInput.value = _0xbf918f);
  }
  ['renderTiles']() {
    if (!this._shortcutGrid) return;
    const _0x14deed = getWebPreviewStartPageTiles();
    this._shortcutGrid.replaceChildren(
      ..._0x14deed.map((_0x524eff) => this._createShortcutTile(_0x524eff)),
      this._createAddShortcutTile(),
    );
  }
  ['_createShortcutEditor']() {
    const _0x507757 = document.createElement('form');
    ((_0x507757.className = 'web-preview-shortcut-editor'),
      (_0x507757.hidden = true),
      _0x507757.addEventListener('pointerdown', stopNodeDragPropagation),
      _0x507757.addEventListener('submit', (_0x10bd65) => {
        (_0x10bd65.preventDefault(), this._saveShortcutEditor());
      }));
    const _0x5cf999 = document.createElement('input');
    ((_0x5cf999.className = 'web-preview-shortcut-editor-input'),
      (_0x5cf999.type = 'text'),
      (_0x5cf999.placeholder = webPreviewText('shortcutEditor.namePlaceholder')),
      _0x5cf999.addEventListener('keydown', (_0x3ad83a) => {
        _0x3ad83a.stopPropagation();
        if (_0x3ad83a.key === 'Escape') this._closeShortcutEditor();
      }));
    const _0x596484 = document.createElement('input');
    ((_0x596484.className = 'web-preview-shortcut-editor-input'),
      (_0x596484.type = 'text'),
      (_0x596484.inputMode = 'url'),
      (_0x596484.placeholder = webPreviewText('shortcutEditor.urlPlaceholder')),
      _0x596484.addEventListener('keydown', (_0x2f2307) => {
        _0x2f2307.stopPropagation();
        if (_0x2f2307.key === 'Escape') this._closeShortcutEditor();
      }));
    const _0x2f6fc1 = document.createElement('div');
    _0x2f6fc1.className = 'web-preview-shortcut-editor-actions';
    const _0x46e0ec = document.createElement('button');
    ((_0x46e0ec.type = 'button'),
      (_0x46e0ec.className = 'web-preview-shortcut-editor-btn'),
      (_0x46e0ec.textContent = webPreviewText('shortcutEditor.cancel')),
      _0x46e0ec.addEventListener('click', () => this._closeShortcutEditor()));
    const _0x3f8318 = document.createElement('button');
    return (
      (_0x3f8318.type = 'submit'),
      (_0x3f8318.className = 'web-preview-shortcut-editor-btn web-preview-shortcut-editor-btn--primary'),
      (_0x3f8318.textContent = webPreviewText('shortcutEditor.save')),
      _0x2f6fc1.appendChild(_0x46e0ec),
      _0x2f6fc1.appendChild(_0x3f8318),
      _0x507757.appendChild(_0x5cf999),
      _0x507757.appendChild(_0x596484),
      _0x507757.appendChild(_0x2f6fc1),
      (this._shortcutTitleInput = _0x5cf999),
      (this._shortcutUrlInput = _0x596484),
      (this._shortcutCancelButton = _0x46e0ec),
      (this._shortcutSaveButton = _0x3f8318),
      _0x507757
    );
  }
  ['_openShortcutEditor']({ mode: mode = 'add', tile: tile = null } = {}) {
    if (!this._shortcutEditor) return;
    (this._closeShortcutMenu(),
      (this._shortcutEditorMode = mode),
      (this._shortcutEditorTarget = tile),
      (this._shortcutEditor.hidden = false),
      this._shortcutTitleInput &&
        ((this._shortcutTitleInput.value = mode === 'rename' ? tile?.title || '' : ''),
        this._shortcutTitleInput.focus?.()),
      this._shortcutUrlInput &&
        ((this._shortcutUrlInput.value = mode === 'rename' ? tile?.url || '' : ''),
        (this._shortcutUrlInput.disabled = mode === 'rename')));
  }
  ['_closeShortcutEditor']() {
    if (!this._shortcutEditor) return;
    ((this._shortcutEditor.hidden = true), (this._shortcutEditorTarget = null));
    if (this._shortcutUrlInput) this._shortcutUrlInput.disabled = false;
  }
  ['_saveShortcutEditor']() {
    const _0x43a1b7 = this._shortcutTitleInput?.value || '',
      _0x2ea999 = this._shortcutUrlInput?.value || '';
    let _0x3bad58 = null;
    this._shortcutEditorMode === 'rename'
      ? (_0x3bad58 = renameWebPreviewShortcut({ id: this._shortcutEditorTarget?.id, title: _0x43a1b7 }))
      : (_0x3bad58 = addWebPreviewShortcut({ title: _0x43a1b7, url: _0x2ea999 }));
    if (_0x3bad58?.ok === false) {
      this._showToast?.(
        _0x3bad58.error === 'invalid-url'
          ? webPreviewText('toasts.invalidShortcutUrl')
          : webPreviewText('toasts.saveShortcutFailed'),
        'warning',
      );
      return;
    }
    (this._closeShortcutEditor(), this.renderTiles());
  }
  ['_createShortcutTile'](_0x3ee27e) {
    const _0x57d4d9 = document.createElement('button');
    ((_0x57d4d9.type = 'button'),
      (_0x57d4d9.className = 'web-preview-shortcut-tile web-preview-shortcut-tile--' + _0x3ee27e.kind),
      (_0x57d4d9.title = _0x3ee27e.url),
      _0x57d4d9.addEventListener('pointerdown', stopNodeDragPropagation),
      _0x57d4d9.addEventListener('click', () => {
        this._onOpenUrl?.(_0x3ee27e.url, { title: _0x3ee27e.title });
      }));
    const _0x2dd906 = document.createElement('span');
    ((_0x2dd906.className = 'web-preview-shortcut-icon'),
      (_0x2dd906.textContent = _0x3ee27e.iconLabel || '+'));
    const _0xe83102 = document.createElement('span');
    ((_0xe83102.className = 'web-preview-shortcut-label'),
      (_0xe83102.textContent = _0x3ee27e.title || _0x3ee27e.url),
      _0x57d4d9.appendChild(_0x2dd906),
      _0x57d4d9.appendChild(_0xe83102));
    const _0x3612b0 = document.createElement('div');
    ((_0x3612b0.className = 'web-preview-shortcut-wrap'),
      _0x3612b0.appendChild(_0x57d4d9),
      _0x3612b0.appendChild(this._createShortcutMenuButton(_0x3ee27e)));
    const _0x1dd03f = this._createShortcutMenu(_0x3ee27e);
    if (this._openShortcutMenuKey !== this._getTileMenuKey(_0x3ee27e)) _0x1dd03f.hidden = true;
    return (_0x3612b0.appendChild(_0x1dd03f), _0x3612b0);
  }
  ['_createAddShortcutTile']() {
    const _0x10e2df = document.createElement('button');
    ((_0x10e2df.type = 'button'),
      (_0x10e2df.className = 'web-preview-shortcut-tile web-preview-shortcut-tile--add'),
      (_0x10e2df.title = webPreviewText('shortcuts.add')),
      _0x10e2df.addEventListener('pointerdown', stopNodeDragPropagation),
      _0x10e2df.addEventListener('click', () => this._openShortcutEditor({ mode: 'add' })));
    const _0x3f8e88 = document.createElement('span');
    ((_0x3f8e88.className = 'web-preview-shortcut-icon'),
      _0x3f8e88.appendChild(createIcon('M12 5v14M5 12h14', { size: 24, strokeWidth: 1.8 })));
    const _0x4ffbc7 = document.createElement('span');
    return (
      (_0x4ffbc7.className = 'web-preview-shortcut-label'),
      (_0x4ffbc7.textContent = webPreviewText('shortcuts.add')),
      _0x10e2df.appendChild(_0x3f8e88),
      _0x10e2df.appendChild(_0x4ffbc7),
      _0x10e2df
    );
  }
  ['_createShortcutMenuButton'](_0x53ac83) {
    const _0x2f5810 = document.createElement('button');
    return (
      (_0x2f5810.type = 'button'),
      (_0x2f5810.className = 'web-preview-shortcut-menu-btn'),
      (_0x2f5810.title = webPreviewText('shortcuts.more')),
      _0x2f5810.appendChild(
        createIcon(
          'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
          { size: 18, strokeWidth: 2.4 },
        ),
      ),
      _0x2f5810.addEventListener('pointerdown', stopNodeDragPropagation),
      _0x2f5810.addEventListener('click', (_0x43f33a) => {
        (_0x43f33a.stopPropagation(), this._toggleShortcutMenu(_0x53ac83));
      }),
      _0x2f5810
    );
  }
  ['_createShortcutMenu'](_0x2425ac) {
    const _0x44e222 = document.createElement('div');
    ((_0x44e222.className = 'web-preview-shortcut-menu'),
      _0x44e222.addEventListener('pointerdown', stopNodeDragPropagation));
    const _0x34f3fc =
      _0x2425ac.kind === 'shortcut'
        ? [
            ['rename', webPreviewText('shortcuts.menu.rename')],
            ['delete-shortcut', webPreviewText('shortcuts.menu.delete')],
            ['unpin', webPreviewText('shortcuts.menu.unpin')],
          ]
        : [
            ['pin', webPreviewText('shortcuts.menu.pin')],
            ['delete-history', webPreviewText('shortcuts.menu.deleteHistory')],
          ];
    for (const [_0x8c1a78, _0x2e5ea2] of _0x34f3fc) {
      const _0x4a78ca = document.createElement('button');
      ((_0x4a78ca.type = 'button'),
        (_0x4a78ca.className = 'web-preview-shortcut-menu-item'),
        (_0x4a78ca.textContent = _0x2e5ea2),
        _0x4a78ca.addEventListener('click', (_0x508c00) => {
          (_0x508c00.stopPropagation(), this._runShortcutAction(_0x8c1a78, _0x2425ac));
        }),
        _0x44e222.appendChild(_0x4a78ca));
    }
    return _0x44e222;
  }
  ['_getTileMenuKey'](_0x5b1bb0) {
    return _0x5b1bb0.kind + ':' + (_0x5b1bb0.id || _0x5b1bb0.url);
  }
  ['_toggleShortcutMenu'](_0x591935) {
    const _0x23fb9f = this._getTileMenuKey(_0x591935);
    ((this._openShortcutMenuKey = this._openShortcutMenuKey === _0x23fb9f ? '' : _0x23fb9f),
      this.renderTiles());
  }
  ['_closeShortcutMenu']() {
    if (!this._openShortcutMenuKey) return;
    ((this._openShortcutMenuKey = ''), this.renderTiles());
  }
  ['_runShortcutAction'](_0x44a3f3, _0x35b119) {
    if (_0x44a3f3 === 'rename') {
      this._openShortcutEditor({ mode: 'rename', tile: _0x35b119 });
      return;
    }
    if (_0x44a3f3 === 'delete-shortcut') deleteWebPreviewShortcut({ id: _0x35b119.id, url: _0x35b119.url });
    else {
      if (_0x44a3f3 === 'unpin') unpinWebPreviewShortcut({ id: _0x35b119.id });
      else {
        if (_0x44a3f3 === 'pin') pinWebPreviewUrl({ url: _0x35b119.url, title: _0x35b119.title });
        else _0x44a3f3 === 'delete-history' && deleteWebPreviewHistoryUrl({ url: _0x35b119.url });
      }
    }
    ((this._openShortcutMenuKey = ''), this.renderTiles());
  }
}
