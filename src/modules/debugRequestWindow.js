import { maskDebugPayloadSecrets } from '../utils/debugRequestMasking.js';
import { DEBUG_WRENCH_ICON_HTML } from '../utils/debugRequestPreview.js';
import { buildDebugJsonPreview } from '../utils/debugImagePreview.js';
import { renderDebugRequestImages } from './debugRequestImages.js';
const windows = new WeakMap(),
  rememberedBounds = new WeakMap(),
  BOUNDS_STORAGE_KEY = 'aicanvas.request-debug-window.bounds.v1';
function readWindowBounds(value) {
  if (rememberedBounds['has'](value)) return rememberedBounds['get'](value);
  try {
    const box = JSON['parse'](value['localStorage']?.['getItem'](BOUNDS_STORAGE_KEY) || 'null');
    if (
      box &&
      ['left', 'top', 'width', 'height']['every']((item) => Number['isFinite'](box[item])) &&
      box['width'] > 0 &&
      box['height'] > 0
    )
      return box;
  } catch {}
  return null;
}
export const DEBUG_GEAR_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 3-.6 2.2-2 .9-2-.6-2 3.4 1.5 1.6v2.3L2.4 15l2 3.4 2-.6 2 .9L9 21h4l.6-2.3 2-.9 2 .6 2-3.4-1.5-1.6v-2.3l1.5-1.6-2-3.4-2 .6-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg>';
export function isRequestDebugEnabled(key = globalThis['window']) {
  return key?.['DEV_MODE'] === true;
}
export function renderRequestDebugButton(index = '') {
  return (
    '<button type="button" class="request-debug-trigger debug-wrench-btn" aria-label="调试请求" data-tooltip="预览生成提示词和请求参数" ' +
    index +
    '>' +
    DEBUG_GEAR_ICON +
    '</button>'
  );
}
export function closeDebugRequestWindow(result = globalThis['document']) {
  windows['get'](result)?.['close']();
}
export function openDebugRequestWindow({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = documentObject?.['defaultView'] || globalThis['window'],
  title: title = 'API 请求调试',
  subtitle: subtitle = '',
  outputText: outputText,
  payload: payload,
  tabs: tabs,
  images: images,
  prepare: prepare,
  requireDeveloperMode: requireDeveloperMode = true,
} = {}) {
  if (!documentObject?.['body'] || (requireDeveloperMode && !isRequestDebugEnabled(windowObject)))
    return null;
  closeDebugRequestWindow(documentObject);
  const data = documentObject['activeElement'],
    el = documentObject['createElement']('section');
  ((el['className'] = 'request-debug-window'),
    el['setAttribute']('role', 'dialog'),
    el['setAttribute']('aria-label', title),
    (el['innerHTML'] =
      '<header class="request-debug-header"><strong></strong><button type="button" aria-label="关闭调试窗口">×</button></header><p class="request-debug-subtitle"></p><nav class="request-debug-tabs"></nav><pre class="request-debug-code custom-scrollbar" tabindex="0"></pre><footer><span role="status"></span><button type="button">复制当前内容</button></footer>'),
    (el['querySelector']('strong')['textContent'] = title),
    (el['querySelector']('.request-debug-subtitle')['textContent'] = subtitle));
  const options = el['querySelector']('pre'),
    target = el['querySelector']('nav'),
    el2 = el['querySelector']('[role="status"]'),
    el3 = el['querySelector']('footer button'),
    source = documentObject['createElement']('div');
  ((source['className'] = 'request-debug-image-preview'), (source['hidden'] = true), el['append'](source));
  let next = '',
    enabled = false,
    box2 = null,
    current = null;
  const list = [],
    handler = (el4, entry, record, handle) => {
      (el4['addEventListener'](entry, record, handle),
        list['push'](() => el4['removeEventListener'](entry, record, handle)));
    },
    handler2 = () => {
      (windowObject['clearTimeout'](current), (current = null));
      if (!el['isConnected']) return;
      const box3 = el['getBoundingClientRect'](),
        state = windowObject['getComputedStyle'](el),
        config = {
          left: box3['left'],
          top: box3['top'],
          width: parseFloat(state['width']),
          height: parseFloat(state['height']),
        };
      if (!(config['width'] > 0 && config['height'] > 0)) return;
      rememberedBounds['set'](windowObject, config);
      try {
        windowObject['localStorage']?.['setItem'](BOUNDS_STORAGE_KEY, JSON['stringify'](config));
      } catch {}
    },
    handler3 = () => {
      (windowObject['clearTimeout'](current), (current = windowObject['setTimeout'](handler2, 150)));
    },
    handler4 = () => {
      if (enabled) return;
      (handler2(),
        (enabled = true),
        list['forEach']((handler5) => handler5()),
        el['remove'](),
        windows['delete'](documentObject));
      if (data?.['isConnected']) data['focus']?.({ preventScroll: true });
    },
    handler6 = (scope, input) => {
      const box4 = el['getBoundingClientRect']();
      ((el['style']['left'] =
        Math['max'](0, Math['min'](scope, windowObject['innerWidth'] - box4['width'])) + 'px'),
        (el['style']['top'] =
          Math['max'](0, Math['min'](input, windowObject['innerHeight'] - box4['height'])) + 'px'),
        (el['style']['right'] = 'auto'));
    };
  (handler(el['querySelector']('header button'), 'click', handler4),
    handler(el, 'keydown', (event) => {
      event['stopPropagation']();
      event['key'] === 'Escape' && (event['preventDefault'](), handler4());
      if (
        (event['ctrlKey'] || event['metaKey']) &&
        event['key']['toLowerCase']() === 'a' &&
        event['target'] === options
      ) {
        event['preventDefault']();
        const output = documentObject['createRange']();
        output['selectNodeContents'](options);
        const value2 = windowObject['getSelection']();
        (value2['removeAllRanges'](), value2['addRange'](output));
      }
    }),
    handler(el, 'pointerdown', (value3) => value3['stopPropagation']()),
    handler(el, 'wheel', (value4) => value4['stopPropagation'](), { passive: true }),
    handler(
      options,
      'scroll',
      () => {
        ((source['hidden'] = true), source['replaceChildren']());
      },
      { passive: true },
    ),
    handler(el['querySelector']('header'), 'pointerdown', (value5) => {
      if (value5['button'] !== 0 || value5['target']['closest']('button')) return;
      value5['preventDefault']();
      const box5 = el['getBoundingClientRect']();
      box2 = { x: value5['clientX'] - box5['left'], y: value5['clientY'] - box5['top'] };
    }),
    handler(windowObject, 'pointermove', (event2) => {
      if (box2) handler6(event2['clientX'] - box2['x'], event2['clientY'] - box2['y']);
    }),
    handler(windowObject, 'pointerup', () => {
      if (box2) handler2();
      box2 = null;
    }),
    handler(windowObject, 'pointercancel', () => {
      if (box2) handler2();
      box2 = null;
    }),
    handler(windowObject, 'pagehide', handler2),
    handler(windowObject, 'resize', () => {
      const box6 = el['getBoundingClientRect']();
      handler6(box6['left'], box6['top']);
    }),
    handler(windowObject, 'dev-mode-changed', () => {
      if (!isRequestDebugEnabled(windowObject)) handler4();
    }),
    handler(el3, 'click', async () => {
      try {
        await windowObject['navigator']['clipboard']['writeText'](next);
        if (!enabled) el2['textContent'] = '已复制';
      } catch {
        if (!enabled) el2['textContent'] = '复制失败，可选择文本手动复制';
      }
    }));
  const run = (args = {}) => {
    if (enabled) return;
    (el['removeAttribute']('aria-busy'),
      (el3['disabled'] = false),
      (el2['textContent'] = '只读预览 · 未提交生成'));
    const list2 = args['tabs'] || [
      {
        label: '请求参数',
        ...(args['outputText'] != null
          ? { content: args['outputText'], images: args['images'] }
          : buildDebugJsonPreview(maskDebugPayloadSecrets(args['payload'] || {}))),
      },
    ];
    (target['replaceChildren'](),
      list2['forEach']((value6, enabled2) => {
        const el5 = documentObject['createElement']('button');
        ((el5['type'] = 'button'),
          (el5['textContent'] = value6['label']),
          el5['addEventListener']('click', () => {
            ((next = value6['content'] || ''),
              renderDebugRequestImages(options, next, value6['images'], source),
              target['querySelectorAll']('button')['forEach']((value7) =>
                value7['setAttribute']('aria-pressed', String(value7 === el5)),
              ));
          }),
          target['append'](el5));
        if (!enabled2) el5['click']();
      }));
  };
  documentObject['body']['append'](el);
  const box7 = readWindowBounds(windowObject);
  box7 &&
    ((el['style']['width'] = box7['width'] + 'px'),
    (el['style']['height'] = box7['height'] + 'px'),
    handler6(box7['left'], box7['top']));
  if (windowObject['ResizeObserver']) {
    const value8 = new windowObject['ResizeObserver'](() => {
      if (!enabled) {
        const value9 = el['getBoundingClientRect']();
        (handler6(value9['left'], value9['top']), handler3());
      }
    });
    (value8['observe'](el), list['push'](() => value8['disconnect']()));
  }
  (windows['set'](documentObject, { close: handler4, root: el }),
    el['querySelector']('header button')['focus']({ preventScroll: true }));
  if (prepare)
    (el['setAttribute']('aria-busy', 'true'),
      (options['textContent'] = '正在组装调试内容…'),
      (el3['disabled'] = true),
      (el2['innerHTML'] = DEBUG_WRENCH_ICON_HTML),
      Promise['resolve']()
        ['then'](prepare)
        ['then'](run, (error) => {
          run({ outputText: error?.['message'] || '请求预览失败' });
          if (!enabled) el2['textContent'] = '组装失败 · 未提交生成';
        }));
  else run({ outputText: outputText, payload: payload, tabs: tabs, images: images });
  return { root: el, close: handler4, update: run };
}
