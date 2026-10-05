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
  GROUP_DISCLOSURE_MOTION_MS = 150,
  VIDEO_PLAY_RETRY_MS = 1600,
  ICON_SELECTORS = Object['freeze']({
    audio: '.nam-item[data-type="audio"] svg',
    chevron: '#localeSelectTrigger .settings-preset-chevron',
    close: '#btnSettingsClose svg',
    filter: '.settings-nav-item[data-pane="canvas-align"] svg',
    image: '.nam-item[data-type="image"] svg',
    more: '.v2-material-more svg, .act-more-tools svg',
    node: '#btnNodeManager svg',
    search: '.settings-shortcuts-search-icon',
    text: '.nam-item[data-type="text"] svg',
    video: '.nam-item[data-type="video"] svg',
    videoPlay: '.video-play-btn svg',
  });
function createSharedIcon(value) {
  const item =
    value === 'more'
      ? NODE_TOOLBAR_MORE_ICON_SVG
      : value === 'treeChevron'
        ? MATERIAL_TREE_CHEVRON_ICON_SVG
        : value === 'collapse'
          ? PANEL_COLLAPSE_LEFT_ICON_SVG
          : '';
  return item ? createSafeSvg(item) : null;
}
function getStoreState(store) {
  return store?.['getStateRaw']?.() || store?.['getState']?.() || {};
}
function createElement(key, index = '', result = {}) {
  const el = document['createElement'](key);
  if (index) el['className'] = index;
  return (
    Object['entries'](result)['forEach'](([data, options]) => {
      if (options == null) return;
      el['setAttribute'](data, String(options));
    }),
    el
  );
}
function cloneExistingIcon(target, source = '', map) {
  const next = ICON_SELECTORS[target] || '';
  !map['has'](target) &&
    map['set'](target, (next ? document['querySelector'](next) : null) || createSharedIcon(target));
  const current = map['get'](target),
    el2 = current?.['cloneNode']?.(!![]);
  if (!el2) return null;
  (el2['removeAttribute']?.('id'),
    el2['setAttribute']?.('aria-hidden', 'true'),
    el2['setAttribute']?.('focusable', 'false'));
  if (source) el2['classList']?.['add'](source);
  return el2;
}
function installNodeManagerButtonIcon(el3) {
  if (!el3 || el3['querySelector']?.('svg')) return;
  const entry = document['querySelector']('#btnToggleDots svg'),
    el4 = entry?.['cloneNode']?.(!![]);
  if (!el4) return;
  (el4['removeAttribute']?.('id'),
    el4['setAttribute']?.('width', '20'),
    el4['setAttribute']?.('height', '20'),
    el4['setAttribute']?.('aria-hidden', 'true'),
    el4['setAttribute']?.('focusable', 'false'),
    el3['appendChild'](el4));
}
function getProjectName() {
  const record = window['CanvasTabManager']?.['getCanvasProjectContext']?.(),
    payload = document['getElementById']('projectNameText')?.['textContent'];
  return String(record?.['projectName'] || payload || t('projectDropdown.unnamedCanvas'))
    ['replace'](/\s+/g, ' ')
    ['trim']();
}
function normalizeWheelDelta(event, handle) {
  const state =
    event['deltaMode'] === 1 ? 16 : event['deltaMode'] === 2 ? Math['max'](1, handle) : 1;
  return (Number(event['deltaY']) || Number(event['deltaX']) || 0) * state;
}
export function installScrollableWheelBoundary(el5, { getAxis: getAxis = () => 'vertical' } = {}) {
  const config = (event2) => {
    if (getAxis() === 'horizontal') {
      const scope = Math['max'](0, Number(el5['clientWidth']) || 0),
        count = Math['max'](0, (Number(el5['scrollWidth']) || 0) - scope);
      if (count <= 0) return;
      if (!scrollElementHorizontallyWithWheel(event2, el5, { stopPropagation: !![] })) {
        const enabled = Number(event2['deltaY']) || Number(event2['deltaX']) || 0;
        if (!enabled) return;
        (event2['preventDefault'](), event2['stopPropagation']());
      }
      return;
    }
    const input = Math['max'](0, Number(el5['clientHeight']) || 0),
      count2 = Math['max'](0, (Number(el5['scrollHeight']) || 0) - input);
    if (count2 <= 0) return;
    const wheelDelta = normalizeWheelDelta(event2, input);
    if (!wheelDelta) return;
    ((el5['scrollTop'] = Math['min'](
      count2,
      Math['max'](0, (Number(el5['scrollTop']) || 0) + wheelDelta),
    )),
      event2['preventDefault'](),
      event2['stopPropagation']());
  };
  return (
    el5['addEventListener']('wheel', config, { passive: ![] }),
    () => el5['removeEventListener']('wheel', config)
  );
}
function normalizeRect(box) {
  const left = Number(box?.['left']) || 0,
    top = Number(box?.['top']) || 0,
    width = Math['max'](0, Number(box?.['width']) || 0),
    height = Math['max'](0, Number(box?.['height']) || 0);
  return {
    left: left,
    top: top,
    width: width,
    height: height,
    right: Number['isFinite'](Number(box?.['right'])) ? Number(box['right']) : left + width,
    bottom: Number['isFinite'](Number(box?.['bottom'])) ? Number(box['bottom']) : top + height,
  };
}
export function resolveNodeManagerViewportInsets({
  placement: placement,
  panelRect: panelRect,
  canvasRect: canvasRect,
  gap: gap = 12,
} = {}) {
  const box2 = normalizeRect(panelRect),
    box3 = normalizeRect(canvasRect),
    output = Math['max'](0, Number(gap) || 0),
    box4 = { top: 0, right: 0, bottom: 0, left: 0 };
  if (!(box3['width'] > 0 && box3['height'] > 0)) return box4;
  const enabled2 = box2['right'] > box3['left'] && box2['left'] < box3['right'],
    enabled3 = box2['bottom'] > box3['top'] && box2['top'] < box3['bottom'];
  if (!enabled2 || !enabled3) return box4;
  const nodeManagerPlacement = normalizeNodeManagerPlacement(placement);
  if (nodeManagerPlacement === 'left')
    box4['left'] = Math['min'](box3['width'] - 1, Math['max'](0, box2['right'] - box3['left'] + output));
  else
    nodeManagerPlacement === 'right'
      ? (box4['right'] = Math['min'](
          box3['width'] - 1,
          Math['max'](0, box3['right'] - box2['left'] + output),
        ))
      : (box4['bottom'] = Math['min'](
          box3['height'] - 1,
          Math['max'](0, box3['bottom'] - box2['top'] + output),
        ));
  return box4;
}
export function createNodeManagerPanel({
  graphStore: graphStore,
  uiStore: uiStore,
  appViewport: appViewport,
  executeCanvasCommand: executeCanvasCommand,
  renameCurrentProject: renameCurrentProject,
  wrap: wrap = document['getElementById']('v2-wrap'),
  canvasStage: canvasStage = document['querySelector']('.v2-canvas-stage'),
  button: button = document['getElementById']('btnNodeManager'),
  showToast: showToast = window['showToast'],
} = {}) {
  if (!graphStore || !wrap || !button) return null;
  installNodeManagerButtonIcon(button);
  const map2 = new Map(),
    handler = (value2, value3) => cloneExistingIcon(value2, value3, map2);
  function run(el6, value4, value5 = '') {
    const value6 = handler(value4, value5);
    if (value6) el6['appendChild'](value6);
    return value6;
  }
  let filter = 'all',
    query = '',
    value7 = ![],
    value8 = null;
  const map3 = createNodeManagerListSnapshot(),
    map4 = new Map();
  let value9 = null,
    enabled4 = null,
    value10 = ![],
    count3 = buildNodeManagerModel({ nodes: {} });
  const collapsedGroupIds = new Set(),
    map5 = new Set(),
    map6 = new Map(),
    list = [];
  let placement2 = null;
  const run2 = () => ({
      maxZoom: 1.15,
      viewportInsets: resolveNodeManagerViewportInsets({
        placement: placement2?.['dataset']?.['placement'],
        panelRect: placement2?.['getBoundingClientRect']?.(),
        canvasRect: canvasStage?.['getBoundingClientRect']?.(),
      }),
    }),
    nodeManagerDragController = createNodeManagerDragController({
      graphStore: graphStore,
      wrap: wrap,
      canvasStage: canvasStage,
      executeCanvasCommand: executeCanvasCommand,
      onDuplicateFailed: (error) => {
        showToast?.(error?.['message'] || t('nodeManager.toasts.duplicateFailed'), 'error');
      },
      onDuplicated: (value11) => {
        appViewport?.['focusNode']?.(value11, 96, 240, run2());
      },
    });
  (list['push'](() => nodeManagerDragController['destroy']()),
    (placement2 = createElement('section', 'node-manager-panel canvas-toolbar-panel-surface', {
      id: 'nodeManagerPanel',
      role: 'complementary',
      'aria-hidden': 'true',
      'data-ui-stop': '1',
    })));
  const el7 = createElement('h2', 'node-manager-visually-hidden'),
    el8 = createElement('div', 'node-manager-project-row'),
    el9 = createElement('div', 'node-manager-project-name-host'),
    el10 = createElement('button', 'node-manager-project-name', { type: 'button' }),
    el11 = createElement('span', 'node-manager-project-name-text', { 'data-tooltip-overflow': 'true' });
  (el10['append'](el11), el9['appendChild'](el10));
  const el12 = createElement('button', 'node-manager-icon-button node-manager-header-collapse', {
    type: 'button',
  });
  (run(el12, 'collapse', 'node-manager-collapse-icon'), el8['append'](el9, el12));
  const ownerRoot = createElement('div', 'node-manager-controls'),
    element = createElement('div', 'node-manager-default-controls'),
    el13 = createElement('span', 'node-manager-list-title'),
    el14 = createElement('button', 'node-manager-icon-button node-manager-group-toggle', {
      type: 'button',
    });
  run(el14, 'chevron', 'node-manager-group-toggle-icon');
  const el15 = createElement('button', 'node-manager-filter-button', {
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
    }),
    el16 = createElement('span', 'node-manager-filter-label'),
    value12 = handler('chevron', 'node-manager-filter-chevron');
  el15['appendChild'](el16);
  if (value12) el15['appendChild'](value12);
  const el17 = createElement('button', 'node-manager-icon-button', { type: 'button' });
  (run(el17, 'search'), element['append'](el13, el14, el15, el17));
  const element2 = createElement('div', 'node-manager-search-controls'),
    el18 = createElement('label', 'node-manager-search-field'),
    el19 = createElement('input', 'node-manager-search-input', {
      type: 'search',
      autocomplete: 'off',
      spellcheck: 'false',
    });
  (run(el18, 'search', 'node-manager-search-field-icon'), el18['appendChild'](el19));
  const el20 = createElement('button', 'node-manager-icon-button node-manager-search-filter-button', {
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
  });
  run(el20, 'filter', 'node-manager-filter-search-icon');
  const el21 = createElement('button', 'node-manager-icon-button', { type: 'button' });
  (run(el21, 'close'), element2['append'](el18, el20, el21), ownerRoot['append'](element, element2));
  const ownerRoot2 = createElement('div', 'node-manager-list', { role: 'list', tabindex: '0' }),
    element3 = createElement('footer', 'node-manager-footer'),
    el22 = createElement('button', 'node-manager-collapse-button', { type: 'button' });
  run(el22, 'collapse', 'node-manager-collapse-icon');
  const el23 = createElement('span', 'node-manager-collapse-label');
  el22['appendChild'](el23);
  const el24 = createElement('span', 'node-manager-total');
  (element3['append'](el22, el24),
    placement2['append'](el7, el8, ownerRoot, ownerRoot2, element3),
    wrap['appendChild'](placement2));
  function isOpen() {
    return placement2['classList']['contains']('show');
  }
  function run3() {
    (value8?.['close']?.({ restoreFocus: ![] }), (value8 = null));
  }
  function run4(value13) {
    const nodeManagerPlacement2 = normalizeNodeManagerPlacement(value13);
    return ((placement2['dataset']['placement'] = nodeManagerPlacement2), nodeManagerPlacement2);
  }
  function run5() {
    const projectName = getProjectName();
    ((el11['textContent'] = projectName), el11['setAttribute']('data-tooltip', projectName));
  }
  function run6() {
    const list2 = count3['groupIds'] || [],
      value14 = list2['length'] > 0 && list2['every']((value15) => collapsedGroupIds['has'](value15)),
      t2 = t(value14 ? 'nodeManager.expandAll' : 'nodeManager.collapseAll');
    ((el14['hidden'] = list2['length'] === 0),
      el14['classList']['toggle']('is-expand-action', value14),
      el14['setAttribute']('aria-label', t2),
      (el14['title'] = t2));
  }
  function run7() {
    ((el7['textContent'] = t('nodeManager.title')),
      placement2['setAttribute']('aria-label', t('nodeManager.title')),
      el10['setAttribute']('aria-label', t('nodeManager.renameProjectAria')),
      (el13['textContent'] = t('nodeManager.listTitle')),
      ownerRoot2['setAttribute']('aria-label', t('nodeManager.listAria')),
      el17['setAttribute']('aria-label', t('nodeManager.search')),
      (el17['title'] = t('nodeManager.search')),
      (el19['placeholder'] = t('nodeManager.searchPlaceholder')),
      el19['setAttribute']('aria-label', t('nodeManager.search')),
      el21['setAttribute']('aria-label', t('nodeManager.closeSearch')),
      (el21['title'] = t('nodeManager.closeSearch')),
      el15['setAttribute']('aria-label', t('nodeManager.filter')),
      (el15['title'] = t('nodeManager.filter')),
      el20['setAttribute']('aria-label', t('nodeManager.filter')),
      (el20['title'] = t('nodeManager.filter')),
      (el16['textContent'] = t('nodeManager.filters.' + filter)),
      el22['setAttribute']('aria-label', t('nodeManager.collapsePanel')),
      (el22['title'] = t('nodeManager.collapsePanel')),
      el12['setAttribute']('aria-label', t('nodeManager.collapsePanel')),
      (el12['title'] = t('nodeManager.collapsePanel')),
      (el23['textContent'] = t('nodeManager.collapsePanel')),
      (el24['textContent'] = t('nodeManager.total', { count: count3['totalNodeCount'] || 0 })),
      run5(),
      run6());
  }
  function run8() {
    if (!isOpen()) return;
    const map7 = new Set(getStoreState(graphStore)['selectedNodeIds'] || []);
    ownerRoot2['querySelectorAll']('.node-manager-row[data-node-id]')['forEach']((el25) => {
      const value16 = map7['has'](el25['dataset']['nodeId']);
      el25['classList']['toggle']('is-selected', value16);
      const el26 = el25['querySelector']('.node-manager-row-main');
      if (value16) el26?.['setAttribute']('aria-current', 'true');
      else el26?.['removeAttribute']('aria-current');
    });
  }
  function run9(value17) {
    const value18 = String(value17 || '');
    return (
      Array['from'](ownerRoot2['querySelectorAll']('.node-manager-row[data-node-id]'))['find'](
        (el27) => el27['dataset']['nodeId'] === value18,
      ) || null
    );
  }
  function run10(value19, value20) {
    const value21 = value20 === 'group' ? 'folder' : ICON_SELECTORS[value20] ? value20 : 'node';
    run(value19, value21, 'node-manager-thumb-fallback-icon');
  }
  function run11(value22, src) {
    const el28 = createElement('span', 'node-manager-thumb is-' + value22['category']);
    if (value22['kind'] === 'group')
      return (
        el28['classList']['add']('node-manager-folder-icon'),
        (el28['innerHTML'] = MATERIAL_FOLDER_ICON_MARKUP),
        el28
      );
    if (!src) return (run10(el28, value22['category']), el28);
    const el29 = createElement('img', 'node-manager-thumb-image', {
      src: src,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      draggable: 'false',
    });
    (el29['addEventListener'](
      'error',
      () => {
        (el29['remove'](), run10(el28, value22['category']));
      },
      { once: !![] },
    ),
      el28['appendChild'](el29));
    if (value22['category'] === 'video') {
      const element4 = createElement('span', 'node-manager-video-badge');
      if (run(element4, 'videoPlay')) el28['appendChild'](element4);
    }
    return el28;
  }
  function run12(value23) {
    const el30 = document['getElementById'](value23),
      value24 = el30?.['querySelector']?.('video');
    if (value24 && value24['paused'] === ![]) return !![];
    const el31 = el30?.['querySelector']?.('.video-play-btn');
    if (el31) return (el31['click'](), !![]);
    if (value24?.['play']) return (Promise['resolve'](value24['play']())['catch'](() => {}), !![]);
    return ![];
  }
  function run13(value25) {
    const value26 = performance['now'](),
      value27 = () => {
        if (run12(value25)) return;
        performance['now']() - value26 < VIDEO_PLAY_RETRY_MS && requestAnimationFrame(value27);
      };
    window['setTimeout'](value27, 280);
  }
  function run14(value28) {
    const response = executeCanvasCommand?.('node.select', { ids: [value28['id']] });
    if (response?.['ok'] === ![]) return;
    if (value28['category'] === 'video') run12(value28['id']);
    appViewport?.['focusNode']?.(value28['id'], 96, 320, run2());
    if (value28['category'] === 'video') run13(value28['id']);
  }
  function run15(value29, value30) {
    const el32 = run9(value29);
    if (!el32) return;
    (el32['classList']['toggle']('is-busy', value30),
      el32['setAttribute']('aria-busy', String(value30)),
      el32['querySelector']('.node-manager-row-spinner')?.['remove']());
    if (value30) {
      const element5 = createElement('span', 'project-package-loading-spinner node-manager-row-spinner', {
        'aria-hidden': 'true',
      });
      el32['appendChild'](element5);
    }
  }
  function run16() {
    value9?.['cancel']();
  }
  function run17(id) {
    run16();
    const el33 = run9(id['id']),
      el34 = el33?.['querySelector']('.node-manager-row-name');
    if (!el33 || !el34) return;
    const nodeManagerName = resolveNodeManagerName(getStoreState(graphStore)['nodes']?.[id['id']], id['id']),
      input2 = createElement('input', 'node-manager-row-rename', {
        type: 'text',
        'aria-label': t('nodeManager.actions.rename'),
      });
    ((input2['value'] = nodeManagerName),
      el34['replaceChildren'](input2),
      el33['classList']['add']('is-renaming'));
    let value31 = ![];
    const cancel = () => {
      ((value31 = !![]),
        (value9 = null),
        (el34['textContent'] = resolveNodeManagerName(
          getStoreState(graphStore)['nodes']?.[id['id']],
          id['id'],
        )),
        (el34['dataset']['tooltip'] = el34['textContent']),
        el33['classList']['remove']('is-renaming'),
        map4['delete'](id['id']));
    };
    value9 = { id: id['id'], input: input2, cancel: cancel };
    const value32 = () => {
      if (value31 || value10) return;
      const name = String(input2['value'] || '')
          ['replace'](/\s+/g, ' ')
          ['trim'](),
        enabled5 = input2['isConnected'];
      cancel();
      if (!enabled5) return;
      if (!name || name === nodeManagerName) return;
      const error2 = executeCanvasCommand?.('node.rename', { nodeId: id['id'], name: name });
      error2?.['ok'] === ![] &&
        (showToast?.(error2['message'] || t('nodeManager.toasts.renameFailed'), 'error'), run18());
    };
    (input2['addEventListener']('pointerdown', (event3) => event3['stopPropagation']()),
      input2['addEventListener']('keydown', (event4) => {
        if (event4['isComposing']) return;
        if (event4['key'] === 'Enter')
          (event4['preventDefault'](), event4['stopPropagation'](), input2['blur']());
        else
          event4['key'] === 'Escape' &&
            (event4['preventDefault'](),
            event4['stopPropagation'](),
            run16(),
            el33['querySelector']('.node-manager-row-main')?.['focus']({ preventScroll: !![] }));
      }),
      input2['addEventListener']('blur', value32),
      input2['focus'](),
      input2['select']());
  }
  async function run19(nodeId) {
    if (map5['has'](nodeId['id'])) return;
    (map5['add'](nodeId['id']), run15(nodeId['id'], !![]));
    try {
      await downloadNodeOutput({
        node: getStoreState(graphStore)['nodes']?.[nodeId['id']] || nodeId['node'],
        nodeId: nodeId['id'],
        showToast: showToast,
      });
    } finally {
      (map5['delete'](nodeId['id']), run15(nodeId['id'], ![]));
    }
  }
  function run20(value33) {
    const error3 = executeCanvasCommand?.('node.delete', { ids: [value33['id']] });
    error3?.['ok'] === ![] && showToast?.(error3['message'] || t('nodeManager.toasts.deleteFailed'), 'error');
  }
  function run21(disabled, value34, value35, restoreTarget) {
    const dismissOnOwnerPointerDown = restoreTarget?.['closest']?.('.node-manager-more-button');
    if (dismissOnOwnerPointerDown?.['getAttribute']?.('aria-expanded') === 'true') {
      run3();
      return;
    }
    (run3(), dismissOnOwnerPointerDown?.['setAttribute']?.('aria-expanded', 'true'));
    let showContextMenu2 = null;
    ((showContextMenu2 = showContextMenu(
      value34,
      value35,
      [
        {
          label: t('nodeManager.actions.rename'),
          icon: 'edit',
          shortcutActionId: 'context-node-manager-rename',
          action: () => run17(disabled),
        },
        {
          label: t('nodeManager.actions.download'),
          icon: 'download',
          disabled: disabled['kind'] === 'group' || map5['has'](disabled['id']),
          shortcutActionId: 'context-node-manager-download',
          action: () => void run19(disabled),
        },
        {
          label: t('nodeManager.actions.delete'),
          icon: 'delete',
          danger: !![],
          shortcutActionId: 'context-node-manager-delete',
          action: () => run20(disabled),
        },
      ],
      {
        ariaLabel: t('nodeManager.actions.menuAria', { name: disabled['name'] }),
        ensureItemIcons: !![],
        dismissOnOwnerPointerDown: dismissOnOwnerPointerDown ? ![] : undefined,
        ownerElement:
          dismissOnOwnerPointerDown || restoreTarget?.['closest']?.('.node-manager-row') || restoreTarget,
        ownerRoot: ownerRoot2,
        restoreTarget: restoreTarget,
        sidebarSubmenuOwner: SIDEBAR_KEY,
        onClose: () => {
          dismissOnOwnerPointerDown?.['setAttribute']?.('aria-expanded', 'false');
          if (value8 === showContextMenu2) value8 = null;
        },
      },
    )),
      (value8 = showContextMenu2));
  }
  function row(name2, value36) {
    const value37 = map5['has'](name2['id']),
      row2 = createElement('div', 'node-manager-row is-' + name2['kind'], {
        role: 'listitem',
        'aria-busy': String(value37),
        'data-node-id': name2['id'],
      });
    (row2['classList']['toggle']('is-busy', value37),
      row2['style']['setProperty']('--node-manager-indent', Math['max'](0, name2['depth']) * 16 + 'px'));
    name2['kind'] === 'group' && row2['setAttribute']('aria-expanded', String(!name2['collapsed']));
    if (name2['kind'] === 'group') {
      const el35 = createElement('button', 'node-manager-group-chevron', {
        type: 'button',
        'aria-expanded': String(!name2['collapsed']),
        'aria-label': t(name2['collapsed'] ? 'nodeManager.expandGroup' : 'nodeManager.collapseGroup', {
          name: name2['name'],
        }),
      });
      (run(el35, 'treeChevron'),
        el35['classList']['toggle']('is-open', !name2['collapsed']),
        el35['addEventListener']('click', (event5) => {
          (event5['preventDefault'](), event5['stopPropagation']());
          if (collapsedGroupIds['has'](name2['id'])) collapsedGroupIds['delete'](name2['id']);
          else collapsedGroupIds['add'](name2['id']);
          const value38 = !collapsedGroupIds['has'](name2['id']);
          (row2['setAttribute']('aria-expanded', String(value38)),
            el35['setAttribute']('aria-expanded', String(value38)),
            el35['setAttribute'](
              'aria-label',
              t(value38 ? 'nodeManager.collapseGroup' : 'nodeManager.expandGroup', {
                name: name2['name'],
              }),
            ),
            el35['classList']['toggle']('is-open', value38));
          const value39 = map6['get'](name2['id']);
          if (value39) window['clearTimeout'](value39);
          const value40 = window['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'];
          if (value40) {
            run22();
            return;
          }
          map6['set'](
            name2['id'],
            window['setTimeout'](() => {
              (map6['delete'](name2['id']), run22());
            }, GROUP_DISCLOSURE_MOTION_MS),
          );
        }),
        row2['appendChild'](el35));
    } else row2['appendChild'](createElement('span', 'node-manager-group-chevron-spacer'));
    const trigger = createElement('button', 'node-manager-row-main', { type: 'button' });
    trigger['appendChild'](run11(name2, value36));
    const value41 = name2['name'] || t('nodeManager.unnamed'),
      el36 = createElement('span', 'node-manager-row-name', {
        'data-tooltip': value41,
        'data-tooltip-overflow': 'true',
      });
    ((el36['textContent'] = value41), trigger['appendChild'](el36));
    if (name2['kind'] === 'group') {
      const el37 = createElement('span', 'node-manager-group-count');
      ((el37['textContent'] = t('nodeManager.groupCount', { count: name2['childCount'] || 0 })),
        trigger['appendChild'](el37));
    } else nodeManagerDragController['bindNodeRow']({ trigger: trigger, row: row2, nodeId: name2['id'] });
    (trigger['addEventListener']('click', () => run14(name2)), row2['appendChild'](trigger));
    const el38 = createElement('button', 'node-manager-more-button', {
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-label': t('nodeManager.actions.more'),
      title: t('nodeManager.actions.more'),
    });
    return (
      run(el38, 'more', 'node-manager-more-icon'),
      el38['addEventListener']('click', (event6) => {
        (event6['preventDefault'](), event6['stopPropagation']());
        const box5 = el38['getBoundingClientRect']();
        run21(name2, box5['right'], box5['bottom'] + 4, el38);
      }),
      row2['appendChild'](el38),
      value37 &&
        row2['appendChild'](
          createElement('span', 'project-package-loading-spinner node-manager-row-spinner', {
            'aria-hidden': 'true',
          }),
        ),
      row2['addEventListener']('contextmenu', (event7) => {
        if (event7['target']?.['closest']?.('input')) return;
        (event7['preventDefault'](),
          event7['stopPropagation'](),
          run21(name2, event7['clientX'], event7['clientY'], trigger));
      }),
      row2
    );
  }
  function run18({ force: force = ![] } = {}) {
    const nodes = getStoreState(graphStore),
      enabled6 = map3['read'](nodes['nodes'] || {});
    if (!force && !enabled6['changed']) return;
    map2['clear']();
    const value42 = ownerRoot2['scrollTop'],
      value43 = ownerRoot2['scrollLeft'];
    count3 = buildNodeManagerModel({
      nodes: nodes['nodes'] || {},
      filter: filter,
      query: query,
      collapsedGroupIds: collapsedGroupIds,
    });
    const list3 = [],
      map8 = new Set(count3['items']['map']((value44) => value44['id']));
    if (value9 && !map8['has'](value9['id'])) run16();
    if (count3['items']['length'] === 0) {
      const el39 = createElement('div', 'node-manager-empty', { role: 'status' });
      ((el39['textContent'] = t('nodeManager.empty')), list3['push'](el39));
    } else
      count3['items']['forEach']((error4) => {
        const presentation = enabled6['byId']['get'](error4['id']),
          signature = JSON['stringify']([
            error4['name'],
            error4['kind'],
            error4['depth'],
            error4['childCount'],
            error4['collapsed'],
            t('nodeManager.actions.more'),
          ]);
        let enabled7 = map4['get'](error4['id']);
        ((!enabled7 ||
          ((enabled7['signature'] !== signature || enabled7['presentation'] !== presentation) &&
            value9?.['id'] !== error4['id'])) &&
          ((enabled7 = {
            signature: signature,
            presentation: presentation,
            row: row(error4, presentation?.['coverUrl'] || ''),
          }),
          map4['set'](error4['id'], enabled7)),
          list3['push'](enabled7['row']));
      });
    run3();
    const el40 = value9?.['input'],
      value45 = el40 && document['activeElement'] === el40,
      args = value45 ? [el40['selectionStart'], el40['selectionEnd']] : null;
    value10 = !![];
    try {
      let el41 = ownerRoot2['firstChild'];
      for (const value46 of list3) {
        if (value46 !== el41) ownerRoot2['insertBefore'](value46, el41);
        el41 = value46['nextSibling'];
      }
      while (el41) {
        const value47 = el41['nextSibling'];
        (el41['remove'](), (el41 = value47));
      }
      value45 &&
        el40['isConnected'] &&
        document['activeElement'] !== el40 &&
        (el40['focus']({ preventScroll: !![] }), el40['setSelectionRange'](...args));
    } finally {
      value10 = ![];
    }
    for (const value48 of map4['keys']()) if (!map8['has'](value48)) map4['delete'](value48);
    ((ownerRoot2['scrollTop'] = value42),
      (ownerRoot2['scrollLeft'] = value43),
      (el16['textContent'] = t('nodeManager.filters.' + filter)),
      (el24['textContent'] = t('nodeManager.total', { count: count3['totalNodeCount'] })),
      run6(),
      run8());
  }
  function run22() {
    run18({ force: !![] });
  }
  function run23(ownerElement = el15) {
    if (ownerElement['getAttribute']('aria-expanded') === 'true') {
      run3();
      return;
    }
    (run3(), ownerElement['setAttribute']('aria-expanded', 'true'));
    const box6 = ownerElement['getBoundingClientRect']();
    let showContextMenu3 = null;
    ((showContextMenu3 = showContextMenu(
      box6['left'],
      box6['bottom'] + 4,
      NODE_MANAGER_FILTERS['map']((checked) => ({
        label: t('nodeManager.filters.' + checked),
        checked: checked === filter,
        action: () => {
          if (checked === filter) return;
          ((filter = checked), run22());
        },
      })),
      {
        ariaLabel: t('nodeManager.filter'),
        dismissOnOwnerPointerDown: ![],
        ownerElement: ownerElement,
        ownerRoot: ownerRoot,
        restoreTarget: ownerElement,
        sidebarSubmenuOwner: SIDEBAR_KEY,
        onClose: () => {
          ownerElement['setAttribute']('aria-expanded', 'false');
          if (value8 === showContextMenu3) value8 = null;
        },
      },
    )),
      (value8 = showContextMenu3));
  }
  function run24(value49, { clear: clear = ![], focus: focus = !![] } = {}) {
    value7 = value49 === !![];
    clear && ((query = ''), (el19['value'] = ''));
    placement2['classList']['toggle']('is-searching', value7);
    if (focus && value7) requestAnimationFrame(() => el19['focus']());
    run22();
  }
  function run25() {
    enabled4?.();
    const value50 = window['CanvasTabManager']?.['getActiveCanvasId']?.(),
      projectName2 = getProjectName(),
      el42 = createElement('input', 'node-manager-project-rename', {
        type: 'text',
        'aria-label': t('nodeManager.projectNameAria'),
      });
    ((el42['value'] = projectName2), el9['replaceChildren'](el42));
    let value51 = ![],
      enabled8 = ![];
    const run26 = () => {
        (enabled4 === handler2 && ((enabled4 = null), el8['removeAttribute']('aria-busy')),
          el9['replaceChildren'](el10),
          run5());
      },
      handler2 = () => {
        if (value51) return;
        ((value51 = !![]), run26());
      };
    enabled4 = handler2;
    const run27 = async () => {
      if (value51 || enabled8) return;
      if (window['CanvasTabManager']?.['getActiveCanvasId']?.() !== value50) {
        handler2();
        return;
      }
      const enabled9 = String(el42['value'] || '')
        ['replace'](/\s+/g, ' ')
        ['trim']();
      if (!enabled9 || enabled9 === projectName2) {
        handler2();
        return;
      }
      ((enabled8 = !![]), (el42['disabled'] = !![]), el8['setAttribute']('aria-busy', 'true'));
      const el43 = createElement('span', 'project-package-loading-spinner node-manager-project-spinner', {
        'aria-hidden': 'true',
      });
      el9['appendChild'](el43);
      try {
        const enabled10 = await Promise['resolve'](renameCurrentProject?.(enabled9));
        if (value51) return;
        if (!enabled10) throw new Error(t('nodeManager.toasts.projectRenameFailed'));
        ((value51 = !![]), run26());
      } catch (error5) {
        if (value51) return;
        ((enabled8 = ![]),
          (el42['disabled'] = ![]),
          el43['remove'](),
          showToast?.(error5?.['message'] || t('nodeManager.toasts.projectRenameFailed'), 'error'),
          el42['focus'](),
          el42['select']());
      } finally {
        (!enabled4 || enabled4 === handler2) && el8['removeAttribute']('aria-busy');
      }
    };
    (el42['addEventListener']('keydown', (event8) => {
      if (event8['isComposing']) return;
      if (event8['key'] === 'Enter') (event8['preventDefault'](), event8['stopPropagation'](), void run27());
      else
        event8['key'] === 'Escape' && (event8['preventDefault'](), event8['stopPropagation'](), handler2());
    }),
      el42['addEventListener']('blur', () => void run27()),
      el42['focus'](),
      el42['select']());
  }
  function open() {
    (placement2['classList']['add']('show'),
      placement2['setAttribute']('aria-hidden', 'false'),
      wrap['classList']['add']('node-manager-open'),
      run7(),
      run18({ force: !![] }));
  }
  function close() {
    (run16(), enabled4?.());
    const value52 = placement2['contains'](document['activeElement']);
    (run3(),
      placement2['classList']['remove']('show'),
      placement2['setAttribute']('aria-hidden', 'true'),
      wrap['classList']['remove']('node-manager-open'));
    if (value52) requestAnimationFrame(() => button['focus']());
  }
  (registerSidebarSubmenu({
    key: SIDEBAR_KEY,
    button: button,
    panel: placement2,
    open: open,
    close: close,
    isOpen: isOpen,
    closeOnOutsidePointerDown: ![],
    ignorePointerDown: (event9) =>
      !!event9?.['target']?.['closest']?.('[data-sidebar-submenu-owner="' + SIDEBAR_KEY + '"]'),
  }),
    button['removeAttribute']('aria-haspopup'),
    el10['addEventListener']('click', run25),
    el17['addEventListener']('click', () => run24(!![])),
    el21['addEventListener']('click', () => run24(![], { clear: !![], focus: ![] })),
    el15['addEventListener']('click', () => run23(el15)),
    el20['addEventListener']('click', () => run23(el20)),
    el14['addEventListener']('click', () => {
      const list4 = count3['groupIds'] || [],
        value53 = list4['length'] > 0 && list4['every']((value54) => collapsedGroupIds['has'](value54));
      if (value53) collapsedGroupIds['clear']();
      else list4['forEach']((value55) => collapsedGroupIds['add'](value55));
      run22();
    }),
    el22['addEventListener']('click', () => closeSidebarSubmenu(SIDEBAR_KEY)),
    el12['addEventListener']('click', () => closeSidebarSubmenu(SIDEBAR_KEY)),
    el19['addEventListener']('input', () => {
      ((query = el19['value']), run22());
    }),
    el19['addEventListener']('keydown', (event10) => {
      if (event10['key'] !== 'Escape') return;
      (event10['preventDefault'](),
        event10['stopPropagation'](),
        run24(![], { clear: !![], focus: ![] }),
        el17['focus']());
    }),
    list['push'](
      installScrollableWheelBoundary(ownerRoot2, {
        getAxis: () => (placement2['dataset']['placement'] === 'bottom' ? 'horizontal' : 'vertical'),
      }),
    ),
    list['push'](() => {
      (map6['forEach']((value56) => window['clearTimeout'](value56)), map6['clear']());
    }));
  const value57 = graphStore['subscribeSelector']?.(
      (value58) => Number(value58['_nodesRev'] || 0),
      () => {
        if (!isOpen()) return;
        run18();
      },
    ),
    value59 = graphStore['subscribeSelector']?.(
      (state2) => (state2['selectedNodeIds'] || [])['join']('|'),
      run8,
    ),
    value60 = uiStore?.['subscribeSelector']?.(
      (value61) => normalizeNodeManagerPlacement(value61['ui']?.['nodeManagerPlacement']),
      run4,
    );
  list['push'](value57, value59, value60);
  const value62 = (value63) => run4(value63?.['detail']?.['placement']),
    value64 = () => {
      (run16(), enabled4?.(), run5(), map3['clear']());
      if (isOpen()) run18({ force: !![] });
    },
    value65 = () => {
      run7();
      if (isOpen()) run22();
    };
  (window['addEventListener'](NODE_MANAGER_PLACEMENT_EVENT, value62),
    window['addEventListener']('aicanvas:active-canvas-changed', value64),
    window['addEventListener']('aicanvas:locale-change', value65),
    list['push'](() => window['removeEventListener'](NODE_MANAGER_PLACEMENT_EVENT, value62)),
    list['push'](() => window['removeEventListener']('aicanvas:active-canvas-changed', value64)),
    list['push'](() => window['removeEventListener']('aicanvas:locale-change', value65)));
  const value66 = document['getElementById']('projectNameText'),
    value67 = value66 && typeof MutationObserver === 'function' ? new MutationObserver(run5) : null;
  return (
    value67?.['observe'](value66, { childList: !![], characterData: !![], subtree: !![] }),
    list['push'](() => value67?.['disconnect']()),
    run4(getStoreState(uiStore)['ui']?.['nodeManagerPlacement']),
    run7(),
    run18({ force: !![] }),
    {
      panel: placement2,
      open: () => open(),
      close: () => closeSidebarSubmenu(SIDEBAR_KEY),
      destroy() {
        (close(),
          map4['clear'](),
          map3['clear'](),
          map2['clear'](),
          list['forEach']((value68) => value68?.()),
          placement2['remove']());
      },
    }
  );
}
