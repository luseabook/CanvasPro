import {
  activateStoryPromptDropSelection,
  getStoryPromptDropRange,
  resolveStoryAssetDragPreview,
  STORY_ASSET_DRAG_PREVIEW_POINTER_GAP,
} from './storyAssetDrag.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createStoryAssetPromptDragController({
  root: root,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  insertMention: insertMention = () => false,
  hideHoverPreview: hideHoverPreview = () => {},
} = {}) {
  let event = null,
    el = null,
    el2 = null,
    el3 = null;
  function run(el4) {
    const response = resolveStoryAssetDragPreview(el4),
      el5 = response['element'];
    if (!el5 || !documentObject?.['createElement']) return null;
    const box = el5['getBoundingClientRect']?.() || el4?.['getBoundingClientRect']?.() || {},
      item = Math['max'](1, Number(box['width']) || 128),
      key = Math['max'](1, Number(box['height']) || item),
      index = Math['min'](160, Math['max'](96, item)),
      result = Math['max'](54, Math['round']((index * key) / item)),
      el6 = documentObject['createElement']('div');
    ((el6['className'] = 'story-asset-drag-preview'),
      (el6['dataset']['storyAssetDragMediaType'] = response['mediaType']),
      el6['setAttribute']('aria-hidden', 'true'),
      (el6['style']['width'] = Math['round'](index) + 'px'),
      (el6['style']['height'] = Math['round'](result) + 'px'));
    let enabled = null;
    if (response['url'])
      ((enabled = documentObject['createElement']('img')),
        (enabled['src'] = response['url']),
        (enabled['alt'] = ''),
        (enabled['draggable'] = false));
    else {
      if (response['mediaType'] === 'video') {
        const box2 = documentObject['createElement']('canvas'),
          data = Math['max'](1, Math['trunc'](Number(el5['videoWidth']) || item)),
          options = Math['max'](1, Math['trunc'](Number(el5['videoHeight']) || key));
        ((box2['width'] = data), (box2['height'] = options));
        try {
          const ctx = box2['getContext']?.('2d');
          ctx?.['drawImage']?.(el5, 0, 0, data, options);
          if (ctx) enabled = box2;
        } catch {
          enabled = null;
        }
        if (!enabled && typeof el5['cloneNode'] === 'function') {
          ((enabled = el5['cloneNode'](true)),
            (enabled['muted'] = true),
            enabled['removeAttribute']?.('controls'));
          try {
            enabled['currentTime'] = Number(el5['currentTime']) || 0;
          } catch {}
        }
      } else typeof el5['cloneNode'] === 'function' && (enabled = el5['cloneNode'](true));
    }
    if (!enabled) return null;
    return (el6['appendChild'](enabled), documentObject['body']?.['appendChild']?.(el6), (el = el6), el6);
  }
  function run2(event2) {
    if (!el) return;
    const target = Number(event2?.['clientX']) || 0,
      source = Number(event2?.['clientY']) || 0,
      box3 = el['getBoundingClientRect']?.() || {},
      next = Math['max'](1, Number(box3['width']) || Number['parseFloat'](el['style']['width']) || 1),
      current = Math['max'](
        1,
        Number(box3['height']) || Number['parseFloat'](el['style']['height']) || 1,
      ),
      entry = Number(windowObject?.['innerWidth']) || Number['POSITIVE_INFINITY'],
      record = Number(windowObject?.['innerHeight']) || Number['POSITIVE_INFINITY'],
      payload = 8;
    let handle = target + STORY_ASSET_DRAG_PREVIEW_POINTER_GAP,
      state = source + STORY_ASSET_DRAG_PREVIEW_POINTER_GAP;
    (handle + next > entry - payload && (handle = target - next - STORY_ASSET_DRAG_PREVIEW_POINTER_GAP),
      state + current > record - payload && (state = source - current - STORY_ASSET_DRAG_PREVIEW_POINTER_GAP),
      (handle = Math['max'](payload, handle)),
      (state = Math['max'](payload, state)),
      (el['style']['transform'] = 'translate3d(' + handle + 'px, ' + state + 'px, 0)'));
  }
  function hideCaret() {
    (el3?.['classList']?.['remove']('is-story-asset-drop-caret-active'), (el3 = null));
    if (el2) el2['hidden'] = true;
  }
  function clear() {
    ((event = null),
      el?.['remove']?.(),
      (el = null),
      hideCaret(),
      root?.['querySelectorAll']?.('.is-story-asset-dragging')?.['forEach']?.((el7) => {
        el7['classList']['remove']('is-story-asset-dragging');
      }),
      root?.['querySelectorAll']?.('.is-story-asset-drop-target')?.['forEach']?.((el8) => {
        el8['classList']['remove']('is-story-asset-drop-target');
      }));
  }
  function run3(event3) {
    const config = event3['target']?.['closest']?.('[data-story-clip-prompt-surface]');
    if (config) return config;
    return (
      documentObject['elementFromPoint']?.(
        Number(event3['clientX']) || 0,
        Number(event3['clientY']) || 0,
      )?.['closest']?.('[data-story-clip-prompt-surface]') || null
    );
  }
  function showCaret(el9, event4) {
    const el10 = getStoryPromptDropRange(documentObject, el9, event4['clientX'], event4['clientY']);
    if (!el10) return (hideCaret(), null);
    (activateStoryPromptDropSelection(windowObject, el9, el10),
      el3?.['classList']?.['remove']('is-story-asset-drop-caret-active'),
      (el3 = el9),
      el9['classList']?.['add']('is-story-asset-drop-caret-active'));
    const box4 = el10['getBoundingClientRect']?.(),
      box5 = el9['getBoundingClientRect']?.(),
      scope = windowObject?.['getComputedStyle']?.(el9),
      input =
        Number['parseFloat'](scope?.['lineHeight']) ||
        (Number['parseFloat'](scope?.['fontSize']) || 14) * 1.5,
      output = Math['max'](16, Math['min'](36, Number(box4?.['height']) || input)),
      value2 = Number['isFinite'](Number(box4?.['left']))
        ? Number(box4['left'])
        : Number(event4['clientX']) || 0,
      value3 =
        Number(box4?.['height']) > 0
          ? Number(box4['top'])
          : (Number(event4['clientY']) || 0) - output / 2,
      value4 = Number(box5?.['top']) + 4,
      value5 = Number(box5?.['bottom']) - output - 4,
      value6 =
        Number['isFinite'](value4) && Number['isFinite'](value5) && value5 >= value4
          ? Math['max'](value4, Math['min'](value5, value3))
          : value3;
    return (
      !el2 &&
        ((el2 = documentObject['createElement']('span')),
        (el2['className'] = 'story-asset-drop-caret'),
        el2['setAttribute']('aria-hidden', 'true'),
        root?.['appendChild']?.(el2)),
      (el2['style']['left'] = Math['round'](value2) + 'px'),
      (el2['style']['top'] = Math['round'](value6) + 'px'),
      (el2['style']['height'] = Math['round'](output) + 'px'),
      (el2['hidden'] = false),
      el10
    );
  }
  function begin(pointerId) {
    const element = pointerId['target']?.['closest']?.('[data-story-reference-asset]'),
      assetId = normalizeText(element?.['dataset']?.['storyReferenceAsset']),
      assetIndex = Math['max'](
        0,
        Math['trunc'](Number(element?.['dataset']?.['storyReferenceAssetIndex']) || 0),
      );
    if (!element || !assetId || pointerId['button'] !== 0) return ((event = null), false);
    return (
      (event = {
        assetId: assetId,
        assetIndex: assetIndex,
        element: element,
        pointerId: pointerId['pointerId'],
        startX: Number(pointerId['clientX']) || 0,
        startY: Number(pointerId['clientY']) || 0,
        active: false,
      }),
      (element['draggable'] = false),
      element['setPointerCapture']?.(pointerId['pointerId']),
      true
    );
  }
  function run4(event5) {
    const event6 = event;
    if (!event6 || event6['pointerId'] !== event5['pointerId']) return false;
    if (!event6['active']) {
      const value7 = (Number(event5['clientX']) || 0) - event6['startX'],
        value8 = (Number(event5['clientY']) || 0) - event6['startY'];
      if (Math['hypot'](value7, value8) < 8) return false;
      ((event6['active'] = true),
        event6['element']?.['classList']['add']('is-story-asset-dragging'),
        hideHoverPreview(),
        run(event6['element']));
    }
    (run2(event5),
      root?.['querySelectorAll']?.('.is-story-asset-drop-target')?.['forEach']?.((el11) => {
        el11['classList']['remove']('is-story-asset-drop-target');
      }));
    const el12 = run3(event5);
    el12?.['classList']['add']('is-story-asset-drop-target');
    const value9 = el12?.['querySelector']?.('[data-story-clip-prompt]');
    event6['triggerRange'] = value9 ? showCaret(value9, event5) : null;
    if (!el12) hideCaret();
    return (event5['preventDefault']?.(), true);
  }
  function finish(event7, { cancelled: cancelled = false } = {}) {
    const assetIndex2 = event;
    if (!assetIndex2 || assetIndex2['pointerId'] !== event7['pointerId']) return false;
    const el13 = cancelled ? null : run3(event7),
      value10 = assetIndex2['active'] && Boolean(el13);
    ((event = null), (assetIndex2['element']['draggable'] = true));
    assetIndex2['element']['hasPointerCapture']?.(event7['pointerId']) &&
      assetIndex2['element']['releasePointerCapture'](event7['pointerId']);
    if (!assetIndex2['active']) return false;
    (event7['preventDefault']?.(), event7['stopPropagation']?.());
    const value11 = value10 ? el13['querySelector']?.('[data-story-clip-prompt]') : null,
      triggerRange = value10 ? showCaret(value11, event7) || assetIndex2['triggerRange'] : null;
    return (
      clear(),
      value10 &&
        insertMention(assetIndex2['assetId'], {
          assetIndex: assetIndex2['assetIndex'],
          triggerRange: triggerRange,
        }),
      true
    );
  }
  function handleWindowPointerMove(event8) {
    if (!run4(event8)) return;
    event8['stopPropagation']?.();
  }
  function handleWindowPointerUp(value12) {
    finish(value12);
  }
  function handleWindowPointerCancel(event9) {
    if (finish(event9, { cancelled: true })) return;
    if (event?.['pointerId'] === event9['pointerId']) event = null;
  }
  return Object['freeze']({
    begin: begin,
    cancelSession: () => {
      event = null;
    },
    clear: clear,
    finish: finish,
    handleWindowPointerCancel: handleWindowPointerCancel,
    handleWindowPointerMove: handleWindowPointerMove,
    handleWindowPointerUp: handleWindowPointerUp,
    hasSession: () => Boolean(event),
    hideCaret: hideCaret,
    isActive: () => event?.['active'] === true,
    showCaret: showCaret,
  });
}
