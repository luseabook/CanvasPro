import { isNodeType } from '../modules/registry.js';
import { getMediaComposeButtonLabel, getSelectedMediaComposeKind } from '../modules/mediaComposeSelection.js';
import {
  hasBatchExportableSelection,
  isNodeBatchExportPending,
  subscribeNodeBatchExportPending,
} from '../modules/nodeBatchExport.js';
import { hasMaterialComparisonPair } from '../modules/materialComparisonEntries.js';
import {
  getSelectedSyncPlayableVideoCount,
  getSyncVideoPlaybackState,
  subscribeSyncVideoPlaybackState,
} from '../modules/videoSyncPlayback.js';
import { t } from '../i18n/index.js';
import { computeSelectionBounds, getAlignableSelectionNodes } from './math.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
function createSvg(value = '2') {
  const el = document['createElementNS'](SVG_NS, 'svg');
  return (
    el['setAttribute']('viewBox', '0 0 24 24'),
    el['setAttribute']('fill', 'none'),
    el['setAttribute']('stroke', 'currentColor'),
    el['setAttribute']('stroke-width', value),
    el['setAttribute']('stroke-linecap', 'round'),
    el['setAttribute']('stroke-linejoin', 'round'),
    el
  );
}
function appendPath(el2, item) {
  const el3 = document['createElementNS'](SVG_NS, 'path');
  return (el3['setAttribute']('d', item), el2['appendChild'](el3), el3);
}
function createIconButton(key, index, result) {
  const el4 = document['createElement']('button');
  return (
    (el4['type'] = 'button'),
    (el4['className'] = 'v2-multi-select-btn'),
    (el4['dataset']['uiAction'] = key),
    (el4['title'] = index),
    el4['setAttribute']('aria-label', index),
    el4['replaceChildren'](result),
    el4
  );
}
function syncVideoPlaybackButtonPresentation(el5, data = {}) {
  if (!el5) return ![];
  const options = data?.['active'] === !![],
    t2 = t(
      options
        ? 'coreUi.renderer.multiSelect.syncVideoPause'
        : 'coreUi.renderer.multiSelect.syncVideoPlayHint',
    ),
    target = options ? 'playing' : 'idle';
  if (el5['dataset']['syncPlaybackState'] === target && el5['getAttribute']('aria-label') === t2)
    return options;
  (el5['classList']['toggle']('is-playing', options),
    el5['setAttribute']('aria-pressed', options ? 'true' : 'false'),
    el5['setAttribute']('aria-label', t2));
  if (el5['hasAttribute']?.('title')) el5['setAttribute']('title', t2);
  ((el5['dataset']['tooltip'] = t2), (el5['dataset']['syncPlaybackState'] = target));
  const el6 = el5['querySelector']('[data-sync-video-icon="play"]'),
    el7 = el5['querySelector']('[data-sync-video-icon="pause"]');
  if (el6?.['style']) el6['style']['display'] = options ? 'none' : '';
  if (el7?.['style']) el7['style']['display'] = options ? '' : 'none';
  return options;
}
function createMultiSelectBoxEl() {
  const el8 = document['createElement']('div');
  ((el8['id'] = 'v2-multi-select-box'), (el8['className'] = 'v2-multi-select-box'));
  const el9 = document['createElement']('div');
  ((el9['className'] = 'v2-multi-select-tab'), (el9['dataset']['uiStop'] = '1'));
  const el10 = createSvg('2.5');
  el10['dataset']['syncVideoIcon'] = 'play';
  const el11 = document['createElementNS'](SVG_NS, 'polygon');
  (el11['setAttribute']('points', '5 3 19 12 5 21 5 3'), el10['appendChild'](el11));
  const el12 = createIconButton('ms-sync-video-play', t('coreUi.renderer.multiSelect.syncVideoPlay'), el10),
    el13 = createSvg('2.5');
  el13['dataset']['syncVideoIcon'] = 'pause';
  for (const source of [6, 14]) {
    const el14 = document['createElementNS'](SVG_NS, 'rect');
    (el14['setAttribute']('x', String(source)),
      el14['setAttribute']('y', '4'),
      el14['setAttribute']('width', '4'),
      el14['setAttribute']('height', '16'),
      el14['setAttribute']('rx', '1'),
      el13['appendChild'](el14));
  }
  ((el13['style']['display'] = 'none'),
    el12['appendChild'](el13),
    syncVideoPlaybackButtonPresentation(el12, { active: ![] }),
    (el12['style']['display'] = 'none'));
  const svg = createSvg('2');
  [
    'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z',
    'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z',
    'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z',
  ]['forEach']((next) => appendPath(svg, next));
  const iconButton = createIconButton('ms-run-selected', t('coreUi.renderer.multiSelect.runSelected'), svg),
    el15 = createSvg('1.8'),
    el16 = document['createElementNS'](SVG_NS, 'polygon');
  (el16['setAttribute']('points', '12 2 20 12 16 12 16 22 8 22 8 12 4 12 12 2'), el15['appendChild'](el16));
  const iconButton2 = createIconButton('ms-asset', t('coreUi.renderer.multiSelect.createAsset'), el15),
    svg2 = createSvg('2');
  ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']['forEach']((current) =>
    appendPath(svg2, current),
  );
  const iconButton3 = createIconButton(
      'ms-batch-download',
      t('coreUi.renderer.multiSelect.batchDownload'),
      svg2,
    ),
    el17 = createSvg('2');
  for (const [entry, record] of [
    [3, 3],
    [14, 3],
    [14, 14],
    [3, 14],
  ]) {
    const el18 = document['createElementNS'](SVG_NS, 'rect');
    (el18['setAttribute']('x', String(entry)),
      el18['setAttribute']('y', String(record)),
      el18['setAttribute']('width', '7'),
      el18['setAttribute']('height', '7'),
      el17['appendChild'](el18));
  }
  const iconButton4 = createIconButton('ms-group', t('coreUi.renderer.multiSelect.group'), el17),
    el19 = createSvg('2');
  (appendPath(el19, 'M3 12a9 9 0 0 1 15.36-6.36'), appendPath(el19, 'M21 12a9 9 0 0 1-15.36 6.36'));
  const el20 = document['createElementNS'](SVG_NS, 'polyline');
  el20['setAttribute']('points', '21 3 21 9 15 9');
  const el21 = document['createElementNS'](SVG_NS, 'polyline');
  (el21['setAttribute']('points', '3 21 3 15 9 15'), el19['appendChild'](el20), el19['appendChild'](el21));
  const el22 = createIconButton(
    'ms-reset-image-size',
    t('coreUi.renderer.multiSelect.resetDefaultSize'),
    el19,
  );
  el22['style']['display'] = 'none';
  const el23 = createSvg('2'),
    el24 = document['createElementNS'](SVG_NS, 'rect');
  (el24['setAttribute']('x', '3'),
    el24['setAttribute']('y', '5'),
    el24['setAttribute']('width', '18'),
    el24['setAttribute']('height', '14'),
    el24['setAttribute']('rx', '2'),
    el23['appendChild'](el24),
    appendPath(el23, 'M3 9h18'),
    appendPath(el23, 'M7 5l4 4'),
    appendPath(el23, 'M13 5l4 4'));
  const el25 = createIconButton('ms-compose-video', t('coreUi.renderer.multiSelect.composeVideo'), el23);
  el25['style']['display'] = 'none';
  const el26 = createSvg('2'),
    el27 = document['createElementNS'](SVG_NS, 'rect');
  (el27['setAttribute']('x', '3'),
    el27['setAttribute']('y', '4'),
    el27['setAttribute']('width', '18'),
    el27['setAttribute']('height', '16'),
    el27['setAttribute']('rx', '2'),
    el26['appendChild'](el27),
    appendPath(el26, 'M12 4v16'));
  const el28 = createIconButton(
    'ms-material-comparison',
    t('coreUi.renderer.multiSelect.materialComparison'),
    el26,
  );
  el28['style']['display'] = 'none';
  const svg3 = createSvg('2');
  [
    'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M3 10h18',
    'M12 10v10',
  ]['forEach']((payload) => appendPath(svg3, payload));
  const el29 = createIconButton('ms-create-collage', t('coreUi.renderer.multiSelect.createCollage'), svg3);
  el29['style']['display'] = 'none';
  const el30 = document['createElement']('span');
  return (
    (el30['className'] = 'v2-multi-select-separator'),
    el30['setAttribute']('aria-hidden', 'true'),
    (el30['textContent'] = '|'),
    el9['appendChild'](iconButton),
    el9['appendChild'](el12),
    el9['appendChild'](iconButton2),
    el9['appendChild'](iconButton4),
    el9['appendChild'](el28),
    el9['appendChild'](el29),
    el9['appendChild'](el25),
    el9['appendChild'](el30),
    el9['appendChild'](el22),
    el9['appendChild'](iconButton3),
    el8['appendChild'](el9),
    el8
  );
}
function createAlignCenterPanelEl() {
  const el31 = document['createElement']('div');
  ((el31['id'] = 'v2-align-center-panel'),
    (el31['className'] = 'v2-align-center-panel'),
    (el31['dataset']['uiStop'] = '1'),
    (el31['style']['display'] = 'none'));
  const handle = {
      'ms-align-left': ['M4 4v16', 'M8 7h10', 'M8 12h7', 'M8 17h9'],
      'ms-align-h-center': ['M12 4v16', 'M7 7h10', 'M9 12h6', 'M8 17h8'],
      'ms-align-right': ['M20 4v16', 'M6 7h10', 'M9 12h7', 'M7 17h9'],
      'ms-align-top': ['M4 4h16', 'M7 8v10', 'M12 8v7', 'M17 8v9'],
      'ms-align-v-center': ['M4 12h16', 'M7 7v10', 'M12 9v6', 'M17 8v8'],
      'ms-align-bottom': ['M4 20h16', 'M7 6v10', 'M12 9v7', 'M17 7v9'],
      'ms-distribute-h': ['M3 20h18', 'M5 8h3v8H5z', 'M11 5h3v11h-3z', 'M17 10h3v6h-3z'],
      'ms-distribute-v': ['M20 3v18', 'M8 5h8v3H8z', 'M5 11h11v3H5z', 'M10 17h6v3h-6z'],
      'ms-arrange-grid': ['M4 4h5v5H4z', 'M15 4h5v5h-5z', 'M4 15h5v5H4z', 'M15 15h5v5h-5z'],
    },
    state = [
      { action: 'ms-align-left', tooltip: t('coreUi.renderer.align.left'), slot: 'slot-1' },
      { action: 'ms-align-h-center', tooltip: t('coreUi.renderer.align.hCenter'), slot: 'slot-2' },
      { action: 'ms-align-right', tooltip: t('coreUi.renderer.align.right'), slot: 'slot-3' },
      { action: 'ms-align-top', tooltip: t('coreUi.renderer.align.top'), slot: 'slot-4' },
      { action: 'ms-arrange-grid', tooltip: t('coreUi.renderer.align.arrangeGridHint'), slot: 'slot-5' },
      { action: 'ms-align-bottom', tooltip: t('coreUi.renderer.align.bottom'), slot: 'slot-6' },
      { action: 'ms-distribute-h', tooltip: t('coreUi.renderer.align.distributeH'), slot: 'slot-7' },
      { action: 'ms-align-v-center', tooltip: t('coreUi.renderer.align.vCenter'), slot: 'slot-8' },
      { action: 'ms-distribute-v', tooltip: t('coreUi.renderer.align.distributeV'), slot: 'slot-9' },
    ];
  for (const config of state) {
    const el32 = document['createElement']('button');
    ((el32['type'] = 'button'),
      (el32['className'] = 'v2-align-center-btn ' + config['slot']),
      (el32['dataset']['uiAction'] = config['action']),
      (el32['dataset']['tooltip'] = config['tooltip']),
      el32['setAttribute']('aria-label', config['tooltip']));
    config['action'] === 'ms-arrange-grid' &&
      (el32['setAttribute']('aria-haspopup', 'menu'), el32['setAttribute']('aria-expanded', 'false'));
    const el33 = createSvg('2');
    (el33['setAttribute']('width', '16'), el33['setAttribute']('height', '16'));
    for (const scope of handle[config['action']] || []) appendPath(el33, scope);
    (el32['appendChild'](el33), el31['appendChild'](el32));
  }
  return el31;
}
function restoreNodeOverlays(el34) {
  if (!el34) return;
  const el35 = el34['querySelector']('.node-floating-toolbar'),
    el36 = el34['querySelector']('.group-toolbar'),
    el37 = el34['querySelector']('.text-prompt-panel');
  if (el35) el35['style']['display'] = '';
  if (el36) el36['style']['display'] = '';
  if (el37) el37['style']['display'] = '';
}
function hideNodeOverlays(el38) {
  if (!el38) return;
  const el39 = el38['querySelector']('.node-floating-toolbar'),
    el40 = el38['querySelector']('.group-toolbar'),
    el41 = el38['querySelector']('.text-prompt-panel');
  if (el39) el39['style']['display'] = 'none';
  if (el40) el40['style']['display'] = 'none';
  if (el41) el41['style']['display'] = 'none';
}
export function createRendererSelectionOverlay({
  getWrapper: getWrapper,
  isMounted: isMounted,
  getSyncPlaybackState: getSyncPlaybackState = getSyncVideoPlaybackState,
  subscribeSyncPlaybackState: subscribeSyncPlaybackState = subscribeSyncVideoPlaybackState,
}) {
  let el42 = null,
    el43 = null,
    value2 = null,
    subscribeNodeBatchExportPending2 = null,
    hasBatchExportableSelection2 = ![];
  const run = () => {
    const el44 = el42?.['querySelector']?.('[data-ui-action="ms-batch-download"]');
    if (!el44) return;
    const isNodeBatchExportPending2 = isNodeBatchExportPending();
    ((el44['disabled'] = isNodeBatchExportPending2 || !hasBatchExportableSelection2),
      el44['classList']['toggle']('is-disabled', el44['disabled']),
      el44['classList']['toggle']('is-loading', isNodeBatchExportPending2),
      el44['setAttribute']('aria-busy', String(isNodeBatchExportPending2)));
  };
  let input = getSyncPlaybackState?.() || { active: ![], loop: ![] },
    output = new Set();
  const value3 = { geometrySig: '', resetBtnVisible: null, composeBtnVisible: null, composeBtnKind: '' },
    value4 = { centerSig: '', buttonStateSig: '' },
    handler = (enabled, { mountedOnly: mountedOnly = ![] } = {}) => {
      if (!enabled) return null;
      if (mountedOnly && !isMounted(enabled)) return null;
      return getWrapper(enabled) || null;
    },
    handler2 = () => {
      ((value3['geometrySig'] = ''),
        (value3['resetBtnVisible'] = null),
        (value3['composeBtnVisible'] = null),
        (value3['composeBtnKind'] = ''),
        (value4['centerSig'] = ''),
        (value4['buttonStateSig'] = ''));
    },
    handler3 = () => {
      for (const value5 of output) restoreNodeOverlays(handler(value5));
      output = new Set();
    },
    handler4 = (list, value6, value7) => {
      if (!el42) return;
      const enabled2 = Array['isArray'](list) && list['length'] >= 2;
      if (!enabled2) handler3();
      else {
        const map = new Set(list),
          value8 = new Set();
        for (const value9 of output) {
          if (map['has'](value9)) continue;
          restoreNodeOverlays(handler(value9));
        }
        for (const value10 of map) {
          const enabled3 = handler(value10, { mountedOnly: !![] });
          if (!enabled3) continue;
          (hideNodeOverlays(enabled3), value8['add'](value10));
        }
        output = value8;
      }
      if (!enabled2) {
        if (el42['style']['display'] !== 'none') el42['style']['display'] = 'none';
        ((value3['geometrySig'] = ''),
          (value3['resetBtnVisible'] = null),
          (value3['composeBtnVisible'] = null),
          (value3['composeBtnKind'] = ''));
        return;
      }
      const el45 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]'),
        el46 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-run-selected"]'),
        el47 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-batch-download"]'),
        el48 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-compose-video"]'),
        el49 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-reset-image-size"]'),
        el50 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-create-collage"]'),
        el51 = el42['querySelector']('.v2-multi-select-tab button[data-ui-action="ms-material-comparison"]');
      el45 &&
        ((el45['style']['display'] = getSelectedSyncPlayableVideoCount(value6, list) >= 2 ? '' : 'none'),
        syncVideoPlaybackButtonPresentation(el45, input));
      if (el46) {
        el46['style']['display'] = '';
        const enabled4 = list['some']((value11) =>
            isNodeType(value6[value11], ['ai-text', 'ai-image', 'ai-video', 'ai-audio']),
          ),
          enabled5 =
            el46['dataset']['batchActive'] === 'true' ||
            list['some'](
              (value12) =>
                isNodeType(value6[value12], ['ai-text', 'ai-image', 'ai-video', 'ai-audio']) &&
                value6[value12]?.['isGenerating'] === !![],
            ),
          value13 = enabled5
            ? t('groupExecution.stopSelected')
            : t('coreUi.renderer.multiSelect.runSelected');
        ((el46['dataset']['tooltip'] = value13),
          el46['setAttribute']('aria-label', value13),
          el46['setAttribute']('aria-busy', String(enabled5)),
          el46['classList']['toggle']('is-active', enabled5),
          (el46['disabled'] = !enabled4 && !enabled5),
          el46['classList']['toggle']('is-disabled', !enabled4 && !enabled5));
      }
      el47 &&
        ((el47['style']['display'] = ''),
        (hasBatchExportableSelection2 = hasBatchExportableSelection(value6, list)),
        run());
      if (el49) {
        const value14 = list['some']((value15) =>
            isNodeType(value6[value15], ['source-image', 'source-video', 'ai-image', 'ai-video']),
          ),
          value16 = value7 && value14;
        value3['resetBtnVisible'] !== value16 &&
          ((value3['resetBtnVisible'] = value16), (el49['style']['display'] = value16 ? '' : 'none'));
      }
      if (el50) {
        const count = list['filter']((value17) =>
          isNodeType(value6[value17], ['source-image', 'ai-image', 'storyboard']),
        )['length'];
        el50['style']['display'] = count >= 2 ? '' : 'none';
      }
      if (el51) {
        const value18 = list['map']((value19) => value6[value19])['filter'](Boolean);
        el51['style']['display'] = hasMaterialComparisonPair(value18) ? '' : 'none';
      }
      if (el48) {
        const selectedMediaComposeKind = getSelectedMediaComposeKind(value6, list),
          value20 = !!selectedMediaComposeKind;
        value3['composeBtnVisible'] !== value20 &&
          ((value3['composeBtnVisible'] = value20), (el48['style']['display'] = value20 ? '' : 'none'));
        if (value3['composeBtnKind'] !== selectedMediaComposeKind) {
          value3['composeBtnKind'] = selectedMediaComposeKind;
          const mediaComposeButtonLabel = getMediaComposeButtonLabel(selectedMediaComposeKind);
          ((el48['dataset']['composeKind'] = selectedMediaComposeKind),
            (el48['dataset']['tooltip'] = mediaComposeButtonLabel),
            el48['setAttribute']('aria-label', mediaComposeButtonLabel));
        }
      }
      let value21 = Infinity,
        value22 = Infinity,
        value23 = -Infinity,
        value24 = -Infinity,
        count2 = 0;
      for (const value25 of list) {
        const box = value6[value25];
        if (!box) continue;
        count2 += 1;
        const value26 = box['width'] || 260,
          value27 = box['height'] || 100,
          value28 = box['type'] === 'group' ? box['y'] : box['y'] - 30;
        ((value21 = Math['min'](value21, box['x'])),
          (value22 = Math['min'](value22, value28)),
          (value23 = Math['max'](value23, box['x'] + value26)),
          (value24 = Math['max'](value24, box['y'] + value27)));
      }
      if (count2 < 2) {
        if (el42['style']['display'] !== 'none') el42['style']['display'] = 'none';
        value3['geometrySig'] = '';
        return;
      }
      if (el42['style']['display'] !== 'block') el42['style']['display'] = 'block';
      const value29 = 18,
        value30 = value21 - value29,
        value31 = value22 - value29,
        value32 = value23 - value21 + value29 * 2,
        value33 = value24 - value22 + value29 * 2,
        value34 =
          value30['toFixed'](2) +
          '|' +
          value31['toFixed'](2) +
          '|' +
          value32['toFixed'](2) +
          '|' +
          value33['toFixed'](2);
      value3['geometrySig'] !== value34 &&
        ((value3['geometrySig'] = value34),
        (el42['style']['left'] = value30 + 'px'),
        (el42['style']['top'] = value31 + 'px'),
        (el42['style']['width'] = value32 + 'px'),
        (el42['style']['height'] = value33 + 'px'));
    },
    handler5 = (value35, value36, value37 = {}) => {
      if (!el43) return;
      const value38 = String(value37?.['alignFeatureTriggerMode'] || 'click'),
        value39 = value37?.['alignFeatureEnabled'] !== ![] && value38 !== 'off',
        list2 = Array['isArray'](value35) ? value35 : [],
        list3 = getAlignableSelectionNodes(value36 || {}, list2),
        enabled6 =
          value39 &&
          value37?.['alignPanelVisible'] === !![] &&
          list2['length'] >= 2 &&
          list3['length'] >= 2;
      if (!enabled6) {
        if (el43['style']['display'] !== 'none') el43['style']['display'] = 'none';
        ((value4['centerSig'] = ''), (value4['buttonStateSig'] = ''));
        return;
      }
      const box2 = value37?.['alignPanelAnchorWorld'],
        enabled7 = !!box2 && Number['isFinite'](box2['x']) && Number['isFinite'](box2['y']),
        enabled8 = enabled7 ? null : computeSelectionBounds(list3);
      if (!enabled7 && !enabled8) {
        if (el43['style']['display'] !== 'none') el43['style']['display'] = 'none';
        ((value4['centerSig'] = ''), (value4['buttonStateSig'] = ''));
        return;
      }
      const value40 = enabled7 ? Number(box2['x']) : enabled8['centerX'],
        value41 = enabled7 ? Number(box2['y']) : enabled8['centerY'];
      if (el43['style']['display'] !== 'block') el43['style']['display'] = 'block';
      const value42 = value40['toFixed'](2) + '|' + value41['toFixed'](2);
      value4['centerSig'] !== value42 &&
        ((value4['centerSig'] = value42),
        (el43['style']['left'] = value40 + 'px'),
        (el43['style']['top'] = value41 + 'px'));
      const enabled9 = list3['length'] >= 2,
        value43 = enabled9 ? '1' : '0';
      if (value4['buttonStateSig'] !== value43) {
        value4['buttonStateSig'] = value43;
        const value44 =
          el43['_actionButtons'] || Array['from'](el43['querySelectorAll']('button[data-ui-action]'));
        el43['_actionButtons'] = value44;
        for (const el52 of value44) {
          const value45 = el52['dataset']['uiAction'],
            value46 = value45 === 'ms-distribute-h' || value45 === 'ms-distribute-v',
            value47 = value46 ? !enabled9 : ![];
          ((el52['disabled'] = value47), el52['classList']['toggle']('is-disabled', value47));
        }
      }
    },
    mount = (el53) => {
      (subscribeNodeBatchExportPending2?.(),
        value2?.(),
        (value2 = null),
        reset({ restoreNodeChrome: !![] }),
        el42?.['remove']?.(),
        el43?.['remove']?.(),
        (el42 = createMultiSelectBoxEl()),
        (el43 = createAlignCenterPanelEl()),
        el53['appendChild'](el42),
        el53['appendChild'](el43),
        (subscribeNodeBatchExportPending2 = subscribeNodeBatchExportPending(run)),
        (value2 = subscribeSyncPlaybackState?.((value48) => {
          ((input = value48 || { active: ![], loop: ![] }),
            syncVideoPlaybackButtonPresentation(
              el42?.['querySelector']?.('.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]'),
              input,
            ));
        })));
    },
    render = (state2 = {}) => {
      (handler4(
        state2['selectedNodeIds'],
        state2['nodes'] || {},
        state2['ui']?.['imageVideoNodeResizeEnabled'] === !![],
      ),
        handler5(state2['selectedNodeIds'], state2['nodes'] || {}, state2['ui']));
    },
    reset = ({ restoreNodeChrome: restoreNodeChrome = ![] } = {}) => {
      if (restoreNodeChrome) handler3();
      else output = new Set();
      handler2();
      if (el42) el42['style']['display'] = 'none';
      if (el43) el43['style']['display'] = 'none';
    },
    unmount = () => {
      (subscribeNodeBatchExportPending2?.(),
        (subscribeNodeBatchExportPending2 = null),
        value2?.(),
        (value2 = null),
        reset({ restoreNodeChrome: !![] }),
        el42?.['remove']?.(),
        el43?.['remove']?.(),
        (el42 = null),
        (el43 = null));
    };
  return Object['freeze']({ mount: mount, render: render, reset: reset, unmount: unmount });
}
