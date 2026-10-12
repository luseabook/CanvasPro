// Whiteboard toolbar/style panel builders extracted from WhiteboardNode.js.

import { applyI18n, t } from '../i18n/index.js';
import { createSafeSvg } from '../utils/dom.js';
import {
  COLOR_VAR_MAP,
  WHITEBOARD_ARROWHEAD_OPTIONS,
  WHITEBOARD_ARROW_KIND_OPTIONS,
  WHITEBOARD_DASH_OPTIONS,
  WHITEBOARD_FILL_OPTIONS,
  WHITEBOARD_FONT_OPTIONS,
  WHITEBOARD_OPACITY_PRESETS,
  WHITEBOARD_PRIMARY_TOOLS,
  WHITEBOARD_SHAPE_OPTIONS,
  WHITEBOARD_SIZE_PRESETS,
  WHITEBOARD_TOOL_ICONS,
  WHITEBOARD_TOOL_LABELS,
  WHITEBOARD_TOOL_SHORTCUTS,
  getColorCss,
} from './WhiteboardNode.js';

export function appendIcon(el, value6) {
  const el2 = createSafeSvg(value6);
  if (!el2) return;
  (el2.classList.add('whiteboard-toolbar-icon'), el.appendChild(el2));
}
export function createToolbarButton({
  className: className = '',
  tool: tool = '',
  action: action = '',
  label: label = '',
  shortcut: shortcut = '',
  icon: icon = '',
} = {}) {
  const el3 = document.createElement('button');
  ((el3.type = 'button'),
    (el3.className = ['ftb-btn', 'icon-only', 'whiteboard-toolbar-btn', className]
      .filter(Boolean)
      .join(' ')));
  if (tool) el3.dataset.tool = tool;
  if (action) el3.dataset.action = action;
  return (
    label &&
      ((el3.dataset.tooltip = shortcut ? label + ' (' + shortcut + ')' : label),
      el3.setAttribute('aria-label', label)),
    appendIcon(el3, icon),
    el3
  );
}
export function createDivider() {
  const el4 = document.createElement('div');
  return (
    (el4.className = 'whiteboard-toolbar-divider'),
    el4.setAttribute('aria-hidden', 'true'),
    el4
  );
}
export function createToolbarGroup(value7) {
  const value8 = document.createElement('div');
  return (
    (value8.className = ['whiteboard-toolbar-group', value7].filter(Boolean).join(' ')),
    value8
  );
}
export function createWhiteboardToolbar({ hiddenActions: hiddenActions = [] } = {}) {
  const el5 = document.createElement('div');
  el5.className = 'node-floating-toolbar whiteboard-toolbar';
  const map = new Set(
      (Array.isArray(hiddenActions) ? hiddenActions : [])
        .map((value9) => String(value9 || '').trim())
        .filter(Boolean),
    ),
    handler2 = (value10) => !map.has(value10),
    el6 = createToolbarGroup('whiteboard-toolbar-actions');
  handler2('undo') &&
    el6.appendChild(
      createToolbarButton({
        className: 'whiteboard-action-btn act-undo',
        action: 'undo',
        label: '撤销',
        icon: WHITEBOARD_TOOL_ICONS.undo,
      }),
    );
  handler2('redo') &&
    el6.appendChild(
      createToolbarButton({
        className: 'whiteboard-action-btn act-redo',
        action: 'redo',
        label: '重做',
        icon: WHITEBOARD_TOOL_ICONS.redo,
      }),
    );
  const el7 = createToolbarGroup('whiteboard-toolbar-compose');
  handler2('compose') &&
    el7.appendChild(
      createToolbarButton({
        className: 'whiteboard-action-btn act-compose',
        action: 'compose',
        label: '合成图像',
        icon: WHITEBOARD_TOOL_ICONS.compose,
      }),
    );
  handler2('clear') &&
    el6.appendChild(
      createToolbarButton({
        className: 'whiteboard-action-btn act-clear',
        action: 'clear',
        label: '清空',
        shortcut: 'R',
        icon: WHITEBOARD_TOOL_ICONS.clear,
      }),
    );
  const el8 = createToolbarGroup('whiteboard-toolbar-tools');
  if (handler2('upload-background')) {
    const el9 = createToolbarButton({
      className: 'whiteboard-upload-btn',
      action: 'upload-background',
      label: t('whiteboardNode.background.upload'),
      icon: WHITEBOARD_TOOL_ICONS.upload,
    });
    ((el9.dataset.i18nTooltip = 'whiteboardNode.background.upload'),
      (el9.dataset.i18nAriaLabel = 'whiteboardNode.background.upload'));
    const el10 = document.createElement('span');
    ((el10.className = 'whiteboard-upload-label'),
      (el10.dataset.i18n = 'whiteboardNode.background.upload'),
      (el10.textContent = t('whiteboardNode.background.upload')),
      el9.appendChild(el10),
      el8.appendChild(el9),
      el8.appendChild(createDivider()));
  }
  WHITEBOARD_PRIMARY_TOOLS.forEach((tool3) => {
    el8.appendChild(
      createToolbarButton({
        className: 'whiteboard-tool-btn',
        tool: tool3,
        label: WHITEBOARD_TOOL_LABELS[tool3] || tool3,
        shortcut: WHITEBOARD_TOOL_SHORTCUTS[tool3] || '',
        icon: WHITEBOARD_TOOL_ICONS[tool3],
      }),
    );
  });
  if (handler2('more-shapes')) {
    const el11 = document.createElement('div');
    el11.className = 'whiteboard-more-wrap';
    const el12 = createToolbarButton({
      className: 'whiteboard-more-btn',
      action: 'more-shapes',
      label: '更多图形',
      icon: WHITEBOARD_TOOL_ICONS.more,
    });
    (el12.setAttribute('aria-haspopup', 'menu'), el12.setAttribute('aria-expanded', 'false'));
    const el13 = document.createElement('div');
    ((el13.className = 'whiteboard-shape-menu'),
      el13.setAttribute('role', 'menu'),
      (el13.hidden = true),
      WHITEBOARD_SHAPE_OPTIONS.forEach((event4) => {
        const el14 = document.createElement('button');
        ((el14.type = 'button'),
          (el14.className = 'whiteboard-shape-option'),
          (el14.dataset.shapeKey = event4.key),
          (el14.dataset.shapeTool = event4.tool),
          (el14.dataset.tooltip = event4.label),
          el14.setAttribute('aria-label', event4.label),
          el14.setAttribute('role', 'menuitem'),
          appendIcon(el14, event4.icon),
          el13.appendChild(el14));
      }),
      el11.appendChild(el12),
      el11.appendChild(el13),
      el8.appendChild(el11));
  }
  return (
    [el8, el6, el7]
      .filter((value11) => value11.childElementCount > 0)
      .forEach((value12, count2) => {
        if (count2 > 0) el5.appendChild(createDivider());
        el5.appendChild(value12);
      }),
    applyI18n(el5),
    el5
  );
}
export function createWhiteboardStylePanel() {
  const el15 = document.createElement('div');
  ((el15.className = 'whiteboard-style-panel is-empty'),
    el15.setAttribute('aria-hidden', 'true'),
    (el15.inert = true));
  const run = (value13, value14 = '') => {
      const el16 = document.createElement('section');
      return (
        (el16.className = ['whiteboard-style-section', value14].filter(Boolean).join(' ')),
        (el16.dataset.styleControl = value13),
        el16
      );
    },
    el17 = run('color', 'whiteboard-style-color-section'),
    el18 = document.createElement('div');
  ((el18.className = 'whiteboard-style-color-grid'),
    Object.keys(COLOR_VAR_MAP).forEach((value15) => {
      const value16 = 'whiteboardNode.style.colors.' + value15,
        el19 = document.createElement('button');
      ((el19.type = 'button'),
        (el19.className = 'whiteboard-color-swatch'),
        (el19.dataset.color = value15),
        (el19.dataset.i18nTooltip = value16),
        (el19.dataset.i18nAriaLabel = value16),
        (el19.dataset.tooltip = t(value16)),
        el19.setAttribute('aria-label', t(value16)),
        el19.style.setProperty('--whiteboard-swatch-bg', getColorCss(value15)),
        el18.appendChild(el19));
    }),
    el17.appendChild(el18));
  const el20 = run('size', 'whiteboard-style-size-section'),
    el21 = document.createElement('label');
  el21.className = 'whiteboard-style-size';
  const value17 = document.createElement('span');
  value17.className = 'whiteboard-size-value';
  const value18 = document.createElement('input');
  ((value18.className = 'whiteboard-size-range'),
    (value18.type = 'range'),
    (value18.min = '1'),
    (value18.max = '120'),
    (value18.step = '1'),
    el21.appendChild(value17),
    el21.appendChild(value18));
  const el22 = document.createElement('div');
  ((el22.className = 'whiteboard-size-presets'),
    WHITEBOARD_SIZE_PRESETS.forEach((el23) => {
      const el24 = document.createElement('button');
      ((el24.type = 'button'),
        (el24.className = 'whiteboard-size-preset'),
        (el24.dataset.sizeValue = String(el23.value)),
        (el24.dataset.i18nTooltip = el23.tooltipKey),
        (el24.dataset.i18nAriaLabel = el23.tooltipKey),
        (el24.dataset.tooltip = t(el23.tooltipKey)),
        el24.setAttribute('aria-label', t(el23.tooltipKey)),
        (el24.textContent = el23.key),
        el22.appendChild(el24));
    }),
    el20.appendChild(el21),
    el20.appendChild(el22));
  const el25 = run('opacity', 'whiteboard-style-opacity-section'),
    el26 = document.createElement('label');
  el26.className = 'whiteboard-style-opacity';
  const value19 = document.createElement('span');
  value19.className = 'whiteboard-opacity-value';
  const value20 = document.createElement('input');
  ((value20.className = 'whiteboard-opacity-range'),
    (value20.type = 'range'),
    (value20.min = '10'),
    (value20.max = '100'),
    (value20.step = '1'),
    el26.appendChild(value19),
    el26.appendChild(value20));
  const el27 = document.createElement('div');
  ((el27.className = 'whiteboard-opacity-presets'),
    WHITEBOARD_OPACITY_PRESETS.forEach((el28) => {
      const el29 = document.createElement('button');
      ((el29.type = 'button'),
        (el29.className = 'whiteboard-style-option whiteboard-opacity-preset'),
        (el29.dataset.styleProp = 'opacity'),
        (el29.dataset.styleValue = String(el28.value)),
        (el29.dataset.tooltip = el28.key + '%'),
        el29.setAttribute('aria-label', el28.key + '%'),
        (el29.textContent = el28.key),
        el27.appendChild(el29));
    }),
    el25.appendChild(el26),
    el25.appendChild(el27));
  const run2 = (value21, value22, list3) => {
      const el30 = run(value21, 'whiteboard-style-' + value21 + '-section'),
        el31 = document.createElement('div');
      return (
        (el31.className = 'whiteboard-style-segmented'),
        list3.forEach((el32) => {
          const el33 = document.createElement('button'),
            value23 = el32.value ?? el32.key;
          ((el33.type = 'button'),
            (el33.className = 'whiteboard-style-option'),
            (el33.dataset.styleProp = el32.prop || value22),
            (el33.dataset.styleValue = value23));
          const value24 = el32.tooltipKey || el32.labelKey,
            value25 = value24 ? t(value24) : el32.tooltip || el32.key || value23;
          (value24 &&
            ((el33.dataset.i18nTooltip = value24),
            (el33.dataset.i18nAriaLabel = value24)),
            (el33.dataset.tooltip = value25),
            el33.setAttribute('aria-label', value25),
            el32.labelKey
              ? ((el33.dataset.i18n = el32.labelKey),
                (el33.textContent = t(el32.labelKey)))
              : (el33.textContent = el32.label),
            el31.appendChild(el33));
        }),
        el30.appendChild(el31),
        el30
      );
    },
    handler3 = () => {
      const el34 = run('arrow-kind', 'whiteboard-style-arrow-kind-section'),
        el35 = document.createElement('div');
      el35.className = 'whiteboard-arrow-kind-row';
      const el36 = document.createElement('span');
      ((el36.dataset.i18n = 'whiteboardNode.style.lineType'),
        (el36.textContent = t('whiteboardNode.style.lineType')));
      const el37 = document.createElement('div');
      return (
        (el37.className = 'whiteboard-arrow-kind-options'),
        WHITEBOARD_ARROW_KIND_OPTIONS.forEach((el38) => {
          const el39 = document.createElement('button');
          ((el39.type = 'button'),
            (el39.className = 'whiteboard-style-option whiteboard-arrow-kind-option'),
            (el39.dataset.styleProp = 'arrowKind'),
            (el39.dataset.styleValue = el38.value),
            (el39.dataset.i18nTooltip = el38.tooltipKey),
            (el39.dataset.i18nAriaLabel = el38.tooltipKey),
            (el39.dataset.tooltip = t(el38.tooltipKey)),
            el39.setAttribute('aria-label', t(el38.tooltipKey)),
            appendIcon(el39, el38.icon),
            el37.appendChild(el39));
        }),
        el35.appendChild(el36),
        el35.appendChild(el37),
        el34.appendChild(el35),
        el34
      );
    },
    handler4 = () => {
      const el40 = run('arrowheads', 'whiteboard-style-arrowheads-section'),
        el41 = document.createElement('div');
      el41.className = 'whiteboard-arrowheads-row';
      const el42 = document.createElement('span');
      ((el42.dataset.i18n = 'whiteboardNode.style.arrowheads'),
        (el42.textContent = t('whiteboardNode.style.arrowheads')),
        el41.appendChild(el42),
        ['arrowStart', 'arrowEnd'].forEach((value26) => {
          const el43 = document.createElement('button');
          ((el43.type = 'button'),
            (el43.className = 'whiteboard-arrowhead-trigger'),
            (el43.dataset.arrowheadTarget = value26));
          const value27 =
            value26 === 'arrowStart'
              ? 'whiteboardNode.style.terminal.start'
              : 'whiteboardNode.style.terminal.end';
          ((el43.dataset.i18nTooltip = value27),
            (el43.dataset.i18nAriaLabel = value27),
            (el43.dataset.tooltip = t(value27)),
            el43.setAttribute('aria-haspopup', 'menu'),
            el43.setAttribute('aria-expanded', 'false'),
            el43.setAttribute('aria-label', t(value27)),
            el41.appendChild(el43));
        }));
      const el44 = document.createElement('div');
      return (
        (el44.className = 'whiteboard-style-popover whiteboard-arrowhead-menu'),
        el44.setAttribute('role', 'menu'),
        (el44.hidden = true),
        WHITEBOARD_ARROWHEAD_OPTIONS.forEach((el45) => {
          const el46 = document.createElement('button');
          ((el46.type = 'button'),
            (el46.className = 'whiteboard-arrowhead-option'),
            (el46.dataset.arrowheadValue = el45.value),
            (el46.dataset.i18nTooltip = el45.tooltipKey),
            (el46.dataset.i18nAriaLabel = el45.tooltipKey),
            (el46.dataset.tooltip = t(el45.tooltipKey)),
            el46.setAttribute('aria-label', t(el45.tooltipKey)),
            appendIcon(el46, el45.icon),
            el44.appendChild(el46));
        }),
        el40.appendChild(el41),
        el40.appendChild(el44),
        el40
      );
    };
  return (
    el15.appendChild(el17),
    el15.appendChild(el20),
    el15.appendChild(el25),
    el15.appendChild(run2('fill', 'fill', WHITEBOARD_FILL_OPTIONS)),
    el15.appendChild(run2('dash', 'dash', WHITEBOARD_DASH_OPTIONS)),
    el15.appendChild(run2('font', 'font', WHITEBOARD_FONT_OPTIONS)),
    el15.appendChild(handler3()),
    el15.appendChild(handler4()),
    applyI18n(el15),
    el15
  );
}
