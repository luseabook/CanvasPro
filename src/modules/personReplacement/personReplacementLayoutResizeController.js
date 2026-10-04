import {
  normalizePersonReplacementAssetDetailSplitRatio,
  normalizePersonReplacementCompositeSidebarWidth,
  normalizePersonReplacementLayout,
} from './personReplacementProjectSession.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function renderPersonReplacementLayoutSplitter(item, key, index = {}) {
  const result = item === 'asset-detail',
    data = item === 'center' || result,
    options = result
      ? normalizePersonReplacementAssetDetailSplitRatio(key['assetDetailSplitRatio'])
      : item === 'center'
        ? key['centerTop']
        : key[item],
    target = result ? 0x20 : item === 'center' ? 0x26 : item === 'left' ? 0x12 : 0x18,
    source = result ? 0x44 : item === 'center' ? 0x52 : item === 'left' ? 0x26 : 0x2a,
    next =
      index['label'] ||
      (result
        ? '调整形象预览与提示词区域高度'
        : item === 'center'
          ? '调整中间上下区域高度'
          : item === 'left'
            ? '调整左侧素材栏宽度'
            : '调整右侧生成栏宽度'),
    current = result ? ' data-person-replacement-asset-detail-splitter' : '';
  return (
    '<div class="person-replacement-layout-splitter panel-resize-handle panel-resize-handle--transient ' +
    (data ? 'panel-resize-handle--horizontal is-horizontal' : 'is-vertical') +
    ' is-' +
    item +
    '" data-person-replacement-layout-splitter="' +
    item +
    '\x22' +
    current +
    ' role="separator" aria-orientation="' +
    (data ? 'horizontal' : 'vertical') +
    '" aria-label="' +
    next +
    '\x22\x20aria-valuemin=\x22' +
    target +
    '" aria-valuemax="' +
    source +
    '" aria-valuenow="' +
    Math['round'](options) +
    '\x22\x20tabindex=\x220\x22></div>'
  );
}
export function applyPersonReplacementCompositeSidebarWidthToLayout(el, el2, entry) {
  const personReplacementCompositeSidebarWidth = normalizePersonReplacementCompositeSidebarWidth(entry);
  return (
    el?.['style']?.['setProperty']?.(
      '--person-replacement-composite-sidebar-width',
      personReplacementCompositeSidebarWidth + 'px',
    ),
    el2?.['setAttribute']?.('aria-valuenow', String(Math['round'](personReplacementCompositeSidebarWidth))),
    personReplacementCompositeSidebarWidth
  );
}
export function createPersonReplacementLayoutResizeController({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  getProject: getProject,
  commitLayoutChange: commitLayoutChange,
} = {}) {
  if (typeof getProject !== 'function' || typeof commitLayoutChange !== 'function')
    throw new TypeError('Person replacement layout resize requires project and commit adapters.');
  let value2 = null;
  const destroy = () => {
      (value2?.(), (value2 = null));
    },
    begin = (event, el3) => {
      if (!event || !el3) return ![];
      if (event['isPrimary'] === ![] || (Number['isFinite'](event['button']) && event['button'] !== 0x0))
        return ![];
      const text = normalizeText(el3['dataset']?.['personReplacementLayoutSplitter']);
      if (!['left', 'center', 'right', 'asset-detail']['includes'](text)) return ![];
      const record = text === 'asset-detail',
        payload = text === 'center',
        handle = payload || record,
        el4 = record
          ? el3['closest']?.('[data-person-replacement-asset-detail-layout]')
          : payload
            ? el3['closest']?.('.person-replacement-middle-layout') ||
              el3['closest']?.('.person-replacement-generation-panel')
            : el3['closest']?.('[data-person-replacement-layout]'),
        el5 = el3['closest']?.('[data-person-replacement-layout]'),
        box = el4?.['getBoundingClientRect']?.(),
        count = handle ? Number(box?.['height']) : Number(box?.['width']);
      if (!(count > 0x0)) return ![];
      (event['preventDefault']?.(), event['stopPropagation']?.(), destroy());
      const state = event['pointerId'];
      try {
        el3['setPointerCapture']?.(state);
      } catch {}
      (el3['classList']?.['add']?.('is-active'),
        documentObject?.['body']?.['classList']?.['add']?.('person-replacement-layout-resizing'));
      const run = (event2) =>
        !Number['isFinite'](Number(state)) ||
        !Number['isFinite'](Number(event2?.['pointerId'])) ||
        Number(event2['pointerId']) === Number(state);
      let value3 = null,
        config = 0x0;
      const run2 = (event3) => {
          if (!event3) return;
          const scope = handle ? event3['clientY'] : event3['clientX'],
            input = handle ? box['top'] : box['left'],
            output = ((Number(scope) - Number(input || 0x0)) / count) * 0x64,
            centerTop = Math['round']((text === 'right' ? 0x64 - output : output) * 0x64) / 0x64,
            value4 = getProject();
          if (record) {
            const personReplacementAssetDetailSplitRatio =
              normalizePersonReplacementAssetDetailSplitRatio(centerTop);
            ((value4['workspace']['assetDetailSplitRatio'] = personReplacementAssetDetailSplitRatio),
              el4['style']?.['setProperty']?.(
                '--person-replacement-asset-detail-top',
                personReplacementAssetDetailSplitRatio + '%',
              ),
              el3['setAttribute']?.(
                'aria-valuenow',
                String(Math['round'](personReplacementAssetDetailSplitRatio)),
              ));
            return;
          }
          const args = value4['workspace']['replacementLayout'],
            personReplacementLayout = normalizePersonReplacementLayout({
              ...args,
              ...(text === 'center' ? { centerTop: centerTop } : { [text]: centerTop }),
            });
          ((value4['workspace']['replacementLayout'] = personReplacementLayout),
            text === 'center'
              ? el5?.['style']?.['setProperty']?.(
                  '--person-replacement-center-top',
                  personReplacementLayout['centerTop'] + '%',
                )
              : el4['style']?.['setProperty']?.(
                  '--person-replacement-' + text + '-width',
                  personReplacementLayout[text] + '%',
                ),
            el3['setAttribute']?.(
              'aria-valuenow',
              String(Math['round'](personReplacementLayout[text === 'center' ? 'centerTop' : text])),
            ));
        },
        handler = () => {
          config = 0x0;
          const value5 = value3;
          ((value3 = null), run2(value5));
        },
        handler2 = (clientX) => {
          if (!run(clientX)) return;
          value3 = { clientX: clientX?.['clientX'], clientY: clientX?.['clientY'] };
          if (config) return;
          const value6 = windowObject?.['requestAnimationFrame'];
          if (typeof value6 === 'function') {
            config = value6['call'](windowObject, handler);
            return;
          }
          handler();
        },
        value7 = (clientX2) => {
          if (!run(clientX2)) return;
          const value8 = handle ? Number(clientX2?.['clientY']) : Number(clientX2?.['clientX']);
          (Number['isFinite'](value8) &&
            (value3 = { clientX: clientX2?.['clientX'], clientY: clientX2?.['clientY'] }),
            config &&
              typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
              windowObject['cancelAnimationFrame'](config),
            handler(),
            destroy(),
            commitLayoutChange(text));
        },
        value9 = () => {
          config &&
            typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
            windowObject['cancelAnimationFrame'](config);
          ((config = 0x0),
            (value3 = null),
            el3['classList']?.['remove']?.('is-active'),
            documentObject?.['body']?.['classList']?.['remove']?.('person-replacement-layout-resizing'));
          try {
            el3['releasePointerCapture']?.(state);
          } catch {}
          (windowObject?.['removeEventListener']?.('pointermove', handler2, !![]),
            windowObject?.['removeEventListener']?.('pointerup', value7, !![]),
            windowObject?.['removeEventListener']?.('pointercancel', value7, !![]));
          if (value2 === value9) value2 = null;
        };
      return (
        (value2 = value9),
        windowObject?.['addEventListener']?.('pointermove', handler2, !![]),
        windowObject?.['addEventListener']?.('pointerup', value7, !![]),
        windowObject?.['addEventListener']?.('pointercancel', value7, !![]),
        handler2(event),
        !![]
      );
    };
  return Object['freeze']({ begin: begin, destroy: destroy, stop: destroy });
}
