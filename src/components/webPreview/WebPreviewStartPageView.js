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
function webPreviewText(value, item = {}) {
  return t('webPreview.' + value, item);
}
export class WebPreviewStartPageView {
  constructor({
    statusText: statusText = getWebPreviewDefaultStatusText(),
    onOpenUrl: onOpenUrl,
    showToast: showToast = globalThis.window?.showToast,
  } = {}) {
    ((this._statusText = statusText),
      (this._onOpenUrl = onOpenUrl),
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
    const el = document.createElement('div');
    el.className = 'web-preview-placeholder';
    const el2 = document.createElement('div');
    ((el2.className = 'web-preview-placeholder-icon'),
      el2.appendChild(createIcon('M3 4h18v16H3zM3 9h18M8 4v5', { size: 30, strokeWidth: 1.7 })),
      el.appendChild(el2));
    const el3 = document.createElement('div');
    ((el3.className = 'web-preview-placeholder-title'),
      (el3.textContent = webPreviewText('startPage.title')));
    const el4 = document.createElement('div');
    ((el4.className = 'web-preview-placeholder-hint'), (el4.textContent = this._statusText));
    const el5 = document.createElement('form');
    ((el5.className = 'web-preview-empty-form'),
      el5.addEventListener('pointerdown', stopNodeDragPropagation));
    const el6 = document.createElement('input');
    ((el6.className = 'web-preview-empty-input'),
      (el6.type = 'text'),
      (el6.inputMode = 'search'),
      (el6.placeholder = webPreviewText('addressPlaceholder')),
      el6.addEventListener('keydown', (event) => {
        event.stopPropagation();
        if (event.key === 'Escape') el6.blur();
      }),
      el5.addEventListener('submit', (event2) => {
        (event2.preventDefault(), this._onOpenUrl?.(el6.value));
      }));
    const el7 = document.createElement('button');
    ((el7.className = 'web-preview-empty-submit'),
      (el7.type = 'submit'),
      (el7.title = webPreviewText('toolbar.open')),
      el7.appendChild(createIcon('M5 12h14M13 5l7 7-7 7', { size: 15 })),
      el5.appendChild(el6),
      el5.appendChild(el7));
    const key = document.createElement('div');
    key.className = 'web-preview-shortcuts';
    const index = this._createShortcutEditor();
    return (
      el.appendChild(el3),
      el.appendChild(el5),
      el.appendChild(el4),
      el.appendChild(key),
      el.appendChild(index),
      (this._root = el),
      (this._title = el3),
      (this._emptyInput = el6),
      (this._emptySubmit = el7),
      (this._hint = el4),
      (this._shortcutGrid = key),
      (this._shortcutEditor = index),
      this.renderTiles(),
      el
    );
  }
  ['setStatus'](result) {
    const enabled = String(result || '');
    ((this._statusIsDefault = !enabled || enabled === getWebPreviewDefaultStatusText()),
      (this._statusText = enabled || getWebPreviewDefaultStatusText()));
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
  ['setUrl'](data = '') {
    this._emptyInput && document.activeElement !== this._emptyInput && (this._emptyInput.value = data);
  }
  ['renderTiles']() {
    if (!this._shortcutGrid) return;
    const list = getWebPreviewStartPageTiles();
    this._shortcutGrid.replaceChildren(
      ...list.map((item2) => this._createShortcutTile(item2)),
      this._createAddShortcutTile(),
    );
  }
  ['_createShortcutEditor']() {
    const el8 = document.createElement('form');
    ((el8.className = 'web-preview-shortcut-editor'),
      (el8.hidden = true),
      el8.addEventListener('pointerdown', stopNodeDragPropagation),
      el8.addEventListener('submit', (event3) => {
        (event3.preventDefault(), this._saveShortcutEditor());
      }));
    const el9 = document.createElement('input');
    ((el9.className = 'web-preview-shortcut-editor-input'),
      (el9.type = 'text'),
      (el9.placeholder = webPreviewText('shortcutEditor.namePlaceholder')),
      el9.addEventListener('keydown', (event4) => {
        event4.stopPropagation();
        if (event4.key === 'Escape') this._closeShortcutEditor();
      }));
    const el10 = document.createElement('input');
    ((el10.className = 'web-preview-shortcut-editor-input'),
      (el10.type = 'text'),
      (el10.inputMode = 'url'),
      (el10.placeholder = webPreviewText('shortcutEditor.urlPlaceholder')),
      el10.addEventListener('keydown', (event5) => {
        event5.stopPropagation();
        if (event5.key === 'Escape') this._closeShortcutEditor();
      }));
    const el11 = document.createElement('div');
    el11.className = 'web-preview-shortcut-editor-actions';
    const el12 = document.createElement('button');
    ((el12.type = 'button'),
      (el12.className = 'web-preview-shortcut-editor-btn'),
      (el12.textContent = webPreviewText('shortcutEditor.cancel')),
      el12.addEventListener('click', () => this._closeShortcutEditor()));
    const el13 = document.createElement('button');
    return (
      (el13.type = 'submit'),
      (el13.className = 'web-preview-shortcut-editor-btn web-preview-shortcut-editor-btn--primary'),
      (el13.textContent = webPreviewText('shortcutEditor.save')),
      el11.appendChild(el12),
      el11.appendChild(el13),
      el8.appendChild(el9),
      el8.appendChild(el10),
      el8.appendChild(el11),
      (this._shortcutTitleInput = el9),
      (this._shortcutUrlInput = el10),
      (this._shortcutCancelButton = el12),
      (this._shortcutSaveButton = el13),
      el8
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
    const title = this._shortcutTitleInput?.value || '',
      url = this._shortcutUrlInput?.value || '';
    let response = null;
    this._shortcutEditorMode === 'rename'
      ? (response = renameWebPreviewShortcut({ id: this._shortcutEditorTarget?.id, title: title }))
      : (response = addWebPreviewShortcut({ title: title, url: url }));
    if (response?.ok === false) {
      this._showToast?.(
        response.error === 'invalid-url'
          ? webPreviewText('toasts.invalidShortcutUrl')
          : webPreviewText('toasts.saveShortcutFailed'),
        'warning',
      );
      return;
    }
    (this._closeShortcutEditor(), this.renderTiles());
  }
  ['_createShortcutTile'](title2) {
    const el14 = document.createElement('button');
    ((el14.type = 'button'),
      (el14.className = 'web-preview-shortcut-tile web-preview-shortcut-tile--' + title2.kind),
      (el14.title = title2.url),
      el14.addEventListener('pointerdown', stopNodeDragPropagation),
      el14.addEventListener('click', () => {
        this._onOpenUrl?.(title2.url, { title: title2.title });
      }));
    const el15 = document.createElement('span');
    ((el15.className = 'web-preview-shortcut-icon'), (el15.textContent = title2.iconLabel || '+'));
    const el16 = document.createElement('span');
    ((el16.className = 'web-preview-shortcut-label'),
      (el16.textContent = title2.title || title2.url),
      el14.appendChild(el15),
      el14.appendChild(el16));
    const el17 = document.createElement('div');
    ((el17.className = 'web-preview-shortcut-wrap'),
      el17.appendChild(el14),
      el17.appendChild(this._createShortcutMenuButton(title2)));
    const el18 = this._createShortcutMenu(title2);
    if (this._openShortcutMenuKey !== this._getTileMenuKey(title2)) el18.hidden = true;
    return (el17.appendChild(el18), el17);
  }
  ['_createAddShortcutTile']() {
    const el19 = document.createElement('button');
    ((el19.type = 'button'),
      (el19.className = 'web-preview-shortcut-tile web-preview-shortcut-tile--add'),
      (el19.title = webPreviewText('shortcuts.add')),
      el19.addEventListener('pointerdown', stopNodeDragPropagation),
      el19.addEventListener('click', () => this._openShortcutEditor({ mode: 'add' })));
    const el20 = document.createElement('span');
    ((el20.className = 'web-preview-shortcut-icon'),
      el20.appendChild(createIcon('M12 5v14M5 12h14', { size: 24, strokeWidth: 1.8 })));
    const el21 = document.createElement('span');
    return (
      (el21.className = 'web-preview-shortcut-label'),
      (el21.textContent = webPreviewText('shortcuts.add')),
      el19.appendChild(el20),
      el19.appendChild(el21),
      el19
    );
  }
  ['_createShortcutMenuButton'](options) {
    const el22 = document.createElement('button');
    return (
      (el22.type = 'button'),
      (el22.className = 'web-preview-shortcut-menu-btn'),
      (el22.title = webPreviewText('shortcuts.more')),
      el22.appendChild(
        createIcon(
          'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
          { size: 18, strokeWidth: 2.4 },
        ),
      ),
      el22.addEventListener('pointerdown', stopNodeDragPropagation),
      el22.addEventListener('click', (event6) => {
        (event6.stopPropagation(), this._toggleShortcutMenu(options));
      }),
      el22
    );
  }
  ['_createShortcutMenu'](target) {
    const el23 = document.createElement('div');
    ((el23.className = 'web-preview-shortcut-menu'),
      el23.addEventListener('pointerdown', stopNodeDragPropagation));
    const source =
      target.kind === 'shortcut'
        ? [
            ['rename', webPreviewText('shortcuts.menu.rename')],
            ['delete-shortcut', webPreviewText('shortcuts.menu.delete')],
            ['unpin', webPreviewText('shortcuts.menu.unpin')],
          ]
        : [
            ['pin', webPreviewText('shortcuts.menu.pin')],
            ['delete-history', webPreviewText('shortcuts.menu.deleteHistory')],
          ];
    for (const [next, current] of source) {
      const el24 = document.createElement('button');
      ((el24.type = 'button'),
        (el24.className = 'web-preview-shortcut-menu-item'),
        (el24.textContent = current),
        el24.addEventListener('click', (event7) => {
          (event7.stopPropagation(), this._runShortcutAction(next, target));
        }),
        el23.appendChild(el24));
    }
    return el23;
  }
  ['_getTileMenuKey'](response2) {
    return response2.kind + ':' + (response2.id || response2.url);
  }
  ['_toggleShortcutMenu'](entry) {
    const record = this._getTileMenuKey(entry);
    ((this._openShortcutMenuKey = this._openShortcutMenuKey === record ? '' : record), this.renderTiles());
  }
  ['_closeShortcutMenu']() {
    if (!this._openShortcutMenuKey) return;
    ((this._openShortcutMenuKey = ''), this.renderTiles());
  }
  ['_runShortcutAction'](payload, tile2) {
    if (payload === 'rename') {
      this._openShortcutEditor({ mode: 'rename', tile: tile2 });
      return;
    }
    if (payload === 'delete-shortcut') deleteWebPreviewShortcut({ id: tile2.id, url: tile2.url });
    else {
      if (payload === 'unpin') unpinWebPreviewShortcut({ id: tile2.id });
      else {
        if (payload === 'pin') pinWebPreviewUrl({ url: tile2.url, title: tile2.title });
        else payload === 'delete-history' && deleteWebPreviewHistoryUrl({ url: tile2.url });
      }
    }
    ((this._openShortcutMenuKey = ''), this.renderTiles());
  }
}
