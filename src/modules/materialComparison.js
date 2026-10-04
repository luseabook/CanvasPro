import {
  closeActiveImagePreview,
  closeActiveVideoPreview,
  resolveNodeImageOriginalSource,
} from './imagePreview.js';
import {
  MATERIAL_COMPARISON_KIND_VIDEO,
  findInitialMaterialComparisonPair,
  getMaterialComparisonKindCounts,
  resolveMaterialComparisonEntries,
} from './materialComparisonEntries.js';
import { createMaterialComparisonPlaybackController } from './materialComparisonPlayback.js';
import { findCanvasVideoElementForEntry, stopActiveSyncVideoPlayback } from './videoSyncPlayback.js';
import { releaseCanvasPanShortcut } from '../services/canvasPanShortcutState.js';
import { beginModalInteraction } from '../services/modalInteractionScope.js';
import { getComparisonImageCache, getComparisonOriginalKey } from './materialComparisonImageCache.js';
import { createMaterialComparisonViewport } from './materialComparisonViewport.js';
import { createImageLoadDiagnostics, getImageLoadTiming } from '../services/imageLoadDiagnostics.js';
import { t } from '../i18n/index.js';
export { resolveMaterialComparisonEntries } from './materialComparisonEntries.js';
const MODE_SLIDE = 'slide',
  MODE_SIDE_BY_SIDE = 'side-by-side',
  SLOT_LEFT = 'left',
  SLOT_RIGHT = 'right';
let activeMaterialComparisonClose = null;
function clamp(value, item, key) {
  const index = Number(value);
  if (!Number['isFinite'](index)) return item;
  return Math['min'](key, Math['max'](item, index));
}
function createElement(el, result, data = '') {
  const options = el['createElement'](result);
  if (data) options['className'] = data;
  return options;
}
function createTextElement(target, source, next, current) {
  const el2 = createElement(target, source, next);
  return ((el2['textContent'] = current), el2);
}
function createButton(entry, record, payload, handle = payload) {
  const el3 = createTextElement(entry, 'button', record, payload);
  return ((el3['type'] = 'button'), el3['setAttribute']('aria-label', handle), el3);
}
function getEntryNodeName(state) {
  for (const config of [state?.['node']?.['name'], state?.['node']?.['fileName'], state?.['label']]) {
    const scope = String(config || '')['trim']();
    if (scope) return scope;
  }
  return '';
}
function safeRevokeObjectUrl(input) {
  try {
    globalThis['URL']?.['revokeObjectURL']?.(input);
  } catch (output) {}
}
export function closeActiveMaterialComparison() {
  if (typeof activeMaterialComparisonClose !== 'function') return ![];
  const run = activeMaterialComparisonClose;
  return (run(), !![]);
}
export function openMaterialComparison(list = [], value2 = {}) {
  const translate = typeof value2['translate'] === 'function' ? value2['translate'] : t,
    leftAspectRatio = resolveMaterialComparisonEntries(list, { translate: translate }),
    leftIndex = findInitialMaterialComparisonPair(leftAspectRatio);
  if (!leftIndex) return () => {};
  const documentObject = value2['documentObject'] || globalThis['document'],
    windowObject = value2['windowObject'] || globalThis['window'];
  if (!documentObject?.['body'] || !documentObject?.['createElement']) return () => {};
  const run2 = () => releaseCanvasPanShortcut({ documentObject: documentObject, windowObject: windowObject });
  (closeActiveImagePreview(),
    closeActiveVideoPreview(),
    stopActiveSyncVideoPlayback(),
    closeActiveMaterialComparison());
  const run3 =
      typeof value2['sourceResolver'] === 'function'
        ? value2['sourceResolver']
        : resolveNodeImageOriginalSource,
    value3 = run3 === resolveNodeImageOriginalSource ? getComparisonImageCache(documentObject) : null,
    value4 = value3?.['generation'],
    imageLoadDiagnostics = createImageLoadDiagnostics('material-comparison'),
    attachVideoSource =
      typeof value2['attachVideoSource'] === 'function' ? value2['attachVideoSource'] : undefined,
    playVideo =
      typeof value2['playVideo'] === 'function' ? value2['playVideo'] : (value5) => value5?.['play']?.(),
    videoElementResolver =
      typeof value2['videoElementResolver'] === 'function'
        ? value2['videoElementResolver']
        : (nodeId) =>
            findCanvasVideoElementForEntry(documentObject, {
              nodeId: nodeId?.['node']?.['id'] || nodeId?.['id'],
              videoIndex: nodeId?.['videoIndex'],
            }),
    map = getMaterialComparisonKindCounts(leftAspectRatio),
    state2 = {
      mode: MODE_SLIDE,
      leftIndex: leftIndex['leftIndex'],
      rightIndex: leftIndex['rightIndex'],
      nextSlot: SLOT_LEFT,
      dividerPercent: 0x32,
      zoom: 0x1,
      leftAspectRatio: leftAspectRatio[leftIndex['leftIndex']]['aspectRatio'] || 0x1,
      rightAspectRatio: leftAspectRatio[leftIndex['rightIndex']]['aspectRatio'] || 0x1,
      stageWidth: 0x1,
      stageHeight: 0x1,
    },
    revokeUrlOnClose = new Set();
  let enabled = ![],
    beginModalInteraction2 = null,
    value6 = null,
    event = null,
    enabled2 = ![],
    enabled3 = '',
    enabled4 = ![];
  const overlay = createElement(documentObject, 'div', 'v2-material-comparison-overlay');
  (overlay['setAttribute']('role', 'dialog'),
    overlay['setAttribute']('aria-modal', 'true'),
    overlay['setAttribute']('aria-label', translate('canvasInteraction.materialComparison.ariaLabel')));
  const el4 = createElement(documentObject, 'header', 'v2-material-comparison-header'),
    el5 = createElement(documentObject, 'div', 'v2-material-comparison-header-meta'),
    textElement = createTextElement(
      documentObject,
      'h2',
      'v2-material-comparison-title',
      translate('canvasInteraction.materialComparison.title'),
    ),
    textElement2 = createTextElement(
      documentObject,
      'span',
      'v2-material-comparison-count',
      '2 / ' + leftAspectRatio['length'],
    ),
    textElement3 = createTextElement(
      documentObject,
      'span',
      'v2-material-comparison-cache-hint',
      translate('canvasInteraction.materialComparison.localCache'),
    );
  (el5['appendChild'](textElement), el5['appendChild'](textElement2), el5['appendChild'](textElement3));
  const el6 = createElement(documentObject, 'div', 'v2-material-comparison-mode-switch');
  (el6['setAttribute']('role', 'group'),
    el6['setAttribute']('aria-label', translate('canvasInteraction.materialComparison.modeGroupLabel')));
  const el7 = createButton(
    documentObject,
    'v2-material-comparison-mode-button\x20is-active',
    translate('canvasInteraction.materialComparison.slideMode'),
  );
  ((el7['dataset']['comparisonMode'] = MODE_SLIDE), el7['setAttribute']('aria-pressed', 'true'));
  const el8 = createButton(
    documentObject,
    'v2-material-comparison-mode-button',
    translate('canvasInteraction.materialComparison.sideBySideMode'),
  );
  ((el8['dataset']['comparisonMode'] = MODE_SIDE_BY_SIDE),
    el8['setAttribute']('aria-pressed', 'false'),
    el6['appendChild'](el7),
    el6['appendChild'](el8));
  const el9 = createButton(
    documentObject,
    'v2-material-comparison-close',
    translate('canvasInteraction.materialComparison.close'),
  );
  (el4['appendChild'](el5), el4['appendChild'](el6), el4['appendChild'](el9));
  const viewport = createElement(documentObject, 'div', 'v2-material-comparison-viewport'),
    main = createElement(documentObject, 'main', 'v2-material-comparison-main');
  main['tabIndex'] = 0x0;
  const stageShell = createElement(documentObject, 'div', 'v2-material-comparison-stage-shell'),
    stage = createElement(documentObject, 'div', 'v2-material-comparison-stage');
  ((stage['dataset']['comparisonMode'] = MODE_SLIDE),
    stage['style']['setProperty']('--material-comparison-divider', '50%'));
  const run4 = (slot) => {
      const panel = createElement(documentObject, 'div', 'v2-material-comparison-panel is-' + slot),
        value7 = leftAspectRatio[slot === SLOT_LEFT ? state2['leftIndex'] : state2['rightIndex']];
      value7['originalCacheKey'] = getComparisonOriginalKey(value7['node']);
      const entryKind =
        value7['kind'] !== MATERIAL_COMPARISON_KIND_VIDEO
          ? value3?.['take'](value7['originalCacheKey'])
          : null;
      if (entryKind) {
        (imageLoadDiagnostics['mark']('cache-hit', { slot: slot }),
          (value7['originalUrl'] = entryKind['url']));
        if (entryKind['revokeUrlOnClose']) revokeUrlOnClose['add'](entryKind['url']);
      }
      const image =
        entryKind?.['image'] || createElement(documentObject, 'img', 'v2-material-comparison-image');
      ((image['draggable'] = ![]), (image['decoding'] = 'async'), (image['fetchPriority'] = 'high'));
      const video = createElement(documentObject, 'video', 'v2-material-comparison-video');
      ((video['hidden'] = !![]),
        (video['controls'] = ![]),
        (video['playsInline'] = !![]),
        (video['preload'] = 'auto'));
      const badge = createTextElement(
        documentObject,
        'span',
        'v2-material-comparison-panel-badge',
        translate('canvasInteraction.materialComparison.' + slot),
      );
      return (
        panel['appendChild'](image),
        panel['appendChild'](video),
        panel['appendChild'](badge),
        {
          panel: panel,
          image: image,
          video: video,
          badge: badge,
          slot: slot,
          attachToken: 0x0,
          sourceUrl: '',
          entryKind: entryKind ? value7['kind'] : '',
          playbackReady: ![],
          playbackFailed: ![],
        }
      );
    },
    rightPanel = run4(SLOT_RIGHT),
    leftPanel = run4(SLOT_LEFT),
    el10 = createButton(
      documentObject,
      'v2-material-comparison-divider',
      '',
      translate('canvasInteraction.materialComparison.dividerLabel'),
    );
  (el10['setAttribute']('role', 'slider'),
    el10['setAttribute']('aria-valuemin', '0'),
    el10['setAttribute']('aria-valuemax', '100'),
    el10['setAttribute']('aria-valuenow', '50'));
  const el11 = createElement(documentObject, 'span', 'v2-material-comparison-divider-handle');
  (el11['setAttribute']('aria-hidden', 'true'),
    el10['appendChild'](el11),
    stage['appendChild'](rightPanel['panel']),
    stage['appendChild'](leftPanel['panel']),
    stageShell['appendChild'](stage),
    main['appendChild'](stageShell),
    viewport['appendChild'](main),
    viewport['appendChild'](el10));
  const materialComparisonViewport = createMaterialComparisonViewport({
      state: state2,
      main: main,
      stage: stage,
      stageShell: stageShell,
      viewport: viewport,
      windowObject: windowObject,
    }),
    onGeometryChange = () => materialComparisonViewport['syncGeometry'](),
    handler = () => materialComparisonViewport['syncDivider'](),
    materialComparisonPlaybackController = createMaterialComparisonPlaybackController({
      documentObject: documentObject,
      windowObject: windowObject,
      translate: translate,
      overlay: overlay,
      leftPanel: leftPanel,
      rightPanel: rightPanel,
      leftSlot: SLOT_LEFT,
      rightSlot: SLOT_RIGHT,
      videoKind: MATERIAL_COMPARISON_KIND_VIDEO,
      getActiveEntry: getActiveEntry,
      onMediaAspect: onMediaAspect,
      onGeometryChange: onGeometryChange,
      videoElementResolver: videoElementResolver,
      ...(attachVideoSource ? { attachVideoSource: attachVideoSource } : {}),
      ...(playVideo ? { playVideo: playVideo } : {}),
    }),
    value8 = materialComparisonPlaybackController['root'],
    el12 = createElement(documentObject, 'footer', 'v2-material-comparison-footer'),
    el13 = createElement(documentObject, 'div', 'v2-material-comparison-library-header'),
    textElement4 = createTextElement(
      documentObject,
      'strong',
      'v2-material-comparison-library-title',
      translate('canvasInteraction.materialComparison.library'),
    ),
    textElement5 = createTextElement(
      documentObject,
      'span',
      'v2-material-comparison-library-count',
      String(leftAspectRatio['length']),
    ),
    textElement6 = createTextElement(
      documentObject,
      'span',
      'v2-material-comparison-library-hint',
      translate('canvasInteraction.materialComparison.libraryHint'),
    );
  (el13['appendChild'](textElement4), el13['appendChild'](textElement5), el13['appendChild'](textElement6));
  const el14 = createElement(documentObject, 'div', 'v2-material-comparison-thumbnail-track'),
    list2 = leftAspectRatio['map']((name, index2) => {
      const card = createButton(
        documentObject,
        'v2-material-comparison-thumbnail-card',
        '',
        translate('canvasInteraction.materialComparison.thumbnailLabel', {
          index: index2 + 0x1,
          name: name['label'],
        }),
      );
      ((card['dataset']['comparisonIndex'] = String(index2)),
        (card['dataset']['comparisonKind'] = name['kind']),
        card['classList']['add']('is-' + name['kind']));
      let el15;
      name['thumbnailUrl']
        ? ((el15 = createElement(documentObject, 'img', 'v2-material-comparison-thumbnail-image')),
          (el15['src'] = name['thumbnailUrl']),
          (el15['alt'] = name['label']),
          (el15['draggable'] = ![]))
        : ((el15 = createTextElement(
            documentObject,
            'span',
            'v2-material-comparison-thumbnail-placeholder',
            '▶',
          )),
          el15['setAttribute']('aria-hidden', 'true'));
      const textElement7 = createTextElement(
          documentObject,
          'span',
          'v2-material-comparison-thumbnail-name',
          name['label'],
        ),
        leftBadge = createTextElement(
          documentObject,
          'span',
          'v2-material-comparison-thumbnail-badge\x20is-left',
          translate('canvasInteraction.materialComparison.left'),
        ),
        rightBadge = createTextElement(
          documentObject,
          'span',
          'v2-material-comparison-thumbnail-badge is-right',
          translate('canvasInteraction.materialComparison.right'),
        );
      return (
        card['appendChild'](el15),
        card['appendChild'](textElement7),
        card['appendChild'](leftBadge),
        card['appendChild'](rightBadge),
        el14['appendChild'](card),
        { card: card, leftBadge: leftBadge, rightBadge: rightBadge, entry: name }
      );
    });
  (el12['appendChild'](el13),
    el12['appendChild'](el14),
    overlay['appendChild'](el4),
    overlay['appendChild'](viewport));
  if (value8) overlay['appendChild'](value8);
  overlay['appendChild'](el12);
  function run5(value9) {
    return value9 === SLOT_LEFT ? leftPanel : rightPanel;
  }
  function run6(value10, value11) {
    const value12 = Number['isFinite'](Number(value11)) && Number(value11) > 0x0 ? Number(value11) : 0x1;
    if (value10 === SLOT_LEFT) state2['leftAspectRatio'] = value12;
    else state2['rightAspectRatio'] = value12;
    run5(value10)['panel']['style']['setProperty']('--material-comparison-source-aspect', String(value12));
  }
  function getActiveEntry(value13) {
    return leftAspectRatio[value13 === SLOT_LEFT ? state2['leftIndex'] : state2['rightIndex']] || null;
  }
  function run7(slot2, value14, value15) {
    const { panel: panel2, image: image2 } = slot2,
      value16 = String(value15 || '')['trim']();
    image2['alt'] = value14['label'];
    if (
      slot2['entryKind'] === value14['kind'] &&
      image2['getAttribute']('src') === value16 &&
      !panel2['classList']['contains']('is-error')
    )
      return;
    (slot2['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO &&
      materialComparisonPlaybackController['clearPanelSource'](slot2),
      (slot2['entryKind'] = value14['kind']),
      (slot2['attachToken'] += 0x1),
      (image2['hidden'] = !![]),
      panel2['setAttribute']('aria-busy', 'true'),
      panel2['classList']['add']('is-loading'),
      panel2['classList']['remove']('is-error'),
      imageLoadDiagnostics['mark']('source-assigned', { slot: slot2['slot'] }),
      (image2['src'] = value16));
  }
  function run8(value17, value18) {
    const { panel: panel3, image: image3 } = value17;
    (value17['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO &&
      materialComparisonPlaybackController['clearPanelSource'](value17),
      (value17['entryKind'] = value18['kind']),
      (value17['attachToken'] += 0x1),
      (image3['alt'] = value18['label']),
      (image3['hidden'] = !![]),
      image3['removeAttribute']?.('src'),
      panel3['classList']['add']('is-loading'),
      panel3['classList']['remove']('is-error'),
      panel3['setAttribute']('aria-busy', 'true'));
  }
  function run9(slot3) {
    ((slot3['attachToken'] += 0x1),
      (slot3['image']['hidden'] = !![]),
      (slot3['video']['hidden'] = !![]),
      slot3['panel']['classList']['remove']('is-loading'),
      slot3['panel']['classList']['add']('is-error'),
      slot3['panel']['setAttribute']('aria-busy', 'false'),
      imageLoadDiagnostics['mark']('error', { slot: slot3['slot'] }));
  }
  function run10(slot4, value19) {
    if (enabled || value19['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO) return;
    const { image: image4, panel: panel4 } = value19;
    (imageLoadDiagnostics['mark']('original-loaded', { slot: slot4, ...getImageLoadTiming(image4) }),
      onMediaAspect(slot4, value19),
      (image4['hidden'] = ![]),
      panel4['classList']['remove']('is-loading', 'is-error'),
      panel4['setAttribute']('aria-busy', 'false'),
      windowObject?.['requestAnimationFrame']?.(() =>
        windowObject['requestAnimationFrame'](() => {
          if (!enabled) imageLoadDiagnostics['mark']('paint-opportunity', { slot: slot4 });
        }),
      ));
  }
  function onMediaAspect(value20, value21, value22 = value21['image']) {
    const count = Number(value22?.['naturalWidth'] || value22?.['videoWidth'] || 0x0),
      count2 = Number(value22?.['naturalHeight'] || value22?.['videoHeight'] || 0x0);
    if (count <= 0x0 || count2 <= 0x0) return;
    const value23 = count / count2,
      value24 = value20 === SLOT_LEFT ? state2['leftIndex'] : state2['rightIndex'];
    if (leftAspectRatio[value24]) leftAspectRatio[value24]['aspectRatio'] = value23;
    (run6(value20, value23), onGeometryChange());
  }
  function run11(index3) {
    const enabled5 = leftAspectRatio[index3];
    if (!enabled5) return Promise['resolve']('');
    if (enabled5['kind'] === MATERIAL_COMPARISON_KIND_VIDEO)
      return Promise['resolve'](enabled5['sourceUrl'] || '');
    if (enabled5['originalUrl']) return Promise['resolve'](enabled5['originalUrl']);
    if (enabled5['originalPromise']) return enabled5['originalPromise'];
    return (
      (enabled5['originalPromise'] = Promise['resolve']()
        ['then'](() => {
          return (
            imageLoadDiagnostics['mark']('resolve-start', { index: index3 }),
            (enabled5['originalCacheKey'] = getComparisonOriginalKey(enabled5['node'])),
            run3(enabled5['node'])
          );
        })
        ['then']((response) => {
          imageLoadDiagnostics['mark']('resolve-end', { index: index3, hasSource: !!response?.['url'] });
          if (enabled5['originalCacheKey'] !== getComparisonOriginalKey(enabled5['node']))
            enabled5['originalCacheKey'] = '';
          const enabled6 = String(response?.['url'] || '')['trim']();
          if (!enabled6) return '';
          if (response?.['revokeUrlOnClose']) {
            if (enabled) safeRevokeObjectUrl(enabled6);
            else revokeUrlOnClose['add'](enabled6);
          }
          return (
            (enabled5['originalUrl'] = enabled6),
            (enabled5['revokeUrlOnClose'] = response?.['revokeUrlOnClose'] === !![]),
            enabled6
          );
        })
        ['catch'](() => '')
        ['finally'](() => {
          enabled5['originalPromise'] = null;
        })),
      enabled5['originalPromise']
    );
  }
  function run12(value25, value26) {
    const enabled7 = leftAspectRatio[value26];
    if (!enabled7) return;
    const enabled8 = value25 === SLOT_LEFT ? leftPanel : rightPanel;
    ((enabled8['badge']['textContent'] =
      getEntryNodeName(enabled7) || translate('canvasInteraction.materialComparison.' + value25)),
      run6(value25, enabled7['aspectRatio'] || 0x1),
      onGeometryChange());
    if (enabled7['kind'] === MATERIAL_COMPARISON_KIND_VIDEO) {
      materialComparisonPlaybackController['setPanelSource'](value25, enabled8, enabled7);
      return;
    }
    if (enabled7['originalUrl']) {
      run7(enabled8, enabled7, enabled7['originalUrl']);
      if (enabled8['image']['complete'] && !enabled8['image']['hidden']) run10(value25, enabled8);
      return;
    }
    (run8(enabled8, enabled7),
      void run11(value26)['then']((value27) => {
        if (enabled) return;
        const value28 = value25 === SLOT_LEFT ? state2['leftIndex'] : state2['rightIndex'];
        if (value28 !== value26) return;
        value27 ? run7(enabled8, enabled7, value27) : run9(enabled8);
      }));
  }
  function run13(value29) {
    const enabled9 = leftAspectRatio[value29];
    if (!enabled9 || (map['get'](enabled9['kind']) || 0x0) < 0x2) return !![];
    if (state2['nextSlot'] !== SLOT_RIGHT) return ![];
    return enabled9['kind'] !== getActiveEntry(SLOT_LEFT)?.['kind'];
  }
  function run14() {
    list2['forEach'](({ card: card2, leftBadge: leftBadge2, rightBadge: rightBadge2 }, value30) => {
      const enabled10 = value30 === state2['leftIndex'],
        enabled11 = value30 === state2['rightIndex'],
        value31 = run13(value30);
      (card2['classList']['toggle']('is-selected', enabled10 || enabled11),
        card2['classList']['toggle']('is-left', enabled10),
        card2['classList']['toggle']('is-right', enabled11),
        card2['classList']['toggle']('is-disabled', value31),
        (card2['disabled'] = value31),
        (leftBadge2['hidden'] = !enabled10),
        (rightBadge2['hidden'] = !enabled11),
        card2['setAttribute']('aria-pressed', String(enabled10 || enabled11)),
        card2['setAttribute']('aria-disabled', String(value31)));
    });
  }
  function run15(value32) {
    if (enabled) return;
    const value33 = Math['trunc'](Number(value32));
    if (!Number['isFinite'](value33) || !leftAspectRatio[value33]) return;
    if (run13(value33)) return;
    const value34 = state2['nextSlot'];
    if (value34 === SLOT_LEFT) {
      state2['leftIndex'] = value33;
      const value35 = getActiveEntry(SLOT_RIGHT);
      if (value35?.['kind'] !== leftAspectRatio[value33]['kind']) {
        const count3 = leftAspectRatio['findIndex'](
          (value36, value37) => value37 !== value33 && value36['kind'] === leftAspectRatio[value33]['kind'],
        );
        count3 >= 0x0 && ((state2['rightIndex'] = count3), run12(SLOT_RIGHT, count3));
      }
      state2['nextSlot'] = SLOT_RIGHT;
    } else ((state2['rightIndex'] = value33), (state2['nextSlot'] = SLOT_LEFT));
    (run12(value34, value33),
      materialComparisonPlaybackController['syncVisibility'](),
      run16() && enabled3 === 'pan' && run17(![]),
      run14());
  }
  function run18(value38) {
    const value39 = value38 === MODE_SIDE_BY_SIDE ? MODE_SIDE_BY_SIDE : MODE_SLIDE;
    ((state2['mode'] = value39),
      (stage['dataset']['comparisonMode'] = value39),
      (el10['hidden'] = value39 !== MODE_SLIDE),
      el7['classList']['toggle']('is-active', value39 === MODE_SLIDE),
      el8['classList']['toggle']('is-active', value39 === MODE_SIDE_BY_SIDE),
      el7['setAttribute']('aria-pressed', String(value39 === MODE_SLIDE)),
      el8['setAttribute']('aria-pressed', String(value39 === MODE_SIDE_BY_SIDE)),
      onGeometryChange());
  }
  function run19(value40) {
    ((state2['dividerPercent'] = Math['round'](clamp(value40, 0x0, 0x64) * 0x64) / 0x64),
      handler(),
      el10['setAttribute']('aria-valuenow', String(Math['round'](state2['dividerPercent']))));
  }
  function run20(event2) {
    const box = main['getBoundingClientRect']?.(),
      count4 = Number(main['clientWidth'] || box?.['width']) || 0x0;
    if (count4 <= 0x0) return;
    const value41 = Number(box?.['left']) || 0x0;
    run19(((Number(event2?.['clientX']) - value41) / count4) * 0x64);
  }
  function run21(event3) {
    if (value6 === null) return;
    if (event3?.['pointerId'] != null && value6 != null && event3['pointerId'] !== value6) return;
    (event3?.['preventDefault']?.(),
      event3?.['stopPropagation']?.(),
      windowObject?.['removeEventListener']?.('pointermove', run22, !![]),
      windowObject?.['removeEventListener']?.('pointerup', run21, !![]),
      windowObject?.['removeEventListener']?.('pointercancel', run21, !![]),
      stage['classList']['remove']('is-dragging-divider'),
      (value6 = null));
  }
  function run22(event4) {
    if (value6 === null) return;
    if (event4?.['pointerId'] != null && value6 != null && event4['pointerId'] !== value6) return;
    (event4?.['preventDefault']?.(), event4?.['stopPropagation']?.(), run20(event4));
  }
  function run23(event5) {
    if (state2['mode'] !== MODE_SLIDE) return;
    if (enabled2) return;
    if (event5?.['button'] != null && event5['button'] !== 0x0) return;
    (event5?.['preventDefault']?.(),
      event5?.['stopPropagation']?.(),
      run21(),
      (value6 = event5?.['pointerId'] ?? 0x0),
      stage['classList']['add']('is-dragging-divider'),
      run20(event5),
      windowObject?.['addEventListener']?.('pointermove', run22, !![]),
      windowObject?.['addEventListener']?.('pointerup', run21, !![]),
      windowObject?.['addEventListener']?.('pointercancel', run21, !![]));
  }
  function run24(event6) {
    if (state2['mode'] !== MODE_SLIDE) return;
    if (event6['key'] !== 'ArrowLeft' && event6['key'] !== 'ArrowRight') return;
    (event6['preventDefault']?.(),
      event6['stopPropagation']?.(),
      run19(state2['dividerPercent'] + (event6['key'] === 'ArrowRight' ? 0x2 : -0x2)));
  }
  function run25() {
    (windowObject?.['removeEventListener']?.('pointermove', run26, !![]),
      windowObject?.['removeEventListener']?.('pointerup', run27, !![]),
      windowObject?.['removeEventListener']?.('pointercancel', run27, !![]));
  }
  function run28() {
    (run25(),
      overlay['classList']['remove']('is-panning'),
      stage['classList']['remove']('is-panning'),
      (event = null));
  }
  function run29(pointerId) {
    const count5 = Number(pointerId?.['button']),
      usesSpaceHand = enabled2 && count5 === 0x0;
    if (count5 !== 0x1 && !usesSpaceHand) return;
    (pointerId['preventDefault']?.(),
      pointerId['stopPropagation']?.(),
      run21(),
      run28(),
      (event = {
        pointerId: pointerId?.['pointerId'],
        startX: Number(pointerId?.['clientX'] || 0x0),
        startY: Number(pointerId?.['clientY'] || 0x0),
        scrollLeft: Number(main['scrollLeft'] || 0x0),
        scrollTop: Number(main['scrollTop'] || 0x0),
        captureTarget: main,
        usesSpaceHand: usesSpaceHand,
        moved: ![],
      }),
      overlay['classList']['add']('is-panning'),
      stage['classList']['add']('is-panning'),
      main['setPointerCapture']?.(pointerId?.['pointerId']),
      windowObject?.['addEventListener']?.('pointermove', run26, !![]),
      windowObject?.['addEventListener']?.('pointerup', run27, !![]),
      windowObject?.['addEventListener']?.('pointercancel', run27, !![]));
  }
  function run26(event7) {
    if (!event) return;
    if (
      event['pointerId'] != null &&
      event7?.['pointerId'] != null &&
      event7['pointerId'] !== event['pointerId']
    )
      return;
    (event7['preventDefault']?.(), event7['stopPropagation']?.());
    const value42 = Number(event7?.['clientX'] || 0x0) - event['startX'],
      value43 = Number(event7?.['clientY'] || 0x0) - event['startY'];
    (!event['moved'] &&
      Math['hypot'](value42, value43) >= 0x2 &&
      ((event['moved'] = !![]), (enabled4 = !![])),
      (main['scrollLeft'] = event['scrollLeft'] - value42),
      (main['scrollTop'] = event['scrollTop'] - value43),
      handler());
  }
  function run27(event8) {
    if (!event) return;
    if (
      event['pointerId'] != null &&
      event8?.['pointerId'] != null &&
      event8['pointerId'] !== event['pointerId']
    )
      return;
    (event8?.['preventDefault']?.(), event8?.['stopPropagation']?.());
    try {
      event['captureTarget']?.['releasePointerCapture']?.(event['pointerId']);
    } catch (value44) {}
    run28();
  }
  function run30(event9) {
    return event9?.['code'] === 'Space' || event9?.['key'] === '\x20' || event9?.['key'] === 'Space';
  }
  function run31(el16) {
    if (!el16) return ![];
    const value45 = String(el16['tagName'] || '')['toLowerCase']();
    if (['button', 'input', 'select', 'textarea']['includes'](value45)) return !![];
    if (el16['isContentEditable'] === !![]) return !![];
    return el16['closest']?.("button, input, select, textarea, [contenteditable='true']") != null;
  }
  function run17(value46) {
    ((enabled2 = value46 === !![]), overlay['classList']['toggle']('is-space-pan-ready', enabled2));
  }
  function run16() {
    return (
      getActiveEntry(SLOT_LEFT)?.['kind'] === MATERIAL_COMPARISON_KIND_VIDEO &&
      getActiveEntry(SLOT_RIGHT)?.['kind'] === MATERIAL_COMPARISON_KIND_VIDEO
    );
  }
  function run32(event10) {
    if (!run30(event10)) return;
    if (!enabled3 && !enabled2) return;
    (event10['preventDefault']?.(), event10['stopPropagation']?.(), run2(), (enabled3 = ''), run17(![]));
    if (event?.['usesSpaceHand']) run27(event10);
  }
  function run33() {
    (materialComparisonViewport['cancelZoom'](),
      run2(),
      (enabled3 = ''),
      run17(![]),
      run21(),
      run27(),
      (enabled4 = ![]));
  }
  function run34(event11) {
    if (Number(event11?.['button']) !== 0x1) return;
    (event11['preventDefault']?.(), event11['stopPropagation']?.());
  }
  const onClose = () => {
    if (enabled) return;
    ((enabled = !![]),
      materialComparisonViewport['dispose'](),
      imageLoadDiagnostics['finish'](),
      documentObject['removeEventListener']?.('keydown', run35, !![]),
      documentObject['removeEventListener']?.('keyup', run32, !![]),
      windowObject?.['removeEventListener']?.('resize', onGeometryChange),
      windowObject?.['removeEventListener']?.('blur', run33),
      windowObject?.['removeEventListener']?.('aicanvas:active-canvas-changed', onClose),
      run33());
    for (const value47 of [SLOT_LEFT, SLOT_RIGHT]) {
      const image5 = run5(value47);
      (image5['image']['removeEventListener']('load', image5['onImageLoad']),
        image5['image']['removeEventListener']('error', image5['onImageError']));
      const value48 = getActiveEntry(value47),
        url = value48?.['originalUrl'],
        value49 =
          value48?.['kind'] !== MATERIAL_COMPARISON_KIND_VIDEO &&
          !image5['image']['hidden'] &&
          value3?.['put'](
            value48['originalCacheKey'],
            { image: image5['image'], url: url, revokeUrlOnClose: revokeUrlOnClose['has'](url) },
            value4,
          );
      if (value49) revokeUrlOnClose['delete'](url);
      else image5['image']['removeAttribute']?.('src');
    }
    (materialComparisonPlaybackController['dispose'](),
      overlay['remove'](),
      beginModalInteraction2?.(),
      (beginModalInteraction2 = null),
      revokeUrlOnClose['forEach'](safeRevokeObjectUrl),
      revokeUrlOnClose['clear'](),
      activeMaterialComparisonClose === onClose && (activeMaterialComparisonClose = null));
  };
  function run35(event12) {
    if (event12['key'] === 'Escape') {
      (event12['preventDefault']?.(), event12['stopPropagation']?.(), onClose());
      return;
    }
    if (!run30(event12) || run31(event12['target'])) return;
    (event12['preventDefault']?.(), event12['stopPropagation']?.(), run2());
    if (event12['repeat']) return;
    if (run16()) {
      ((enabled3 = 'playback'),
        run17(![]),
        void materialComparisonPlaybackController['togglePlayback'](event12));
      return;
    }
    ((enabled3 = 'pan'), run17(!![]));
  }
  return (
    el7['addEventListener']('click', () => run18(MODE_SLIDE)),
    el8['addEventListener']('click', () => run18(MODE_SIDE_BY_SIDE)),
    el9['addEventListener']('click', onClose),
    stage['addEventListener']('pointerdown', run23),
    el10['addEventListener']('pointerdown', run23),
    el10['addEventListener']('pointerdown', run29),
    main['addEventListener']('pointerdown', run29),
    main['addEventListener']('auxclick', run34),
    el10['addEventListener']('auxclick', run34),
    main['addEventListener']('scroll', handler, { passive: !![] }),
    viewport['addEventListener']('wheel', materialComparisonViewport['zoomBy'], { passive: ![] }),
    el10['addEventListener']('keydown', run24),
    [SLOT_LEFT, SLOT_RIGHT]['forEach']((value50) => {
      const value51 = run5(value50);
      ((value51['onImageLoad'] = () => run10(value50, value51)),
        (value51['onImageError'] = () => {
          if (enabled || value51['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO) return;
          run9(value51);
        }),
        value51['image']['addEventListener']('load', value51['onImageLoad']),
        value51['image']['addEventListener']('error', value51['onImageError']));
    }),
    list2['forEach'](({ card: card3 }, value52) => {
      card3['addEventListener']('click', () => run15(value52));
    }),
    el14['addEventListener'](
      'wheel',
      (event13) => {
        const count6 = Math['max'](
          0x0,
          Number(el14['scrollWidth'] || 0x0) - Number(el14['clientWidth'] || 0x0),
        );
        if (count6 <= 0x0) return;
        const enabled12 = Number(event13['deltaY'] || event13['deltaX'] || 0x0);
        if (!enabled12) return;
        const value53 = Number(el14['scrollLeft'] || 0x0),
          clamp2 = clamp(value53 + enabled12, 0x0, count6);
        if (clamp2 !== value53) el14['scrollLeft'] = clamp2;
        (event13['preventDefault']?.(), event13['stopPropagation']?.());
      },
      { passive: ![] },
    ),
    main['addEventListener']('click', (event14) => {
      if (enabled4) {
        ((enabled4 = ![]), event14['preventDefault']?.(), event14['stopPropagation']?.());
        return;
      }
      if (event14['target'] === main || event14['target'] === stageShell) onClose();
    }),
    overlay['addEventListener']('click', (event15) => {
      if (event15['target'] === overlay) onClose();
    }),
    overlay['addEventListener']('contextmenu', (event16) => {
      (event16['preventDefault']?.(), event16['stopPropagation']?.());
    }),
    documentObject['addEventListener']?.('keydown', run35, !![]),
    documentObject['addEventListener']?.('keyup', run32, !![]),
    windowObject?.['addEventListener']?.('resize', onGeometryChange),
    windowObject?.['addEventListener']?.('blur', run33),
    run12(SLOT_LEFT, state2['leftIndex']),
    run12(SLOT_RIGHT, state2['rightIndex']),
    materialComparisonPlaybackController['syncVisibility'](),
    run14(),
    documentObject['body']['appendChild'](overlay),
    onGeometryChange(),
    (beginModalInteraction2 = beginModalInteraction({
      root: overlay,
      onClose: onClose,
      onSuspend: onClose,
      preferredSelector: '.v2-material-comparison-main',
    })),
    (activeMaterialComparisonClose = onClose),
    windowObject?.['addEventListener']?.('aicanvas:active-canvas-changed', onClose),
    (onClose['overlay'] = overlay),
    (onClose['assignEntry'] = run15),
    (onClose['setMode'] = run18),
    (onClose['getState'] = () => ({ ...state2 })),
    onClose
  );
}
