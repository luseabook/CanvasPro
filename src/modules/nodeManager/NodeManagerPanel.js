import {
  MATERIAL_FOLDER_ICON_MARKUP,
  MATERIAL_TREE_CHEVRON_ICON_SVG,
  NODE_TOOLBAR_MORE_ICON_SVG,
  PANEL_COLLAPSE_LEFT_ICON_SVG,
} from '../../components/sharedIconMarkup.js';
import { t } from '../../i18n/index.js';
import { createSafeSvg } from '../../utils/dom.js';
import { downloadNodeOutput } from '../nodeBatchExport.js';
import { showContextMenu } from '../interaction/contextMenuPresenter.js';
import { scrollElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
import { closeSidebarSubmenu, registerSidebarSubmenu } from '../sidebarSubmenuController.js';
import { buildNodeManagerModel, resolveNodeManagerName, NODE_MANAGER_FILTERS } from './nodeManagerModel.js';
import { NODE_MANAGER_PLACEMENT_EVENT, normalizeNodeManagerPlacement } from './nodeManagerPlacement.js';
import { createNodeManagerDragController } from './nodeManagerDragController.js';
import { createNodeManagerListSnapshot } from './nodeManagerListSnapshot.js';
const SIDEBAR_KEY = 'node-manager',
  GROUP_DISCLOSURE_MOTION_MS = 0x96,
  VIDEO_PLAY_RETRY_MS = 0x640,
  ICON_SELECTORS = Object['freeze']({
    audio: '.nam-item[data-type="audio"] svg',
    chevron: '#localeSelectTrigger .settings-preset-chevron',
    close: '#btnSettingsClose svg',
    filter: '.settings-nav-item[data-pane="canvas-align"] svg',
    image: '.nam-item[data-type="image"] svg',
    more: '.v2-material-more svg, .act-more-tools svg',
    node: '#btnNodeManager\x20svg',
    search: '.settings-shortcuts-search-icon',
    text: '.nam-item[data-type=\x22text\x22]\x20svg',
    video: '.nam-item[data-type=\x22video\x22]\x20svg',
    videoPlay: '.video-play-btn svg',
  });
function createSharedIcon(_0x2bcbfd) {
  const _0x5e4959 =
    _0x2bcbfd === 'more'
      ? NODE_TOOLBAR_MORE_ICON_SVG
      : _0x2bcbfd === 'treeChevron'
        ? MATERIAL_TREE_CHEVRON_ICON_SVG
        : _0x2bcbfd === 'collapse'
          ? PANEL_COLLAPSE_LEFT_ICON_SVG
          : '';
  return _0x5e4959 ? createSafeSvg(_0x5e4959) : null;
}
function getStoreState(_0x15e83a) {
  return _0x15e83a?.['getStateRaw']?.() || _0x15e83a?.['getState']?.() || {};
}
function createElement(_0x2b2ca0, _0x24d9d5 = '', _0x1a265d = {}) {
  const _0x7b2e16 = document['createElement'](_0x2b2ca0);
  if (_0x24d9d5) _0x7b2e16['className'] = _0x24d9d5;
  return (
    Object['entries'](_0x1a265d)['forEach'](([_0x242f56, _0x129dd9]) => {
      if (_0x129dd9 == null) return;
      _0x7b2e16['setAttribute'](_0x242f56, String(_0x129dd9));
    }),
    _0x7b2e16
  );
}
function cloneExistingIcon(_0x1d70bf, _0x5cd5c5 = '', _0x95a576) {
  const _0x5981e7 = ICON_SELECTORS[_0x1d70bf] || '';
  !_0x95a576['has'](_0x1d70bf) &&
    _0x95a576['set'](
      _0x1d70bf,
      (_0x5981e7 ? document['querySelector'](_0x5981e7) : null) || createSharedIcon(_0x1d70bf),
    );
  const _0x1e5c97 = _0x95a576['get'](_0x1d70bf),
    _0x40e20f = _0x1e5c97?.['cloneNode']?.(!![]);
  if (!_0x40e20f) return null;
  (_0x40e20f['removeAttribute']?.('id'),
    _0x40e20f['setAttribute']?.('aria-hidden', 'true'),
    _0x40e20f['setAttribute']?.('focusable', 'false'));
  if (_0x5cd5c5) _0x40e20f['classList']?.['add'](_0x5cd5c5);
  return _0x40e20f;
}
function installNodeManagerButtonIcon(_0x3873b8) {
  if (!_0x3873b8 || _0x3873b8['querySelector']?.('svg')) return;
  const _0x49a9ce = document['querySelector']('#btnToggleDots svg'),
    _0x5abcb1 = _0x49a9ce?.['cloneNode']?.(!![]);
  if (!_0x5abcb1) return;
  (_0x5abcb1['removeAttribute']?.('id'),
    _0x5abcb1['setAttribute']?.('width', '20'),
    _0x5abcb1['setAttribute']?.('height', '20'),
    _0x5abcb1['setAttribute']?.('aria-hidden', 'true'),
    _0x5abcb1['setAttribute']?.('focusable', 'false'),
    _0x3873b8['appendChild'](_0x5abcb1));
}
function getProjectName() {
  const _0x468ea6 = window['CanvasTabManager']?.['getCanvasProjectContext']?.(),
    _0x133c12 = document['getElementById']('projectNameText')?.['textContent'];
  return String(_0x468ea6?.['projectName'] || _0x133c12 || t('projectDropdown.unnamedCanvas'))
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function normalizeWheelDelta(_0x21a27b, _0x2afd91) {
  const _0x1a9b9b =
    _0x21a27b['deltaMode'] === 0x1
      ? 0x10
      : _0x21a27b['deltaMode'] === 0x2
        ? Math['max'](0x1, _0x2afd91)
        : 0x1;
  return (Number(_0x21a27b['deltaY']) || Number(_0x21a27b['deltaX']) || 0x0) * _0x1a9b9b;
}
export function installScrollableWheelBoundary(_0x3de3dd, { getAxis: getAxis = () => 'vertical' } = {}) {
  const _0x2b4162 = (_0x468000) => {
    if (getAxis() === 'horizontal') {
      const _0x4e7d68 = Math['max'](0x0, Number(_0x3de3dd['clientWidth']) || 0x0),
        _0x1efe23 = Math['max'](0x0, (Number(_0x3de3dd['scrollWidth']) || 0x0) - _0x4e7d68);
      if (_0x1efe23 <= 0x0) return;
      if (!scrollElementHorizontallyWithWheel(_0x468000, _0x3de3dd, { stopPropagation: !![] })) {
        const _0x11809e = Number(_0x468000['deltaY']) || Number(_0x468000['deltaX']) || 0x0;
        if (!_0x11809e) return;
        (_0x468000['preventDefault'](), _0x468000['stopPropagation']());
      }
      return;
    }
    const _0x131f6d = Math['max'](0x0, Number(_0x3de3dd['clientHeight']) || 0x0),
      _0x51a370 = Math['max'](0x0, (Number(_0x3de3dd['scrollHeight']) || 0x0) - _0x131f6d);
    if (_0x51a370 <= 0x0) return;
    const _0x3d7503 = normalizeWheelDelta(_0x468000, _0x131f6d);
    if (!_0x3d7503) return;
    ((_0x3de3dd['scrollTop'] = Math['min'](
      _0x51a370,
      Math['max'](0x0, (Number(_0x3de3dd['scrollTop']) || 0x0) + _0x3d7503),
    )),
      _0x468000['preventDefault'](),
      _0x468000['stopPropagation']());
  };
  return (
    _0x3de3dd['addEventListener']('wheel', _0x2b4162, { passive: ![] }),
    () => _0x3de3dd['removeEventListener']('wheel', _0x2b4162)
  );
}
function normalizeRect(_0x44f350) {
  const _0x2983ef = Number(_0x44f350?.['left']) || 0x0,
    _0x3a368d = Number(_0x44f350?.['top']) || 0x0,
    _0x326a58 = Math['max'](0x0, Number(_0x44f350?.['width']) || 0x0),
    _0x3e2ca4 = Math['max'](0x0, Number(_0x44f350?.['height']) || 0x0);
  return {
    left: _0x2983ef,
    top: _0x3a368d,
    width: _0x326a58,
    height: _0x3e2ca4,
    right: Number['isFinite'](Number(_0x44f350?.['right']))
      ? Number(_0x44f350['right'])
      : _0x2983ef + _0x326a58,
    bottom: Number['isFinite'](Number(_0x44f350?.['bottom']))
      ? Number(_0x44f350['bottom'])
      : _0x3a368d + _0x3e2ca4,
  };
}
export function resolveNodeManagerViewportInsets({
  placement: _0x34edce,
  panelRect: _0x2d89bb,
  canvasRect: _0x54a8c6,
  gap: gap = 0xc,
} = {}) {
  const _0x60d216 = normalizeRect(_0x2d89bb),
    _0x3ec2b5 = normalizeRect(_0x54a8c6),
    _0x5486d8 = Math['max'](0x0, Number(gap) || 0x0),
    _0x22e4b9 = { top: 0x0, right: 0x0, bottom: 0x0, left: 0x0 };
  if (!(_0x3ec2b5['width'] > 0x0 && _0x3ec2b5['height'] > 0x0)) return _0x22e4b9;
  const _0x2ff9a4 = _0x60d216['right'] > _0x3ec2b5['left'] && _0x60d216['left'] < _0x3ec2b5['right'],
    _0x8d8c4 = _0x60d216['bottom'] > _0x3ec2b5['top'] && _0x60d216['top'] < _0x3ec2b5['bottom'];
  if (!_0x2ff9a4 || !_0x8d8c4) return _0x22e4b9;
  const _0xa0cb14 = normalizeNodeManagerPlacement(_0x34edce);
  if (_0xa0cb14 === 'left')
    _0x22e4b9['left'] = Math['min'](
      _0x3ec2b5['width'] - 0x1,
      Math['max'](0x0, _0x60d216['right'] - _0x3ec2b5['left'] + _0x5486d8),
    );
  else
    _0xa0cb14 === 'right'
      ? (_0x22e4b9['right'] = Math['min'](
          _0x3ec2b5['width'] - 0x1,
          Math['max'](0x0, _0x3ec2b5['right'] - _0x60d216['left'] + _0x5486d8),
        ))
      : (_0x22e4b9['bottom'] = Math['min'](
          _0x3ec2b5['height'] - 0x1,
          Math['max'](0x0, _0x3ec2b5['bottom'] - _0x60d216['top'] + _0x5486d8),
        ));
  return _0x22e4b9;
}
export function createNodeManagerPanel({
  graphStore: _0x3cf865,
  uiStore: _0x3850c2,
  appViewport: _0x3bdf49,
  executeCanvasCommand: _0x3a6360,
  renameCurrentProject: _0x1ecaec,
  wrap: wrap = document['getElementById']('v2-wrap'),
  canvasStage: canvasStage = document['querySelector']('.v2-canvas-stage'),
  button: button = document['getElementById']('btnNodeManager'),
  showToast: showToast = window['showToast'],
} = {}) {
  if (!_0x3cf865 || !wrap || !button) return null;
  installNodeManagerButtonIcon(button);
  const _0x23785e = new Map(),
    _0x3857a4 = (_0x1ef1d7, _0x30a87e) => cloneExistingIcon(_0x1ef1d7, _0x30a87e, _0x23785e);
  function _0x447511(_0x275c59, _0x585b79, _0x4a1e7f = '') {
    const _0x3bc077 = _0x3857a4(_0x585b79, _0x4a1e7f);
    if (_0x3bc077) _0x275c59['appendChild'](_0x3bc077);
    return _0x3bc077;
  }
  let _0x3f8216 = 'all',
    _0x234bba = '',
    _0x39ce90 = ![],
    _0x5db663 = null;
  const _0x2aacbe = createNodeManagerListSnapshot(),
    _0x22bee1 = new Map();
  let _0x30fd3c = null,
    _0x2dcc8b = null,
    _0x48030b = ![],
    _0x126d01 = buildNodeManagerModel({ nodes: {} });
  const _0x33c939 = new Set(),
    _0x5edd29 = new Set(),
    _0x5721c4 = new Map(),
    _0x49250f = [];
  let _0x3d51a2 = null;
  const _0x55b438 = () => ({
      maxZoom: 1.15,
      viewportInsets: resolveNodeManagerViewportInsets({
        placement: _0x3d51a2?.['dataset']?.['placement'],
        panelRect: _0x3d51a2?.['getBoundingClientRect']?.(),
        canvasRect: canvasStage?.['getBoundingClientRect']?.(),
      }),
    }),
    _0x2e904f = createNodeManagerDragController({
      graphStore: _0x3cf865,
      wrap: wrap,
      canvasStage: canvasStage,
      executeCanvasCommand: _0x3a6360,
      onDuplicateFailed: (_0x363f6a) => {
        showToast?.(_0x363f6a?.['message'] || t('nodeManager.toasts.duplicateFailed'), 'error');
      },
      onDuplicated: (_0x3750d4) => {
        _0x3bdf49?.['focusNode']?.(_0x3750d4, 0x60, 0xf0, _0x55b438());
      },
    });
  (_0x49250f['push'](() => _0x2e904f['destroy']()),
    (_0x3d51a2 = createElement('section', 'node-manager-panel\x20canvas-toolbar-panel-surface', {
      id: 'nodeManagerPanel',
      role: 'complementary',
      'aria-hidden': 'true',
      'data-ui-stop': '1',
    })));
  const _0x5d6459 = createElement('h2', 'node-manager-visually-hidden'),
    _0x4a8171 = createElement('div', 'node-manager-project-row'),
    _0x1ed2a1 = createElement('div', 'node-manager-project-name-host'),
    _0x433d98 = createElement('button', 'node-manager-project-name', { type: 'button' }),
    _0x227737 = createElement('span', 'node-manager-project-name-text', { 'data-tooltip-overflow': 'true' });
  (_0x433d98['append'](_0x227737), _0x1ed2a1['appendChild'](_0x433d98));
  const _0x22a083 = createElement('button', 'node-manager-icon-button\x20node-manager-header-collapse', {
    type: 'button',
  });
  (_0x447511(_0x22a083, 'collapse', 'node-manager-collapse-icon'), _0x4a8171['append'](_0x1ed2a1, _0x22a083));
  const _0x3997f3 = createElement('div', 'node-manager-controls'),
    _0x4838be = createElement('div', 'node-manager-default-controls'),
    _0x31a79a = createElement('span', 'node-manager-list-title'),
    _0x28d0e7 = createElement('button', 'node-manager-icon-button node-manager-group-toggle', {
      type: 'button',
    });
  _0x447511(_0x28d0e7, 'chevron', 'node-manager-group-toggle-icon');
  const _0x30dfe8 = createElement('button', 'node-manager-filter-button', {
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
    }),
    _0x28acd7 = createElement('span', 'node-manager-filter-label'),
    _0xcda5c3 = _0x3857a4('chevron', 'node-manager-filter-chevron');
  _0x30dfe8['appendChild'](_0x28acd7);
  if (_0xcda5c3) _0x30dfe8['appendChild'](_0xcda5c3);
  const _0x3b45be = createElement('button', 'node-manager-icon-button', { type: 'button' });
  (_0x447511(_0x3b45be, 'search'), _0x4838be['append'](_0x31a79a, _0x28d0e7, _0x30dfe8, _0x3b45be));
  const _0x2386b3 = createElement('div', 'node-manager-search-controls'),
    _0x3e1e21 = createElement('label', 'node-manager-search-field'),
    _0x454172 = createElement('input', 'node-manager-search-input', {
      type: 'search',
      autocomplete: 'off',
      spellcheck: 'false',
    });
  (_0x447511(_0x3e1e21, 'search', 'node-manager-search-field-icon'), _0x3e1e21['appendChild'](_0x454172));
  const _0x9f06ab = createElement('button', 'node-manager-icon-button node-manager-search-filter-button', {
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
  });
  _0x447511(_0x9f06ab, 'filter', 'node-manager-filter-search-icon');
  const _0x3bbf24 = createElement('button', 'node-manager-icon-button', { type: 'button' });
  (_0x447511(_0x3bbf24, 'close'),
    _0x2386b3['append'](_0x3e1e21, _0x9f06ab, _0x3bbf24),
    _0x3997f3['append'](_0x4838be, _0x2386b3));
  const _0x373f00 = createElement('div', 'node-manager-list', { role: 'list', tabindex: '0' }),
    _0x30064e = createElement('footer', 'node-manager-footer'),
    _0x3d6650 = createElement('button', 'node-manager-collapse-button', { type: 'button' });
  _0x447511(_0x3d6650, 'collapse', 'node-manager-collapse-icon');
  const _0x27e919 = createElement('span', 'node-manager-collapse-label');
  _0x3d6650['appendChild'](_0x27e919);
  const _0x75d484 = createElement('span', 'node-manager-total');
  (_0x30064e['append'](_0x3d6650, _0x75d484),
    _0x3d51a2['append'](_0x5d6459, _0x4a8171, _0x3997f3, _0x373f00, _0x30064e),
    wrap['appendChild'](_0x3d51a2));
  function _0x22d5f8() {
    return _0x3d51a2['classList']['contains']('show');
  }
  function _0x3ffaba() {
    (_0x5db663?.['close']?.({ restoreFocus: ![] }), (_0x5db663 = null));
  }
  function _0x1f1cb8(_0x2b1c4e) {
    const _0x26e042 = normalizeNodeManagerPlacement(_0x2b1c4e);
    return ((_0x3d51a2['dataset']['placement'] = _0x26e042), _0x26e042);
  }
  function _0x499abe() {
    const _0x3fef44 = getProjectName();
    ((_0x227737['textContent'] = _0x3fef44), _0x227737['setAttribute']('data-tooltip', _0x3fef44));
  }
  function _0x5aeaac() {
    const _0xa708a4 = _0x126d01['groupIds'] || [],
      _0x255ba7 = _0xa708a4['length'] > 0x0 && _0xa708a4['every']((_0x58cec8) => _0x33c939['has'](_0x58cec8)),
      _0x4c2941 = t(_0x255ba7 ? 'nodeManager.expandAll' : 'nodeManager.collapseAll');
    ((_0x28d0e7['hidden'] = _0xa708a4['length'] === 0x0),
      _0x28d0e7['classList']['toggle']('is-expand-action', _0x255ba7),
      _0x28d0e7['setAttribute']('aria-label', _0x4c2941),
      (_0x28d0e7['title'] = _0x4c2941));
  }
  function _0x596497() {
    ((_0x5d6459['textContent'] = t('nodeManager.title')),
      _0x3d51a2['setAttribute']('aria-label', t('nodeManager.title')),
      _0x433d98['setAttribute']('aria-label', t('nodeManager.renameProjectAria')),
      (_0x31a79a['textContent'] = t('nodeManager.listTitle')),
      _0x373f00['setAttribute']('aria-label', t('nodeManager.listAria')),
      _0x3b45be['setAttribute']('aria-label', t('nodeManager.search')),
      (_0x3b45be['title'] = t('nodeManager.search')),
      (_0x454172['placeholder'] = t('nodeManager.searchPlaceholder')),
      _0x454172['setAttribute']('aria-label', t('nodeManager.search')),
      _0x3bbf24['setAttribute']('aria-label', t('nodeManager.closeSearch')),
      (_0x3bbf24['title'] = t('nodeManager.closeSearch')),
      _0x30dfe8['setAttribute']('aria-label', t('nodeManager.filter')),
      (_0x30dfe8['title'] = t('nodeManager.filter')),
      _0x9f06ab['setAttribute']('aria-label', t('nodeManager.filter')),
      (_0x9f06ab['title'] = t('nodeManager.filter')),
      (_0x28acd7['textContent'] = t('nodeManager.filters.' + _0x3f8216)),
      _0x3d6650['setAttribute']('aria-label', t('nodeManager.collapsePanel')),
      (_0x3d6650['title'] = t('nodeManager.collapsePanel')),
      _0x22a083['setAttribute']('aria-label', t('nodeManager.collapsePanel')),
      (_0x22a083['title'] = t('nodeManager.collapsePanel')),
      (_0x27e919['textContent'] = t('nodeManager.collapsePanel')),
      (_0x75d484['textContent'] = t('nodeManager.total', { count: _0x126d01['totalNodeCount'] || 0x0 })),
      _0x499abe(),
      _0x5aeaac());
  }
  function _0x578250() {
    if (!_0x22d5f8()) return;
    const _0x2f5e23 = new Set(getStoreState(_0x3cf865)['selectedNodeIds'] || []);
    _0x373f00['querySelectorAll']('.node-manager-row[data-node-id]')['forEach']((_0x150676) => {
      const _0x478880 = _0x2f5e23['has'](_0x150676['dataset']['nodeId']);
      _0x150676['classList']['toggle']('is-selected', _0x478880);
      const _0x338f6 = _0x150676['querySelector']('.node-manager-row-main');
      if (_0x478880) _0x338f6?.['setAttribute']('aria-current', 'true');
      else _0x338f6?.['removeAttribute']('aria-current');
    });
  }
  function _0x1e9d96(_0x4b3587) {
    const _0x4e8c37 = String(_0x4b3587 || '');
    return (
      Array['from'](_0x373f00['querySelectorAll']('.node-manager-row[data-node-id]'))['find'](
        (_0x1b72dd) => _0x1b72dd['dataset']['nodeId'] === _0x4e8c37,
      ) || null
    );
  }
  function _0xe382b5(_0x40ff08, _0x4865a5) {
    const _0x850744 = _0x4865a5 === 'group' ? 'folder' : ICON_SELECTORS[_0x4865a5] ? _0x4865a5 : 'node';
    _0x447511(_0x40ff08, _0x850744, 'node-manager-thumb-fallback-icon');
  }
  function _0x27e6af(_0x388d47, _0x201f68) {
    const _0x4e0559 = createElement('span', 'node-manager-thumb\x20is-' + _0x388d47['category']);
    if (_0x388d47['kind'] === 'group')
      return (
        _0x4e0559['classList']['add']('node-manager-folder-icon'),
        (_0x4e0559['innerHTML'] = MATERIAL_FOLDER_ICON_MARKUP),
        _0x4e0559
      );
    if (!_0x201f68) return (_0xe382b5(_0x4e0559, _0x388d47['category']), _0x4e0559);
    const _0x4c1c6e = createElement('img', 'node-manager-thumb-image', {
      src: _0x201f68,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      draggable: 'false',
    });
    (_0x4c1c6e['addEventListener'](
      'error',
      () => {
        (_0x4c1c6e['remove'](), _0xe382b5(_0x4e0559, _0x388d47['category']));
      },
      { once: !![] },
    ),
      _0x4e0559['appendChild'](_0x4c1c6e));
    if (_0x388d47['category'] === 'video') {
      const _0x1fddb0 = createElement('span', 'node-manager-video-badge');
      if (_0x447511(_0x1fddb0, 'videoPlay')) _0x4e0559['appendChild'](_0x1fddb0);
    }
    return _0x4e0559;
  }
  function _0x5ef07d(_0x209d93) {
    const _0x346d46 = document['getElementById'](_0x209d93),
      _0x4029c8 = _0x346d46?.['querySelector']?.('video');
    if (_0x4029c8 && _0x4029c8['paused'] === ![]) return !![];
    const _0x51c663 = _0x346d46?.['querySelector']?.('.video-play-btn');
    if (_0x51c663) return (_0x51c663['click'](), !![]);
    if (_0x4029c8?.['play']) return (Promise['resolve'](_0x4029c8['play']())['catch'](() => {}), !![]);
    return ![];
  }
  function _0x27952a(_0x5ea14c) {
    const _0x1286d5 = performance['now'](),
      _0x1095a2 = () => {
        if (_0x5ef07d(_0x5ea14c)) return;
        performance['now']() - _0x1286d5 < VIDEO_PLAY_RETRY_MS && requestAnimationFrame(_0x1095a2);
      };
    window['setTimeout'](_0x1095a2, 0x118);
  }
  function _0x1bc081(_0x3f9994) {
    const _0x4ddaad = _0x3a6360?.('node.select', { ids: [_0x3f9994['id']] });
    if (_0x4ddaad?.['ok'] === ![]) return;
    if (_0x3f9994['category'] === 'video') _0x5ef07d(_0x3f9994['id']);
    _0x3bdf49?.['focusNode']?.(_0x3f9994['id'], 0x60, 0x140, _0x55b438());
    if (_0x3f9994['category'] === 'video') _0x27952a(_0x3f9994['id']);
  }
  function _0x30a3f5(_0x2055ba, _0x330683) {
    const _0x4238f0 = _0x1e9d96(_0x2055ba);
    if (!_0x4238f0) return;
    (_0x4238f0['classList']['toggle']('is-busy', _0x330683),
      _0x4238f0['setAttribute']('aria-busy', String(_0x330683)),
      _0x4238f0['querySelector']('.node-manager-row-spinner')?.['remove']());
    if (_0x330683) {
      const _0x50a2ff = createElement('span', 'project-package-loading-spinner\x20node-manager-row-spinner', {
        'aria-hidden': 'true',
      });
      _0x4238f0['appendChild'](_0x50a2ff);
    }
  }
  function _0x28b410() {
    _0x30fd3c?.['cancel']();
  }
  function _0xc37659(_0xb7fda4) {
    _0x28b410();
    const _0xa50d6b = _0x1e9d96(_0xb7fda4['id']),
      _0xf0c344 = _0xa50d6b?.['querySelector']('.node-manager-row-name');
    if (!_0xa50d6b || !_0xf0c344) return;
    const _0x519768 = resolveNodeManagerName(
        getStoreState(_0x3cf865)['nodes']?.[_0xb7fda4['id']],
        _0xb7fda4['id'],
      ),
      _0x8ca763 = createElement('input', 'node-manager-row-rename', {
        type: 'text',
        'aria-label': t('nodeManager.actions.rename'),
      });
    ((_0x8ca763['value'] = _0x519768),
      _0xf0c344['replaceChildren'](_0x8ca763),
      _0xa50d6b['classList']['add']('is-renaming'));
    let _0x266a1a = ![];
    const _0x3aca24 = () => {
      ((_0x266a1a = !![]),
        (_0x30fd3c = null),
        (_0xf0c344['textContent'] = resolveNodeManagerName(
          getStoreState(_0x3cf865)['nodes']?.[_0xb7fda4['id']],
          _0xb7fda4['id'],
        )),
        (_0xf0c344['dataset']['tooltip'] = _0xf0c344['textContent']),
        _0xa50d6b['classList']['remove']('is-renaming'),
        _0x22bee1['delete'](_0xb7fda4['id']));
    };
    _0x30fd3c = { id: _0xb7fda4['id'], input: _0x8ca763, cancel: _0x3aca24 };
    const _0x4ed675 = () => {
      if (_0x266a1a || _0x48030b) return;
      const _0x275115 = String(_0x8ca763['value'] || '')
          ['replace'](/\s+/g, '\x20')
          ['trim'](),
        _0xa1518a = _0x8ca763['isConnected'];
      _0x3aca24();
      if (!_0xa1518a) return;
      if (!_0x275115 || _0x275115 === _0x519768) return;
      const _0x32c0da = _0x3a6360?.('node.rename', { nodeId: _0xb7fda4['id'], name: _0x275115 });
      _0x32c0da?.['ok'] === ![] &&
        (showToast?.(_0x32c0da['message'] || t('nodeManager.toasts.renameFailed'), 'error'), _0x49391e());
    };
    (_0x8ca763['addEventListener']('pointerdown', (_0x12e4ab) => _0x12e4ab['stopPropagation']()),
      _0x8ca763['addEventListener']('keydown', (_0x258f03) => {
        if (_0x258f03['isComposing']) return;
        if (_0x258f03['key'] === 'Enter')
          (_0x258f03['preventDefault'](), _0x258f03['stopPropagation'](), _0x8ca763['blur']());
        else
          _0x258f03['key'] === 'Escape' &&
            (_0x258f03['preventDefault'](),
            _0x258f03['stopPropagation'](),
            _0x28b410(),
            _0xa50d6b['querySelector']('.node-manager-row-main')?.['focus']({ preventScroll: !![] }));
      }),
      _0x8ca763['addEventListener']('blur', _0x4ed675),
      _0x8ca763['focus'](),
      _0x8ca763['select']());
  }
  async function _0x4e6ab8(_0x48476d) {
    if (_0x5edd29['has'](_0x48476d['id'])) return;
    (_0x5edd29['add'](_0x48476d['id']), _0x30a3f5(_0x48476d['id'], !![]));
    try {
      await downloadNodeOutput({
        node: getStoreState(_0x3cf865)['nodes']?.[_0x48476d['id']] || _0x48476d['node'],
        nodeId: _0x48476d['id'],
        showToast: showToast,
      });
    } finally {
      (_0x5edd29['delete'](_0x48476d['id']), _0x30a3f5(_0x48476d['id'], ![]));
    }
  }
  function _0x4af253(_0x377a8a) {
    const _0x5f293f = _0x3a6360?.('node.delete', { ids: [_0x377a8a['id']] });
    _0x5f293f?.['ok'] === ![] &&
      showToast?.(_0x5f293f['message'] || t('nodeManager.toasts.deleteFailed'), 'error');
  }
  function _0x29e1a2(_0x49732e, _0x55f3ce, _0x5dda33, _0x40ecbc) {
    const _0x468a58 = _0x40ecbc?.['closest']?.('.node-manager-more-button');
    if (_0x468a58?.['getAttribute']?.('aria-expanded') === 'true') {
      _0x3ffaba();
      return;
    }
    (_0x3ffaba(), _0x468a58?.['setAttribute']?.('aria-expanded', 'true'));
    let _0x5f3dcd = null;
    ((_0x5f3dcd = showContextMenu(
      _0x55f3ce,
      _0x5dda33,
      [
        {
          label: t('nodeManager.actions.rename'),
          icon: 'edit',
          shortcutActionId: 'context-node-manager-rename',
          action: () => _0xc37659(_0x49732e),
        },
        {
          label: t('nodeManager.actions.download'),
          icon: 'download',
          disabled: _0x49732e['kind'] === 'group' || _0x5edd29['has'](_0x49732e['id']),
          shortcutActionId: 'context-node-manager-download',
          action: () => void _0x4e6ab8(_0x49732e),
        },
        {
          label: t('nodeManager.actions.delete'),
          icon: 'delete',
          danger: !![],
          shortcutActionId: 'context-node-manager-delete',
          action: () => _0x4af253(_0x49732e),
        },
      ],
      {
        ariaLabel: t('nodeManager.actions.menuAria', { name: _0x49732e['name'] }),
        ensureItemIcons: !![],
        dismissOnOwnerPointerDown: _0x468a58 ? ![] : undefined,
        ownerElement: _0x468a58 || _0x40ecbc?.['closest']?.('.node-manager-row') || _0x40ecbc,
        ownerRoot: _0x373f00,
        restoreTarget: _0x40ecbc,
        sidebarSubmenuOwner: SIDEBAR_KEY,
        onClose: () => {
          _0x468a58?.['setAttribute']?.('aria-expanded', 'false');
          if (_0x5db663 === _0x5f3dcd) _0x5db663 = null;
        },
      },
    )),
      (_0x5db663 = _0x5f3dcd));
  }
  function _0x1975e3(_0x1dee24, _0x734610) {
    const _0x5e8703 = _0x5edd29['has'](_0x1dee24['id']),
      _0x4ec6df = createElement('div', 'node-manager-row is-' + _0x1dee24['kind'], {
        role: 'listitem',
        'aria-busy': String(_0x5e8703),
        'data-node-id': _0x1dee24['id'],
      });
    (_0x4ec6df['classList']['toggle']('is-busy', _0x5e8703),
      _0x4ec6df['style']['setProperty'](
        '--node-manager-indent',
        Math['max'](0x0, _0x1dee24['depth']) * 0x10 + 'px',
      ));
    _0x1dee24['kind'] === 'group' &&
      _0x4ec6df['setAttribute']('aria-expanded', String(!_0x1dee24['collapsed']));
    if (_0x1dee24['kind'] === 'group') {
      const _0x28d442 = createElement('button', 'node-manager-group-chevron', {
        type: 'button',
        'aria-expanded': String(!_0x1dee24['collapsed']),
        'aria-label': t(_0x1dee24['collapsed'] ? 'nodeManager.expandGroup' : 'nodeManager.collapseGroup', {
          name: _0x1dee24['name'],
        }),
      });
      (_0x447511(_0x28d442, 'treeChevron'),
        _0x28d442['classList']['toggle']('is-open', !_0x1dee24['collapsed']),
        _0x28d442['addEventListener']('click', (_0x3dc452) => {
          (_0x3dc452['preventDefault'](), _0x3dc452['stopPropagation']());
          if (_0x33c939['has'](_0x1dee24['id'])) _0x33c939['delete'](_0x1dee24['id']);
          else _0x33c939['add'](_0x1dee24['id']);
          const _0x3c15b3 = !_0x33c939['has'](_0x1dee24['id']);
          (_0x4ec6df['setAttribute']('aria-expanded', String(_0x3c15b3)),
            _0x28d442['setAttribute']('aria-expanded', String(_0x3c15b3)),
            _0x28d442['setAttribute'](
              'aria-label',
              t(_0x3c15b3 ? 'nodeManager.collapseGroup' : 'nodeManager.expandGroup', {
                name: _0x1dee24['name'],
              }),
            ),
            _0x28d442['classList']['toggle']('is-open', _0x3c15b3));
          const _0x216265 = _0x5721c4['get'](_0x1dee24['id']);
          if (_0x216265) window['clearTimeout'](_0x216265);
          const _0x3da94d = window['matchMedia']?.('(prefers-reduced-motion:\x20reduce)')?.['matches'];
          if (_0x3da94d) {
            _0x5eb882();
            return;
          }
          _0x5721c4['set'](
            _0x1dee24['id'],
            window['setTimeout'](() => {
              (_0x5721c4['delete'](_0x1dee24['id']), _0x5eb882());
            }, GROUP_DISCLOSURE_MOTION_MS),
          );
        }),
        _0x4ec6df['appendChild'](_0x28d442));
    } else _0x4ec6df['appendChild'](createElement('span', 'node-manager-group-chevron-spacer'));
    const _0x425148 = createElement('button', 'node-manager-row-main', { type: 'button' });
    _0x425148['appendChild'](_0x27e6af(_0x1dee24, _0x734610));
    const _0x40c123 = _0x1dee24['name'] || t('nodeManager.unnamed'),
      _0x2fdd36 = createElement('span', 'node-manager-row-name', {
        'data-tooltip': _0x40c123,
        'data-tooltip-overflow': 'true',
      });
    ((_0x2fdd36['textContent'] = _0x40c123), _0x425148['appendChild'](_0x2fdd36));
    if (_0x1dee24['kind'] === 'group') {
      const _0x2535b0 = createElement('span', 'node-manager-group-count');
      ((_0x2535b0['textContent'] = t('nodeManager.groupCount', { count: _0x1dee24['childCount'] || 0x0 })),
        _0x425148['appendChild'](_0x2535b0));
    } else _0x2e904f['bindNodeRow']({ trigger: _0x425148, row: _0x4ec6df, nodeId: _0x1dee24['id'] });
    (_0x425148['addEventListener']('click', () => _0x1bc081(_0x1dee24)), _0x4ec6df['appendChild'](_0x425148));
    const _0x267812 = createElement('button', 'node-manager-more-button', {
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-label': t('nodeManager.actions.more'),
      title: t('nodeManager.actions.more'),
    });
    return (
      _0x447511(_0x267812, 'more', 'node-manager-more-icon'),
      _0x267812['addEventListener']('click', (_0x3b87b7) => {
        (_0x3b87b7['preventDefault'](), _0x3b87b7['stopPropagation']());
        const _0x1b3951 = _0x267812['getBoundingClientRect']();
        _0x29e1a2(_0x1dee24, _0x1b3951['right'], _0x1b3951['bottom'] + 0x4, _0x267812);
      }),
      _0x4ec6df['appendChild'](_0x267812),
      _0x5e8703 &&
        _0x4ec6df['appendChild'](
          createElement('span', 'project-package-loading-spinner\x20node-manager-row-spinner', {
            'aria-hidden': 'true',
          }),
        ),
      _0x4ec6df['addEventListener']('contextmenu', (_0x55e902) => {
        if (_0x55e902['target']?.['closest']?.('input')) return;
        (_0x55e902['preventDefault'](),
          _0x55e902['stopPropagation'](),
          _0x29e1a2(_0x1dee24, _0x55e902['clientX'], _0x55e902['clientY'], _0x425148));
      }),
      _0x4ec6df
    );
  }
  function _0x49391e({ force: force = ![] } = {}) {
    const _0x309b0d = getStoreState(_0x3cf865),
      _0x38f281 = _0x2aacbe['read'](_0x309b0d['nodes'] || {});
    if (!force && !_0x38f281['changed']) return;
    _0x23785e['clear']();
    const _0x3298dc = _0x373f00['scrollTop'],
      _0x5f5cd3 = _0x373f00['scrollLeft'];
    _0x126d01 = buildNodeManagerModel({
      nodes: _0x309b0d['nodes'] || {},
      filter: _0x3f8216,
      query: _0x234bba,
      collapsedGroupIds: _0x33c939,
    });
    const _0x144968 = [],
      _0x4a431a = new Set(_0x126d01['items']['map']((_0x1139bb) => _0x1139bb['id']));
    if (_0x30fd3c && !_0x4a431a['has'](_0x30fd3c['id'])) _0x28b410();
    if (_0x126d01['items']['length'] === 0x0) {
      const _0x196413 = createElement('div', 'node-manager-empty', { role: 'status' });
      ((_0x196413['textContent'] = t('nodeManager.empty')), _0x144968['push'](_0x196413));
    } else
      _0x126d01['items']['forEach']((_0x5e071f) => {
        const _0x4f2fcc = _0x38f281['byId']['get'](_0x5e071f['id']),
          _0x501794 = JSON['stringify']([
            _0x5e071f['name'],
            _0x5e071f['kind'],
            _0x5e071f['depth'],
            _0x5e071f['childCount'],
            _0x5e071f['collapsed'],
            t('nodeManager.actions.more'),
          ]);
        let _0x2cc855 = _0x22bee1['get'](_0x5e071f['id']);
        ((!_0x2cc855 ||
          ((_0x2cc855['signature'] !== _0x501794 || _0x2cc855['presentation'] !== _0x4f2fcc) &&
            _0x30fd3c?.['id'] !== _0x5e071f['id'])) &&
          ((_0x2cc855 = {
            signature: _0x501794,
            presentation: _0x4f2fcc,
            row: _0x1975e3(_0x5e071f, _0x4f2fcc?.['coverUrl'] || ''),
          }),
          _0x22bee1['set'](_0x5e071f['id'], _0x2cc855)),
          _0x144968['push'](_0x2cc855['row']));
      });
    _0x3ffaba();
    const _0x455f0d = _0x30fd3c?.['input'],
      _0x471d82 = _0x455f0d && document['activeElement'] === _0x455f0d,
      _0x3d2ec7 = _0x471d82 ? [_0x455f0d['selectionStart'], _0x455f0d['selectionEnd']] : null;
    _0x48030b = !![];
    try {
      let _0x1183ec = _0x373f00['firstChild'];
      for (const _0x2e2888 of _0x144968) {
        if (_0x2e2888 !== _0x1183ec) _0x373f00['insertBefore'](_0x2e2888, _0x1183ec);
        _0x1183ec = _0x2e2888['nextSibling'];
      }
      while (_0x1183ec) {
        const _0x2da964 = _0x1183ec['nextSibling'];
        (_0x1183ec['remove'](), (_0x1183ec = _0x2da964));
      }
      _0x471d82 &&
        _0x455f0d['isConnected'] &&
        document['activeElement'] !== _0x455f0d &&
        (_0x455f0d['focus']({ preventScroll: !![] }), _0x455f0d['setSelectionRange'](..._0x3d2ec7));
    } finally {
      _0x48030b = ![];
    }
    for (const _0x988728 of _0x22bee1['keys']())
      if (!_0x4a431a['has'](_0x988728)) _0x22bee1['delete'](_0x988728);
    ((_0x373f00['scrollTop'] = _0x3298dc),
      (_0x373f00['scrollLeft'] = _0x5f5cd3),
      (_0x28acd7['textContent'] = t('nodeManager.filters.' + _0x3f8216)),
      (_0x75d484['textContent'] = t('nodeManager.total', { count: _0x126d01['totalNodeCount'] })),
      _0x5aeaac(),
      _0x578250());
  }
  function _0x5eb882() {
    _0x49391e({ force: !![] });
  }
  function _0x80daad(_0x482490 = _0x30dfe8) {
    if (_0x482490['getAttribute']('aria-expanded') === 'true') {
      _0x3ffaba();
      return;
    }
    (_0x3ffaba(), _0x482490['setAttribute']('aria-expanded', 'true'));
    const _0x23ef50 = _0x482490['getBoundingClientRect']();
    let _0x54d38e = null;
    ((_0x54d38e = showContextMenu(
      _0x23ef50['left'],
      _0x23ef50['bottom'] + 0x4,
      NODE_MANAGER_FILTERS['map']((_0x3022d7) => ({
        label: t('nodeManager.filters.' + _0x3022d7),
        checked: _0x3022d7 === _0x3f8216,
        action: () => {
          if (_0x3022d7 === _0x3f8216) return;
          ((_0x3f8216 = _0x3022d7), _0x5eb882());
        },
      })),
      {
        ariaLabel: t('nodeManager.filter'),
        dismissOnOwnerPointerDown: ![],
        ownerElement: _0x482490,
        ownerRoot: _0x3997f3,
        restoreTarget: _0x482490,
        sidebarSubmenuOwner: SIDEBAR_KEY,
        onClose: () => {
          _0x482490['setAttribute']('aria-expanded', 'false');
          if (_0x5db663 === _0x54d38e) _0x5db663 = null;
        },
      },
    )),
      (_0x5db663 = _0x54d38e));
  }
  function _0x9462d7(_0x205408, { clear: clear = ![], focus: focus = !![] } = {}) {
    _0x39ce90 = _0x205408 === !![];
    clear && ((_0x234bba = ''), (_0x454172['value'] = ''));
    _0x3d51a2['classList']['toggle']('is-searching', _0x39ce90);
    if (focus && _0x39ce90) requestAnimationFrame(() => _0x454172['focus']());
    _0x5eb882();
  }
  function _0xffa3a5() {
    _0x2dcc8b?.();
    const _0x54fbf0 = window['CanvasTabManager']?.['getActiveCanvasId']?.(),
      _0x42aa28 = getProjectName(),
      _0x379950 = createElement('input', 'node-manager-project-rename', {
        type: 'text',
        'aria-label': t('nodeManager.projectNameAria'),
      });
    ((_0x379950['value'] = _0x42aa28), _0x1ed2a1['replaceChildren'](_0x379950));
    let _0x53828f = ![],
      _0x6ac0b0 = ![];
    const _0xed80e3 = () => {
        (_0x2dcc8b === _0x3cad01 && ((_0x2dcc8b = null), _0x4a8171['removeAttribute']('aria-busy')),
          _0x1ed2a1['replaceChildren'](_0x433d98),
          _0x499abe());
      },
      _0x3cad01 = () => {
        if (_0x53828f) return;
        ((_0x53828f = !![]), _0xed80e3());
      };
    _0x2dcc8b = _0x3cad01;
    const _0x194a27 = async () => {
      if (_0x53828f || _0x6ac0b0) return;
      if (window['CanvasTabManager']?.['getActiveCanvasId']?.() !== _0x54fbf0) {
        _0x3cad01();
        return;
      }
      const _0x4f6dd1 = String(_0x379950['value'] || '')
        ['replace'](/\s+/g, '\x20')
        ['trim']();
      if (!_0x4f6dd1 || _0x4f6dd1 === _0x42aa28) {
        _0x3cad01();
        return;
      }
      ((_0x6ac0b0 = !![]), (_0x379950['disabled'] = !![]), _0x4a8171['setAttribute']('aria-busy', 'true'));
      const _0x1aa373 = createElement(
        'span',
        'project-package-loading-spinner\x20node-manager-project-spinner',
        { 'aria-hidden': 'true' },
      );
      _0x1ed2a1['appendChild'](_0x1aa373);
      try {
        const _0x18bccc = await Promise['resolve'](_0x1ecaec?.(_0x4f6dd1));
        if (_0x53828f) return;
        if (!_0x18bccc) throw new Error(t('nodeManager.toasts.projectRenameFailed'));
        ((_0x53828f = !![]), _0xed80e3());
      } catch (_0x234f22) {
        if (_0x53828f) return;
        ((_0x6ac0b0 = ![]),
          (_0x379950['disabled'] = ![]),
          _0x1aa373['remove'](),
          showToast?.(_0x234f22?.['message'] || t('nodeManager.toasts.projectRenameFailed'), 'error'),
          _0x379950['focus'](),
          _0x379950['select']());
      } finally {
        (!_0x2dcc8b || _0x2dcc8b === _0x3cad01) && _0x4a8171['removeAttribute']('aria-busy');
      }
    };
    (_0x379950['addEventListener']('keydown', (_0x111518) => {
      if (_0x111518['isComposing']) return;
      if (_0x111518['key'] === 'Enter')
        (_0x111518['preventDefault'](), _0x111518['stopPropagation'](), void _0x194a27());
      else
        _0x111518['key'] === 'Escape' &&
          (_0x111518['preventDefault'](), _0x111518['stopPropagation'](), _0x3cad01());
    }),
      _0x379950['addEventListener']('blur', () => void _0x194a27()),
      _0x379950['focus'](),
      _0x379950['select']());
  }
  function _0x45e7ee() {
    (_0x3d51a2['classList']['add']('show'),
      _0x3d51a2['setAttribute']('aria-hidden', 'false'),
      wrap['classList']['add']('node-manager-open'),
      _0x596497(),
      _0x49391e({ force: !![] }));
  }
  function _0x1d935a() {
    (_0x28b410(), _0x2dcc8b?.());
    const _0x2262cf = _0x3d51a2['contains'](document['activeElement']);
    (_0x3ffaba(),
      _0x3d51a2['classList']['remove']('show'),
      _0x3d51a2['setAttribute']('aria-hidden', 'true'),
      wrap['classList']['remove']('node-manager-open'));
    if (_0x2262cf) requestAnimationFrame(() => button['focus']());
  }
  (registerSidebarSubmenu({
    key: SIDEBAR_KEY,
    button: button,
    panel: _0x3d51a2,
    open: _0x45e7ee,
    close: _0x1d935a,
    isOpen: _0x22d5f8,
    closeOnOutsidePointerDown: ![],
    ignorePointerDown: (_0xc6bbbb) =>
      !!_0xc6bbbb?.['target']?.['closest']?.('[data-sidebar-submenu-owner="' + SIDEBAR_KEY + '\x22]'),
  }),
    button['removeAttribute']('aria-haspopup'),
    _0x433d98['addEventListener']('click', _0xffa3a5),
    _0x3b45be['addEventListener']('click', () => _0x9462d7(!![])),
    _0x3bbf24['addEventListener']('click', () => _0x9462d7(![], { clear: !![], focus: ![] })),
    _0x30dfe8['addEventListener']('click', () => _0x80daad(_0x30dfe8)),
    _0x9f06ab['addEventListener']('click', () => _0x80daad(_0x9f06ab)),
    _0x28d0e7['addEventListener']('click', () => {
      const _0x5a3cd2 = _0x126d01['groupIds'] || [],
        _0x4f892d =
          _0x5a3cd2['length'] > 0x0 && _0x5a3cd2['every']((_0x430e84) => _0x33c939['has'](_0x430e84));
      if (_0x4f892d) _0x33c939['clear']();
      else _0x5a3cd2['forEach']((_0x19fb41) => _0x33c939['add'](_0x19fb41));
      _0x5eb882();
    }),
    _0x3d6650['addEventListener']('click', () => closeSidebarSubmenu(SIDEBAR_KEY)),
    _0x22a083['addEventListener']('click', () => closeSidebarSubmenu(SIDEBAR_KEY)),
    _0x454172['addEventListener']('input', () => {
      ((_0x234bba = _0x454172['value']), _0x5eb882());
    }),
    _0x454172['addEventListener']('keydown', (_0x2662a7) => {
      if (_0x2662a7['key'] !== 'Escape') return;
      (_0x2662a7['preventDefault'](),
        _0x2662a7['stopPropagation'](),
        _0x9462d7(![], { clear: !![], focus: ![] }),
        _0x3b45be['focus']());
    }),
    _0x49250f['push'](
      installScrollableWheelBoundary(_0x373f00, {
        getAxis: () => (_0x3d51a2['dataset']['placement'] === 'bottom' ? 'horizontal' : 'vertical'),
      }),
    ),
    _0x49250f['push'](() => {
      (_0x5721c4['forEach']((_0x42931d) => window['clearTimeout'](_0x42931d)), _0x5721c4['clear']());
    }));
  const _0x11204a = _0x3cf865['subscribeSelector']?.(
      (_0x2d737b) => Number(_0x2d737b['_nodesRev'] || 0x0),
      () => {
        if (!_0x22d5f8()) return;
        _0x49391e();
      },
    ),
    _0x57ada7 = _0x3cf865['subscribeSelector']?.(
      (_0x3862fb) => (_0x3862fb['selectedNodeIds'] || [])['join']('|'),
      _0x578250,
    ),
    _0x53a125 = _0x3850c2?.['subscribeSelector']?.(
      (_0x1936e5) => normalizeNodeManagerPlacement(_0x1936e5['ui']?.['nodeManagerPlacement']),
      _0x1f1cb8,
    );
  _0x49250f['push'](_0x11204a, _0x57ada7, _0x53a125);
  const _0x318ca6 = (_0x381529) => _0x1f1cb8(_0x381529?.['detail']?.['placement']),
    _0x3285d9 = () => {
      (_0x28b410(), _0x2dcc8b?.(), _0x499abe(), _0x2aacbe['clear']());
      if (_0x22d5f8()) _0x49391e({ force: !![] });
    },
    _0x500664 = () => {
      _0x596497();
      if (_0x22d5f8()) _0x5eb882();
    };
  (window['addEventListener'](NODE_MANAGER_PLACEMENT_EVENT, _0x318ca6),
    window['addEventListener']('aicanvas:active-canvas-changed', _0x3285d9),
    window['addEventListener']('aicanvas:locale-change', _0x500664),
    _0x49250f['push'](() => window['removeEventListener'](NODE_MANAGER_PLACEMENT_EVENT, _0x318ca6)),
    _0x49250f['push'](() => window['removeEventListener']('aicanvas:active-canvas-changed', _0x3285d9)),
    _0x49250f['push'](() => window['removeEventListener']('aicanvas:locale-change', _0x500664)));
  const _0xadbdc5 = document['getElementById']('projectNameText'),
    _0x2d3b70 = _0xadbdc5 && typeof MutationObserver === 'function' ? new MutationObserver(_0x499abe) : null;
  return (
    _0x2d3b70?.['observe'](_0xadbdc5, { childList: !![], characterData: !![], subtree: !![] }),
    _0x49250f['push'](() => _0x2d3b70?.['disconnect']()),
    _0x1f1cb8(getStoreState(_0x3850c2)['ui']?.['nodeManagerPlacement']),
    _0x596497(),
    _0x49391e({ force: !![] }),
    {
      panel: _0x3d51a2,
      open: () => _0x45e7ee(),
      close: () => closeSidebarSubmenu(SIDEBAR_KEY),
      destroy() {
        (_0x1d935a(),
          _0x22bee1['clear'](),
          _0x2aacbe['clear'](),
          _0x23785e['clear'](),
          _0x49250f['forEach']((_0x566798) => _0x566798?.()),
          _0x3d51a2['remove']());
      },
    }
  );
}
